import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import {
  Order,
  OrderPriority,
  OrderStatus,
  OrderAttachmentKind,
  OrderAttachment,
  OrderDepartmentTask,
} from './entities/order.entity';
import { OrderFlow, FlowAction } from './entities/order-flow.entity';
import { OrderApproval, ApprovalType, ApprovalStatus } from './entities/order-approval.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UsersService } from '../users/users.service';
import { CountiesService } from '../counties/counties.service';
import { DepartmentsService } from '../departments/departments.service';
import { UserRole } from '../users/entities/user.entity';
import { DepartmentType } from '../departments/entities/department.entity';
import { AssignOrderDto, ProcessOrderDto, TransferOrderDto } from './dto/process-order.dto';

interface CurrentUser {
  id: number;
  username: string;
  name: string;
  role: UserRole;
  countyId: number | null;
  departmentId: number | null;
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(OrderFlow)
    private orderFlowsRepository: Repository<OrderFlow>,
    @InjectRepository(OrderApproval)
    private orderApprovalsRepository: Repository<OrderApproval>,
    private usersService: UsersService,
    private countiesService: CountiesService,
    private departmentsService: DepartmentsService,
  ) {}

  async create(dto: CreateOrderDto, user: CurrentUser) {
    const creatorCountyId = user.countyId;
    const creatorDepartmentId = user.departmentId ?? null;

    if (!creatorCountyId) {
      throw new BadRequestException('员工档案缺少所属公司信息，暂时无法创建工单');
    }

    const county = await this.countiesService.findById(creatorCountyId);
    if (!county) {
      throw new NotFoundException('所属旗县不存在');
    }

    if (creatorDepartmentId) {
      const department = await this.departmentsService.findById(creatorDepartmentId);
      if (!department) {
        throw new NotFoundException('所属部门不存在');
      }
    }

    const order = this.ordersRepository.create({
      title: this.buildOrderTitle(dto),
      type: dto.type?.trim() || 'issue',
      priority: dto.priority || OrderPriority.NORMAL,
      description: dto.description.trim(),
      creatorId: user.id,
      creatorCountyId,
      creatorDepartmentId,
      currentCountyId: creatorCountyId,
      currentDepartmentId: null,
      assignedDepartmentIds: [],
      departmentTasks: [],
      attachments: [],
      status: OrderStatus.PENDING,
    });

    const savedOrder = await this.ordersRepository.save(order);

    await this.addFlow(
      savedOrder.id,
      FlowAction.CREATE,
      null,
      null,
      null,
      null,
      `工单提交成功，已自动流转到${county.name}网络部负责人`,
      user,
    );

    return this.serializeOrder(savedOrder, { includeFlows: true, includeApprovals: true, user });
  }

  async findAll(user: CurrentUser, status?: string) {
    const orders = await this.ordersRepository.find({
      order: { createTime: 'DESC' },
    });

    const visibleOrders = orders.filter((order) => this.canViewOrderInList(order, user));
    const filteredOrders = status
      ? visibleOrders.filter((order) => order.status === status)
      : visibleOrders;

    return {
      orders: await Promise.all(filteredOrders.map((order) => this.serializeOrder(order))),
      total: filteredOrders.length,
    };
  }

  async findById(id: number, user: CurrentUser) {
    const order = await this.getOrderOrThrow(id);
    this.ensureCanViewOrder(order, user);

    return this.serializeOrder(order, {
      includeFlows: true,
      includeApprovals: true,
      user,
    });
  }

  async assignDepartment(orderId: number, dto: AssignOrderDto, user: CurrentUser) {
    const order = await this.getOrderOrThrow(orderId);
    const requestedDepartmentIds = Array.from(
      new Set(
        (dto.departmentIds && dto.departmentIds.length > 0
          ? dto.departmentIds
          : [dto.departmentId])
          .map((item) => Number(item))
          .filter(Number.isInteger),
      ),
    );

    if (user.role !== UserRole.COUNTY_HANDLER) {
      throw new ForbiddenException('只有公司网络部负责人可以提交到市级处理部门');
    }

    if (order.creatorCountyId !== user.countyId) {
      throw new ForbiddenException('只能处理本旗县的工单');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('工单状态不正确，只有待公司网络部审核的工单可以提交市级部门');
    }

    if (!requestedDepartmentIds.length) {
      throw new BadRequestException('请至少选择一个支撑部门');
    }

    const departments = await Promise.all(
      requestedDepartmentIds.map(async (departmentId) => {
        const department = await this.departmentsService.findById(departmentId);
        if (!department || !this.isCoreDepartment(department.type)) {
          throw new NotFoundException('部门不存在');
        }
        return department;
      }),
    );

    const processingDepartments = departments.filter(
      (department, index, array) => array.findIndex((item) => item.id === department.id) === index,
    );
    const primaryDepartment = processingDepartments[0];
    const assignedDepartmentIds = processingDepartments.map((department) => department.id);

    order.currentCountyId = order.creatorCountyId;
    order.currentDepartmentId = assignedDepartmentIds.length === 1 ? primaryDepartment.id : null;
    order.assignedDepartmentIds = assignedDepartmentIds;
    order.status = OrderStatus.PROCESSING;
    order.creatorConfirmed = false;
    order.leaderConfirmed = false;
    order.departmentTasks = [];

    const savedOrder = await this.ordersRepository.save(order);
    const departmentNames = processingDepartments.map((department) => department.name);

    await this.addFlow(
      order.id,
      FlowAction.ASSIGN,
      null,
      assignedDepartmentIds.length === 1 ? primaryDepartment.id : null,
      null,
      null,
      dto.comment?.trim() || (
        departmentNames.length > 1
          ? `公司网络部负责人已提交至市级部门：${departmentNames.join('、')}，等待其中一位负责人完成定级后进入协作处理`
          : `公司网络部负责人已提交至市级部门：${departmentNames[0]}，等待负责人完成定级`
      ),
      user,
    );

    return this.serializeOrder(savedOrder, { includeFlows: true, includeApprovals: true, user });
  }

  async transferDepartment(orderId: number, dto: TransferOrderDto, user: CurrentUser) {
    const order = await this.getOrderOrThrow(orderId);
    const targetDepartmentId = dto.targetDepartmentId;

    if (user.role !== UserRole.DEPARTMENT_HEAD) {
      throw new ForbiddenException('只有部门负责人可以流转工单');
    }

    if (order.currentDepartmentId !== user.departmentId) {
      throw new ForbiddenException('只能流转当前由本部门负责的工单');
    }

    if (order.status !== OrderStatus.PROCESSING) {
      throw new BadRequestException('工单状态不正确，只有处理中的工单可以流转');
    }

    const targetDepartment = await this.departmentsService.findById(targetDepartmentId);
    if (!targetDepartment || !this.isCoreDepartment(targetDepartment.type)) {
      throw new NotFoundException('目标部门不存在');
    }

    if (order.currentDepartmentId === targetDepartmentId) {
      throw new BadRequestException('目标部门不能与当前部门相同');
    }

    const fromDepartmentId = order.currentDepartmentId;

    order.currentDepartmentId = targetDepartmentId;
    order.currentCountyId = order.creatorCountyId;

    const savedOrder = await this.ordersRepository.save(order);

    await this.addFlow(
      order.id,
      FlowAction.TRANSFER,
      fromDepartmentId,
      targetDepartmentId,
      null,
      null,
      dto.comment?.trim() || `工单流转至：${targetDepartment.name}`,
      user,
    );

    return this.serializeOrder(savedOrder, { includeFlows: true, includeApprovals: true, user });
  }

  async processOrder(orderId: number, dto: ProcessOrderDto, user: CurrentUser) {
    const order = await this.getOrderOrThrow(orderId);

    if (user.role !== UserRole.DEPARTMENT_HEAD) {
      throw new ForbiddenException('只有市级处理部门负责人可以处理工单');
    }

    if (order.status !== OrderStatus.PROCESSING) {
      throw new BadRequestException('工单状态不正确');
    }

    if (!user.departmentId) {
      throw new BadRequestException('当前账号缺少部门信息');
    }

    if (Array.isArray(order.departmentTasks) && order.departmentTasks.length > 0) {
      throw new BadRequestException('工单已经进入协同处理阶段');
    }

    if (!this.isAssignedCityDepartment(order, user.departmentId)) {
      throw new ForbiddenException('只有已被提交的市级负责人可以执行定级');
    }

    const nextPriority = dto.priority || order.priority || OrderPriority.NORMAL;
    if (nextPriority === OrderPriority.CRITICAL) {
      const topLeaders = await this.usersService.findTopLeaders();
      if (!topLeaders.length) {
        throw new BadRequestException('系统中没有可用的最高领导账号，无法发起重大事件审批');
      }
    }

    const departmentIds = Array.from(
      new Set([
        ...this.getAssignedDepartmentIds(order),
        ...((dto.departmentIds || []).map((item) => Number(item)).filter(Number.isInteger)),
      ]),
    ).filter((departmentId) => departmentId !== user.departmentId);

    const departments = await Promise.all(
      departmentIds.map(async (departmentId) => {
        const department = await this.departmentsService.findById(departmentId);
        if (!department || !this.isCoreDepartment(department.type)) {
          throw new NotFoundException('协同部门不存在');
        }
        return department;
      }),
    );

    const currentDepartment = await this.departmentsService.findById(user.departmentId);
    if (!currentDepartment || !this.isCoreDepartment(currentDepartment.type)) {
      throw new BadRequestException('当前账号所在部门不是可处理的核心部门');
    }

    const processingDepartments = [
      currentDepartment,
      ...departments.filter((department) => department.id !== currentDepartment.id),
    ];

    order.priority = nextPriority;
    order.departmentTasks = processingDepartments.map((department) => ({
      departmentId: department.id,
      departmentName: department.name,
      completed: false,
      completedById: null,
      completedByName: null,
      completedAt: null,
      comment: null,
    }));
    order.currentDepartmentId = user.departmentId;
    order.status = OrderStatus.PROCESSING;
    order.creatorConfirmed = false;
    order.leaderConfirmed = false;

    await this.orderApprovalsRepository.delete({ orderId: order.id });
    const savedOrder = await this.ordersRepository.save(order);
    const collaborationNames = departments.map((department) => department.name);
    const departmentNames = collaborationNames.length > 0
      ? collaborationNames.join('、')
      : '单部门处理';

    await this.addFlow(
      order.id,
      FlowAction.PROCESS,
      order.currentDepartmentId,
      null,
      null,
      null,
      dto.comment?.trim() || `市级负责人已定级为${this.getPriorityText(order.priority)}，处理模式：${departmentNames}`,
      user,
    );

    return this.serializeOrder(savedOrder, { includeFlows: true, includeApprovals: true, user });
  }

  async completeDepartmentTask(orderId: number, comment: string | undefined, user: CurrentUser) {
    const order = await this.getOrderOrThrow(orderId);

    if (user.role !== UserRole.DEPARTMENT_HEAD) {
      throw new ForbiddenException('只有市级协同部门负责人可以处理完成');
    }

    if (order.status !== OrderStatus.PROCESSING) {
      throw new BadRequestException('工单状态不正确，当前不能执行处理完成');
    }

    if (!user.departmentId) {
      throw new BadRequestException('当前账号缺少部门信息');
    }

    const tasks = Array.isArray(order.departmentTasks) ? [...order.departmentTasks] : [];
    const task = tasks.find((item) => item.departmentId === user.departmentId);

    if (!task) {
      throw new ForbiddenException('当前部门不在该工单的协同处理范围内');
    }

    if (task.completed) {
      throw new BadRequestException('当前部门已经完成处理');
    }

    task.completed = true;
    task.completedById = user.id;
    task.completedByName = user.name;
    task.completedAt = new Date().toISOString();
    task.comment = comment?.trim() || '处理完成';

    order.departmentTasks = tasks;

    await this.addFlow(
      order.id,
      FlowAction.COMPLETE,
      task.departmentId,
      null,
      null,
      null,
      comment?.trim() || `${task.departmentName}已完成处理`,
      user,
    );

    const remainingTasks = tasks.filter((item) => !item.completed);

    if (remainingTasks.length === 0) {
      await this.createFinalApprovals(order);
      order.status = OrderStatus.WAITING_CONFIRM;
      const savedOrder = await this.ordersRepository.save(order);

      await this.addFlow(
        order.id,
        FlowAction.PROCESS,
        task.departmentId,
        null,
        null,
        null,
        '所有协同部门已完成处理，等待发起人确认',
        user,
      );

      return this.serializeOrder(savedOrder, { includeFlows: true, includeApprovals: true, user });
    }

    const savedOrder = await this.ordersRepository.save(order);
    return this.serializeOrder(savedOrder, { includeFlows: true, includeApprovals: true, user });
  }

  async uploadAttachment(
    orderId: number,
    kind: OrderAttachmentKind,
    file: any,
    user: CurrentUser,
  ) {
    if (!file) {
      throw new BadRequestException('请选择要上传的附件');
    }

    const order = await this.getOrderOrThrow(orderId);

    if (!this.canUploadAttachment(order, user, kind)) {
      throw new ForbiddenException('当前账号没有权限上传该附件');
    }

    const attachment: OrderAttachment = {
      id: randomUUID(),
      kind,
      originalName: file.originalname,
      storedName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`,
      uploadedById: user.id,
      uploadedByName: user.name,
      uploadedAt: new Date().toISOString(),
    };

    order.attachments = [...(Array.isArray(order.attachments) ? order.attachments : []), attachment];
    const savedOrder = await this.ordersRepository.save(order);

    await this.addFlow(
      order.id,
      FlowAction.ATTACHMENT,
      null,
      null,
      null,
      null,
      `${kind === 'issue' ? '问题附件上传' : '处理证明上传'}：${file.originalname}`,
      user,
    );

    return this.serializeOrder(savedOrder, { includeFlows: true, includeApprovals: true, user });
  }

  async confirmOrder(orderId: number, comment: string | undefined, user: CurrentUser) {
    const order = await this.getOrderOrThrow(orderId);

    if (order.status !== OrderStatus.WAITING_CONFIRM) {
      throw new BadRequestException('工单状态不正确');
    }

    const pendingApproval = await this.orderApprovalsRepository.findOne({
      where: {
        orderId: order.id,
        userId: user.id,
        status: ApprovalStatus.PENDING,
      },
    });

    if (!pendingApproval) {
      throw new ForbiddenException('当前账号没有待处理的确认任务');
    }

    pendingApproval.status = ApprovalStatus.APPROVED;
    await this.orderApprovalsRepository.save(pendingApproval);

    if (pendingApproval.approvalType === ApprovalType.CREATOR) {
      order.creatorConfirmed = true;
    }

    if (pendingApproval.approvalType === ApprovalType.LEADER) {
      order.leaderConfirmed = true;
    }

    await this.addFlow(
      order.id,
      FlowAction.CONFIRM,
      order.currentDepartmentId,
      null,
      null,
      null,
      comment?.trim() || `${pendingApproval.approvalType === ApprovalType.CREATOR ? '发起人' : '最高领导'}确认通过`,
      user,
    );

    const remainingApprovals = await this.orderApprovalsRepository.count({
      where: {
        orderId: order.id,
        status: ApprovalStatus.PENDING,
      },
    });

    if (remainingApprovals === 0) {
      order.status = OrderStatus.COMPLETED;
    }

    const savedOrder = await this.ordersRepository.save(order);
    return this.serializeOrder(savedOrder, { includeFlows: true, includeApprovals: true, user });
  }

  async rejectOrder(orderId: number, reason: string, user: CurrentUser) {
    const order = await this.getOrderOrThrow(orderId);

    if (!this.canRejectOrder(order, user)) {
      throw new ForbiddenException('只有所属公司网络部负责人可以驳回工单');
    }

    order.status = OrderStatus.REJECTED;
    order.creatorConfirmed = false;
    order.leaderConfirmed = false;

    await this.orderApprovalsRepository.delete({ orderId: order.id });
    const savedOrder = await this.ordersRepository.save(order);

    await this.addFlow(
      order.id,
      FlowAction.REJECT,
      order.currentDepartmentId,
      null,
      null,
      null,
      `公司网络部负责人驳回：${reason}`,
      user,
    );

    return this.serializeOrder(savedOrder, { includeFlows: true, includeApprovals: true, user });
  }

  async resubmitOrder(orderId: number, dto: CreateOrderDto, user: CurrentUser) {
    const order = await this.getOrderOrThrow(orderId);

    if (order.creatorId !== user.id) {
      throw new ForbiddenException('只有发起人可以重新编辑并提交该工单');
    }

    if (order.status !== OrderStatus.REJECTED) {
      throw new BadRequestException('只有已驳回的工单才能重新提交');
    }

    const creatorCountyId = user.countyId;
    if (!creatorCountyId) {
      throw new BadRequestException('员工档案缺少所属公司信息，暂时无法重新提交工单');
    }

    const county = await this.countiesService.findById(creatorCountyId);
    if (!county) {
      throw new NotFoundException('所属旗县不存在');
    }

    order.title = this.buildOrderTitle(dto);
    order.type = dto.type?.trim() || order.type || 'issue';
    order.description = dto.description.trim();
    order.priority = dto.priority || order.priority || OrderPriority.NORMAL;
    order.currentHandlerId = null;
    order.currentCountyId = creatorCountyId;
    order.currentDepartmentId = null;
    order.assignedDepartmentIds = [];
    order.departmentTasks = [];
    order.status = OrderStatus.PENDING;
    order.creatorConfirmed = false;
    order.leaderConfirmed = false;

    await this.orderApprovalsRepository.delete({ orderId: order.id });
    const savedOrder = await this.ordersRepository.save(order);

    await this.addFlow(
      order.id,
      FlowAction.CREATE,
      null,
      null,
      null,
      null,
      `发起人重新编辑后再次提交，已自动流转到${county.name}网络部负责人`,
      user,
    );

    return this.serializeOrder(savedOrder, { includeFlows: true, includeApprovals: true, user });
  }

  async getFlows(orderId: number, user: CurrentUser) {
    const order = await this.getOrderOrThrow(orderId);
    this.ensureCanViewOrder(order, user);

    const flows = await this.orderFlowsRepository.find({
      where: { orderId },
      order: { createTime: 'ASC' },
    });

    return Promise.all(flows.map((flow) => this.serializeFlow(flow)));
  }

  async getTopology(orderId: number, user: CurrentUser) {
    const order = await this.getOrderOrThrow(orderId);
    this.ensureCanViewOrder(order, user);

    const creator = await this.usersService.findById(order.creatorId);
    const county = await this.countiesService.findById(order.creatorCountyId);
    const currentDepartment = order.currentDepartmentId
      ? await this.departmentsService.findById(order.currentDepartmentId)
      : null;
    const departments = await this.departmentsService.findCoreDepartments();
    const assignedDepartmentIds = this.getAssignedDepartmentIds(order);
    const taskDepartmentIds = Array.from(
      new Set(
        (Array.isArray(order.departmentTasks) ? order.departmentTasks : [])
          .map((task) => Number(task.departmentId))
          .filter(Number.isInteger),
      ),
    );
    const routeDepartmentIds = taskDepartmentIds.length > 0 ? taskDepartmentIds : assignedDepartmentIds;
    const routeDepartments = departments.filter((department) => routeDepartmentIds.includes(department.id));
    const flows = await this.orderFlowsRepository.find({
      where: { orderId },
      order: { createTime: 'ASC' },
    });

    const visitedDepartmentIds = new Set<number>();
    flows.forEach((flow) => {
      if (flow.fromDepartmentId) {
        visitedDepartmentIds.add(flow.fromDepartmentId);
      }
      if (flow.toDepartmentId) {
        visitedDepartmentIds.add(flow.toDepartmentId);
      }
    });

    const nodes = [
      {
        id: 'creator',
        name: creator?.name || '发起人',
        dept: county?.name || '-',
        status: 'completed',
      },
      {
        id: 'county_handler',
        name: `${county?.name || '所属公司'}网络部负责人`,
        dept: county?.name || '-',
        status: order.status === OrderStatus.PENDING ? 'current' : 'completed',
      },
      ...routeDepartments.map((department) => ({
        id: `dept-${department.id}`,
        name: department.name,
        status: this.getTopologyDepartmentStatus(order, department.id, visitedDepartmentIds),
      })),
      {
        id: 'end',
        name: '闭环存档',
        status: order.status === OrderStatus.COMPLETED
          ? 'completed'
          : order.status === OrderStatus.WAITING_CONFIRM
            ? 'current'
            : 'pending',
      },
    ];

    const edges = [
      { from: 'creator', to: 'county_handler' },
      ...(order.status === OrderStatus.PENDING
        ? []
        : routeDepartmentIds.map((departmentId) => ({
            from: 'county_handler',
            to: `dept-${departmentId}`,
          }))),
      ...(order.status === OrderStatus.PENDING
        ? []
        : routeDepartmentIds.map((departmentId) => ({
            from: `dept-${departmentId}`,
            to: 'end',
          }))),
    ];

    return {
      nodes,
      edges,
      currentNode: this.getCurrentNodeLabel(
        order,
        county?.name || null,
        currentDepartment?.name || null,
        Array.isArray(order.departmentTasks) ? order.departmentTasks : [],
      ),
    };
  }

  private async addFlow(
    orderId: number,
    action: FlowAction,
    fromDepartmentId: number | null,
    toDepartmentId: number | null,
    fromUserId: number | null,
    toUserId: number | null,
    comment: string,
    operator: CurrentUser,
  ): Promise<void> {
    const flow = this.orderFlowsRepository.create({
      orderId,
      action,
      fromDepartmentId,
      toDepartmentId,
      fromUserId,
      toUserId,
      operatorId: operator.id,
      operatorName: operator.name,
      comment,
    });
    await this.orderFlowsRepository.save(flow);
  }

  private async getOrderOrThrow(id: number) {
    const order = await this.ordersRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException('工单不存在');
    }

    return order;
  }

  private async serializeOrder(
    order: Order,
    options: {
      includeFlows?: boolean;
      includeApprovals?: boolean;
      user?: CurrentUser;
    } = {},
  ) {
    const creator = await this.usersService.findById(order.creatorId);
    const creatorCounty = await this.countiesService.findById(order.creatorCountyId);
    const creatorDepartment = order.creatorDepartmentId
      ? await this.departmentsService.findById(order.creatorDepartmentId)
      : null;
    const currentCounty = order.currentCountyId
      ? await this.countiesService.findById(order.currentCountyId)
      : null;
    const currentDepartment = order.currentDepartmentId
      ? await this.departmentsService.findById(order.currentDepartmentId)
      : null;

    const approvals = options.includeApprovals
      ? await this.orderApprovalsRepository.find({
          where: { orderId: order.id },
          order: { createTime: 'ASC' },
        })
      : [];

    const flows = options.includeFlows
      ? await this.orderFlowsRepository.find({
          where: { orderId: order.id },
          order: { createTime: 'ASC' },
        })
      : [];

    const departmentTasks = Array.isArray(order.departmentTasks) ? order.departmentTasks : [];
    const attachments = Array.isArray(order.attachments) ? order.attachments : [];
    const assignedDepartmentIds = this.getAssignedDepartmentIds(order);

    return {
      id: order.id,
      title: order.title,
      type: order.type,
      description: order.description,
      priority: order.priority,
      priorityText: this.getPriorityText(order.priority),
      status: order.status,
      statusText: this.getStatusText(order),
      creatorId: order.creatorId,
      creatorName: creator?.name || '未知用户',
      creatorUsername: creator?.username || null,
      creatorRole: creator?.role || null,
      creatorCountyId: order.creatorCountyId,
      creatorCountyName: creatorCounty?.name || null,
      creatorDepartmentId: order.creatorDepartmentId,
      creatorDepartmentName: creatorDepartment?.name || null,
      currentCountyId: order.currentCountyId,
      currentCountyName: currentCounty?.name || null,
      currentDepartmentId: order.currentDepartmentId,
      currentDepartmentName: currentDepartment?.name || null,
      assignedDepartmentIds,
      currentNode: this.getCurrentNodeLabel(
        order,
        creatorCounty?.name || null,
        currentDepartment?.name || null,
        departmentTasks,
      ),
      creatorConfirmed: order.creatorConfirmed,
      leaderConfirmed: order.leaderConfirmed,
      departmentTasks,
      attachments,
      createTime: order.createTime,
      updateTime: order.updateTime,
      createdAt: order.createTime,
      updatedAt: order.updateTime,
      flows: options.includeFlows ? await Promise.all(flows.map((flow) => this.serializeFlow(flow))) : undefined,
      approvals: options.includeApprovals
        ? approvals.map((approval) => ({
            id: approval.id,
            userId: approval.userId,
            approverName: approval.approverName,
            approvalType: approval.approvalType,
            status: approval.status,
            createTime: approval.createTime,
          }))
        : undefined,
      permissions: options.user
        ? this.buildPermissions(order, options.user, approvals)
        : undefined,
    };
  }

  private async serializeFlow(flow: OrderFlow) {
    const fromDepartment = flow.fromDepartmentId
      ? await this.departmentsService.findById(flow.fromDepartmentId)
      : null;
    const toDepartment = flow.toDepartmentId
      ? await this.departmentsService.findById(flow.toDepartmentId)
      : null;

    return {
      id: flow.id,
      action: flow.action,
      actionText: this.getActionText(flow.action),
      fromDepartmentId: flow.fromDepartmentId,
      fromDepartmentName: fromDepartment?.name || null,
      toDepartmentId: flow.toDepartmentId,
      toDepartmentName: toDepartment?.name || null,
      operatorId: flow.operatorId,
      operatorName: flow.operatorName,
      comment: flow.comment,
      createTime: flow.createTime,
    };
  }

  private buildPermissions(order: Order, user: CurrentUser, approvals: OrderApproval[]) {
    return {
      canAssign:
        user.role === UserRole.COUNTY_HANDLER &&
        order.status === OrderStatus.PENDING &&
        order.creatorCountyId === user.countyId,
      canTransfer: false,
      canProcess:
        user.role === UserRole.DEPARTMENT_HEAD &&
        order.status === OrderStatus.PROCESSING &&
        this.isAssignedCityDepartment(order, user.departmentId) &&
        !this.hasDepartmentTasks(order),
      canComplete:
        user.role === UserRole.DEPARTMENT_HEAD &&
        order.status === OrderStatus.PROCESSING &&
        this.hasPendingDepartmentTask(order, user.departmentId),
      canConfirm: approvals.some(
        (approval) => approval.userId === user.id && approval.status === ApprovalStatus.PENDING,
      ),
      canReject: this.canRejectOrder(order, user),
    };
  }

  private canViewOrderInList(order: Order, user: CurrentUser) {
    if (order.creatorId === user.id) {
      return true;
    }

    if (user.role === UserRole.ADMIN || user.role === UserRole.TOP_LEADER) {
      return true;
    }

    if (user.role === UserRole.COUNTY_HANDLER && order.creatorCountyId === user.countyId) {
      return true;
    }

    if (user.role === UserRole.DEPARTMENT_HEAD) {
      return (
        order.currentDepartmentId === user.departmentId ||
        this.hasAnyDepartmentTask(order, user.departmentId) ||
        this.isAssignedCityDepartment(order, user.departmentId)
      );
    }

    return false;
  }

  private ensureCanViewOrder(order: Order, user: CurrentUser) {
    if (this.canViewOrderInList(order, user)) {
      return;
    }

    throw new ForbiddenException('没有权限查看该工单');
  }

  private canRejectOrder(order: Order, user: CurrentUser) {
    if (user.role === UserRole.COUNTY_HANDLER) {
      return order.status === OrderStatus.PENDING && order.creatorCountyId === user.countyId;
    }

    return false;
  }

  private hasAnyDepartmentTask(order: Order, departmentId: number | null | undefined) {
    if (!departmentId) {
      return false;
    }

    return (Array.isArray(order.departmentTasks) ? order.departmentTasks : []).some(
      (task) => task.departmentId === departmentId,
    );
  }

  private hasDepartmentTasks(order: Order) {
    return (Array.isArray(order.departmentTasks) ? order.departmentTasks : []).length > 0;
  }

  private hasPendingDepartmentTask(order: Order, departmentId: number | null | undefined) {
    if (!departmentId) {
      return false;
    }

    return (Array.isArray(order.departmentTasks) ? order.departmentTasks : []).some(
      (task) => task.departmentId === departmentId && !task.completed,
    );
  }

  private getAssignedDepartmentIds(order: Order) {
    const ids = Array.from(
      new Set(
        (Array.isArray(order.assignedDepartmentIds) ? order.assignedDepartmentIds : [])
          .map((item) => Number(item))
          .filter(Number.isInteger),
      ),
    );

    if (ids.length === 0 && order.currentDepartmentId && !this.hasDepartmentTasks(order)) {
      return [order.currentDepartmentId];
    }

    return ids;
  }

  private isAssignedCityDepartment(order: Order, departmentId: number | null | undefined) {
    if (!departmentId) {
      return false;
    }

    return this.getAssignedDepartmentIds(order).includes(departmentId);
  }

  private async createFinalApprovals(order: Order) {
    const creator = await this.usersService.findById(order.creatorId);
    if (!creator) {
      throw new NotFoundException('工单发起人不存在');
    }

    await this.orderApprovalsRepository.delete({ orderId: order.id });

    const approvals: Partial<OrderApproval>[] = [
      {
        orderId: order.id,
        userId: order.creatorId,
        approverName: creator.name,
        approvalType: ApprovalType.CREATOR,
        status: ApprovalStatus.PENDING,
      },
    ];

    if (order.priority === OrderPriority.CRITICAL) {
      const topLeaders = await this.usersService.findTopLeaders();
      const leader = topLeaders[0];

      if (!leader) {
        throw new BadRequestException('系统中没有可用的最高领导账号，无法发起重大事件审批');
      }

      approvals.push({
        orderId: order.id,
        userId: leader.id,
        approverName: leader.name,
        approvalType: ApprovalType.LEADER,
        status: ApprovalStatus.PENDING,
      });
    }

    await this.orderApprovalsRepository.save(approvals);
  }

  private isCoreDepartment(type: DepartmentType) {
    return [
      DepartmentType.NETWORK,
      DepartmentType.MAINTENANCE,
      DepartmentType.ENGINEERING,
    ].includes(type);
  }

  private canUploadAttachment(order: Order, user: CurrentUser, kind: OrderAttachmentKind) {
    if (user.role === UserRole.ADMIN || user.role === UserRole.TOP_LEADER) {
      return true;
    }

    if (kind === 'issue') {
      return order.creatorId === user.id && order.status !== OrderStatus.COMPLETED && order.status !== OrderStatus.REJECTED;
    }

    if (kind === 'proof') {
      if (user.role !== UserRole.DEPARTMENT_HEAD) {
        return false;
      }

      return (
        (order.status === OrderStatus.PROCESSING || order.status === OrderStatus.WAITING_CONFIRM) &&
        this.hasAnyDepartmentTask(order, user.departmentId)
      );
    }

    return false;
  }

  private getStatusText(order: Order) {
    if (order.status === OrderStatus.PENDING) {
      return '待公司网络部审核';
    }

    if (order.status === OrderStatus.PROCESSING) {
      const taskNames = (Array.isArray(order.departmentTasks) ? order.departmentTasks : [])
        .filter((task) => !task.completed)
        .map((task) => task.departmentName)
        .filter(Boolean);

      if (taskNames.length > 0) {
        if (taskNames.length === 1) {
          return `单部门处理中：${taskNames[0]}`;
        }

        return `协同处理中：${taskNames.join('、')}`;
      }

      return '待市级定级';
    }

    if (order.status === OrderStatus.WAITING_CONFIRM) {
      return order.priority === OrderPriority.CRITICAL ? '待发起人和最高领导确认' : '待发起人确认';
    }

    if (order.status === OrderStatus.COMPLETED) {
      return '已完成';
    }

    return '已驳回';
  }

  private getPriorityText(priority: OrderPriority) {
    const priorityMap: Record<OrderPriority, string> = {
      [OrderPriority.NORMAL]: '一般',
      [OrderPriority.URGENT]: '紧急',
      [OrderPriority.CRITICAL]: '重大',
    };

    return priorityMap[priority];
  }

  private getActionText(action: FlowAction) {
    const actionMap: Record<FlowAction, string> = {
      [FlowAction.CREATE]: '创建工单',
      [FlowAction.ASSIGN]: '提交市级部门',
      [FlowAction.TRANSFER]: '部门流转',
      [FlowAction.PROCESS]: '协同派发',
      [FlowAction.COMPLETE]: '部门处理完成',
      [FlowAction.CONFIRM]: '确认通过',
      [FlowAction.REJECT]: '工单驳回',
      [FlowAction.ATTACHMENT]: '上传附件',
    };

    return actionMap[action];
  }

  private getCurrentNodeLabel(
    order: Order,
    countyName: string | null,
    departmentName: string | null,
    departmentTasks: OrderDepartmentTask[],
  ) {
    if (order.status === OrderStatus.PENDING) {
      return `${countyName || '所属公司'}网络部负责人`;
    }

    if (order.status === OrderStatus.PROCESSING) {
      const pendingDepartments = (departmentTasks || [])
        .filter((task) => !task.completed)
        .map((task) => task.departmentName)
        .filter(Boolean);

      if (pendingDepartments.length > 0) {
        if (pendingDepartments.length === 1) {
          return `${pendingDepartments[0]}处理中`;
        }

        return `${pendingDepartments.join('、')}协同处理中`;
      }

      return departmentName || '市级待定级';
    }

    if (order.status === OrderStatus.WAITING_CONFIRM) {
      return order.priority === OrderPriority.CRITICAL ? '等待发起人和最高领导确认' : '等待发起人确认';
    }

    if (order.status === OrderStatus.COMPLETED) {
      return '闭环存档';
    }

    return '已驳回';
  }

  private buildOrderTitle(dto: CreateOrderDto) {
    const manualTitle = dto.title?.trim();
    if (manualTitle) {
      return manualTitle;
    }

    const summary = dto.description.trim().replace(/\s+/g, ' ').slice(0, 18);
    return summary ? `工单：${summary}` : '工单';
  }

  private getTopologyDepartmentStatus(
    order: Order,
    departmentId: number,
    visitedDepartmentIds: Set<number>,
  ) {
    if (order.status === OrderStatus.PROCESSING && order.currentDepartmentId === departmentId) {
      return 'current';
    }

    if (visitedDepartmentIds.has(departmentId)) {
      return 'completed';
    }

    return 'pending';
  }
}
