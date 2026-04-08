import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus, EventType } from './entities/order.entity';
import { OrderFlow, FlowAction } from './entities/order-flow.entity';
import { OrderApproval, ApprovalType, ApprovalStatus } from './entities/order-approval.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UsersService } from '../users/users.service';
import { CountiesService } from '../counties/counties.service';
import { DepartmentsService } from '../departments/departments.service';
import { UserRole } from '../users/entities/user.entity';
import { County } from '../counties/entities/county.entity';
import { Department } from '../departments/entities/department.entity';

interface CurrentUser {
  id: number;
  username: string;
  name: string;
  role: string;
  countyId: number;
  departmentId: number;
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

  async create(dto: CreateOrderDto, user: CurrentUser): Promise<Order> {
    const order = this.ordersRepository.create({
      title: dto.title,
      description: dto.description,
      creatorId: user.id,
      creatorCountyId: user.countyId,
      creatorDepartmentId: user.departmentId,
      status: OrderStatus.PENDING,
      eventType: EventType.NORMAL,
    });

    const savedOrder = await this.ordersRepository.save(order);

    // Record flow
    await this.addFlow(
      savedOrder.id,
      FlowAction.ASSIGN,
      null,
      null,
      null,
      null,
      `工单创建`,
      user,
    );

    return savedOrder;
  }

  async findAll(user: CurrentUser, status?: string): Promise<Order[]> {
    const query = this.ordersRepository.createQueryBuilder('order');

    // Role-based filtering
    if (user.role === UserRole.ADMIN || user.role === UserRole.TOP_LEADER) {
      // Admin and top leader can see all orders
    } else if (user.role === UserRole.COUNTY_HANDLER) {
      // County handlers see orders from their county
      query.andWhere('order.currentCountyId = :countyId', { countyId: user.countyId });
    } else if (user.role === UserRole.DEPARTMENT_HEAD) {
      // Department heads see orders in their department
      query.andWhere('order.currentDepartmentId = :departmentId', { departmentId: user.departmentId });
    } else {
      // Regular users see their own orders
      query.andWhere('order.creatorId = :userId', { userId: user.id });
    }

    if (status) {
      query.andWhere('order.status = :status', { status });
    }

    return query
      .orderBy('order.createTime', 'DESC')
      .getMany();
  }

  async findById(id: number): Promise<Order> {
    const order = await this.ordersRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException('工单不存在');
    }
    return order;
  }

  async assignDepartment(orderId: number, departmentId: number, user: CurrentUser): Promise<Order> {
    const order = await this.findById(orderId);

    // Only county handlers can assign departments
    if (user.role !== UserRole.COUNTY_HANDLER && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('只有县级经办人可以分配部门');
    }

    // Verify the order is in pending status
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('工单状态不正确，只有待处理的工单可以分配部门');
    }

    // Verify department exists
    const department = await this.departmentsService.findById(departmentId);
    if (!department) {
      throw new NotFoundException('部门不存在');
    }

    // Update order
    order.currentCountyId = user.countyId;
    order.currentDepartmentId = departmentId;
    order.status = OrderStatus.PROCESSED;

    await this.ordersRepository.save(order);

    // Record flow
    await this.addFlow(
      order.id,
      FlowAction.ASSIGN,
      null,
      departmentId,
      null,
      null,
      `分配到部门: ${department.name}`,
      user,
    );

    return order;
  }

  async transferDepartment(
    orderId: number,
    targetDepartmentId: number,
    comment: string,
    user: CurrentUser,
  ): Promise<Order> {
    const order = await this.findById(orderId);

    // Only department heads can transfer
    if (user.role !== UserRole.DEPARTMENT_HEAD && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('只有部门负责人可以流转工单');
    }

    // Verify the order is in processed status
    if (order.status !== OrderStatus.PROCESSED) {
      throw new BadRequestException('工单状态不正确，只有处理中的工单可以流转');
    }

    // Verify target department exists
    const targetDepartment = await this.departmentsService.findById(targetDepartmentId);
    if (!targetDepartment) {
      throw new NotFoundException('目标部门不存在');
    }

    // Verify it's one of the three departments (network, maintenance, engineering)
    const validTypes = ['network', 'maintenance', 'engineering'];
    if (!validTypes.includes(targetDepartment.type)) {
      throw new BadRequestException('只能流转到网络部、客户响应中心或工程建设部');
    }

    const fromDepartmentId = order.currentDepartmentId;

    // Update order
    order.currentDepartmentId = targetDepartmentId;
    order.currentCountyId = order.creatorCountyId; // Keep creator's county

    await this.ordersRepository.save(order);

    // Record flow
    await this.addFlow(
      order.id,
      FlowAction.TRANSFER,
      fromDepartmentId,
      targetDepartmentId,
      null,
      null,
      comment || `从当前部门流转到: ${targetDepartment.name}`,
      user,
    );

    return order;
  }

  async processOrder(
    orderId: number,
    eventType: EventType,
    comment: string,
    user: CurrentUser,
  ): Promise<Order> {
    const order = await this.findById(orderId);

    // Only department heads can process
    if (user.role !== UserRole.DEPARTMENT_HEAD && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('只有部门负责人可以处理工单');
    }

    // Verify the order is in processed status
    if (order.status !== OrderStatus.PROCESSED) {
      throw new BadRequestException('工单状态不正确');
    }

    // Update order
    if (eventType) {
      order.eventType = eventType;
    }
    order.status = OrderStatus.PENDING_APPROVAL;

    await this.ordersRepository.save(order);

    // Create approval records
    if (eventType === EventType.CRITICAL) {
      // For critical events, create approval for both creator and top leader
      await this.orderApprovalsRepository.save([
        {
          orderId: order.id,
          userId: order.creatorId,
          approvalType: ApprovalType.CREATOR,
          status: ApprovalStatus.PENDING,
        },
        {
          orderId: order.id,
          userId: user.id, // Top leader or department head approves
          approvalType: ApprovalType.LEADER,
          status: ApprovalStatus.PENDING,
        },
      ]);
    } else {
      // For normal/urgent events, create approval for creator only
      await this.orderApprovalsRepository.save({
        orderId: order.id,
        userId: order.creatorId,
        approvalType: ApprovalType.CREATOR,
        status: ApprovalStatus.PENDING,
      });
    }

    // Record flow
    await this.addFlow(
      order.id,
      FlowAction.PROCESS,
      order.currentDepartmentId,
      order.currentDepartmentId,
      null,
      null,
      comment || `处理完成，事件类型: ${eventType || order.eventType}`,
      user,
    );

    return order;
  }

  async confirmOrder(orderId: number, comment: string, user: CurrentUser): Promise<Order> {
    const order = await this.findById(orderId);

    // Only the creator can confirm
    if (order.creatorId !== user.id && user.role !== UserRole.ADMIN && user.role !== UserRole.TOP_LEADER) {
      throw new ForbiddenException('只有工单发起人可以确认结束');
    }

    // Verify the order is in pending_approval status
    if (order.status !== OrderStatus.PENDING_APPROVAL) {
      throw new BadRequestException('工单状态不正确');
    }

    // Check if user has pending approval
    const pendingApproval = await this.orderApprovalsRepository.findOne({
      where: {
        orderId: order.id,
        userId: user.id,
        status: ApprovalStatus.PENDING,
      },
    });

    if (pendingApproval) {
      // Update approval status
      pendingApproval.status = ApprovalStatus.APPROVED;
      await this.orderApprovalsRepository.save(pendingApproval);
    }

    // Check if all approvals are complete
    const remainingApprovals = await this.orderApprovalsRepository.count({
      where: {
        orderId: order.id,
        status: ApprovalStatus.PENDING,
      },
    });

    if (remainingApprovals === 0) {
      // All approvals complete, resolve the order
      order.status = OrderStatus.RESOLVED;

      // Record flow
      await this.addFlow(
        order.id,
        FlowAction.CONFIRM,
        order.currentDepartmentId,
        null,
        null,
        null,
        comment || '工单确认结束',
        user,
      );
    } else {
      // Update confirmation status
      if (user.id === order.creatorId) {
        order.creatorConfirmed = true;
      } else if (user.role === UserRole.TOP_LEADER) {
        order.leaderConfirmed = true;
      }
    }

    await this.ordersRepository.save(order);
    return order;
  }

  async rejectOrder(orderId: number, reason: string, user: CurrentUser): Promise<Order> {
    const order = await this.findById(orderId);

    // Only department heads or admin can reject
    if (user.role !== UserRole.DEPARTMENT_HEAD && user.role !== UserRole.ADMIN && user.role !== UserRole.TOP_LEADER) {
      throw new ForbiddenException('只有部门负责人或领导可以退回工单');
    }

    // Update order status
    order.status = OrderStatus.REJECTED;
    await this.ordersRepository.save(order);

    // Record flow
    await this.addFlow(
      order.id,
      FlowAction.REJECT,
      order.currentDepartmentId,
      null,
      null,
      null,
      `退回原因: ${reason}`,
      user,
    );

    return order;
  }

  async getFlows(orderId: number): Promise<OrderFlow[]> {
    return this.orderFlowsRepository.find({
      where: { orderId },
      order: { createTime: 'ASC' },
    });
  }

  async getTopology(orderId: number): Promise<any> {
    const order = await this.findById(orderId);
    const flows = await this.getFlows(orderId);
    const approvals = await this.orderApprovalsRepository.find({
      where: { orderId },
    });

    // Build nodes from flows
    const nodes: any[] = [];
    const edges: any[] = [];
    const nodeMap = new Map<number, any>();

    // Creator node
    const creator = await this.usersService.findById(order.creatorId);
    const creatorCounty = await this.countiesService.findById(order.creatorCountyId);
    const creatorDept = await this.departmentsService.findById(order.creatorDepartmentId);

    const creatorNode = {
      id: `creator-${creator.id}`,
      name: creator?.name || '未知',
      department: creatorDept?.name || '未知',
      status: 'completed',
      user: creator?.name || '未知',
      time: order.createTime,
      type: 'creator',
    };
    nodes.push(creatorNode);
    nodeMap.set(0, creatorNode);

    // Process flows to build topology
    for (let i = 0; i < flows.length; i++) {
      const flow = flows[i];

      if (flow.action === FlowAction.ASSIGN) {
        // Department assignment node
        const dept = await this.departmentsService.findById(flow.toDepartmentId);
        const deptNode = {
          id: `dept-${flow.toDepartmentId}`,
          name: dept?.name || '未知部门',
          department: dept?.name || '未知',
          status: flow.toDepartmentId === order.currentDepartmentId ? 'current' : 'completed',
          time: flow.createTime,
          type: 'department',
        };
        nodes.push(deptNode);
        edges.push({
          from: `creator-${order.creatorId}`,
          to: `dept-${flow.toDepartmentId}`,
        });
        nodeMap.set(flow.id, deptNode);
      } else if (flow.action === FlowAction.TRANSFER) {
        // Transfer between departments
        const fromDept = await this.departmentsService.findById(flow.fromDepartmentId);
        const toDept = await this.departmentsService.findById(flow.toDepartmentId);

        const fromNode = nodeMap.get(flow.fromDepartmentId) || {
          id: `dept-${flow.fromDepartmentId}`,
          name: fromDept?.name || '未知部门',
          department: fromDept?.name || '未知',
          status: 'completed',
          type: 'department',
        };

        const toNode = {
          id: `dept-${flow.toDepartmentId}`,
          name: toDept?.name || '未知部门',
          department: toDept?.name || '未知',
          status: flow.toDepartmentId === order.currentDepartmentId ? 'current' : 'completed',
          time: flow.createTime,
          type: 'department',
        };

        if (!nodes.find(n => n.id === fromNode.id)) {
          nodes.push(fromNode);
        }
        nodes.push(toNode);
        edges.push({
          from: fromNode.id,
          to: toNode.id,
        });
        nodeMap.set(flow.id, toNode);
      }
    }

    // Add approval nodes if any
    if (approvals.length > 0 && order.status === OrderStatus.PENDING_APPROVAL) {
      for (const approval of approvals) {
        const approver = await this.usersService.findById(approval.userId);
        const approvalNode = {
          id: `approval-${approval.id}`,
          name: approver?.name || '未知',
          department: '审批',
          status: approval.status === ApprovalStatus.APPROVED ? 'completed' : 'pending',
          time: approval.createTime,
          type: 'approval',
        };
        nodes.push(approvalNode);

        const lastNode = nodes[nodes.length - 2]; // Get last department node
        if (lastNode) {
          edges.push({
            from: lastNode.id,
            to: approvalNode.id,
          });
        }
      }
    }

    return { nodes, edges };
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
      comment,
    });
    await this.orderFlowsRepository.save(flow);
  }
}
