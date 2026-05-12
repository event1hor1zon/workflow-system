import { countiesApi } from '../api/county';
import { departmentsApi } from '../api/department';
import { ReferenceData, Role, Ticket, TicketHistory, TicketPermissions, User } from '../types';

const CITY_NAME = '包头分公司';

const AVATAR_MAP: Record<string, string> = {
  admin: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100',
  leader: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100',
  city_network_handler: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=100',
  a_county_handler: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100',
  b_county_handler: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&q=80&w=100',
  c_county_handler: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100',
  network_head: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100',
  maintenance_head: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&q=80&w=100',
  engineering_head: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=100',
  user_a1: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=100',
  user_a2: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=100',
  user_b1: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&q=80&w=100',
  user_c1: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100',
};

const roleMap: Record<string, Role> = {
  user: 'employee',
  county_handler: 'county_head',
  department_head: 'city_head',
  top_leader: 'top_leader',
  admin: 'admin',
};

const getAvatar = (seed?: string, name?: string) => {
  if (seed && AVATAR_MAP[seed]) {
    return AVATAR_MAP[seed];
  }

  const token = encodeURIComponent(seed || name || 'workflow-user');
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${token}`;
};

const getCountyName = (countyId: number | null | undefined, refs: ReferenceData) => (
  refs.counties.find((item) => item.id === countyId)?.name || '未知公司'
);

const toDepartmentLabel = (name?: string | null, countyName?: string) => {
  if (!name) {
    return undefined;
  }

  if (name.includes('工程')) {
    return '市工程建设部';
  }

  if (name.includes('客户')) {
    return '市客户响应中心';
  }

  if (name.includes('网络')) {
    if (countyName && countyName !== '市公司') {
      return '县公司网络部';
    }

    return '市网络部';
  }

  return undefined;
};

const toUiStatus = (order: any): Ticket['status'] => {
  if (order.status === 'pending') return 'pending_county';
  if (order.status === 'processing') {
    return Array.isArray(order.departmentTasks) && order.departmentTasks.length > 0
      ? 'in_progress'
      : 'pending_city';
  }
  if (order.status === 'waiting_confirm') return 'waiting_confirm';
  if (order.status === 'completed') return 'completed';
  return 'rejected';
};

const toSeverity = (priority?: string): Ticket['severity'] | undefined => {
  if (priority === 'critical') return 'major';
  if (priority === 'urgent') return 'urgent';
  if (priority === 'normal') return 'normal';
  return undefined;
};

const formatDisplayDate = (value?: string | Date | null) => {
  if (!value) return '';

  const date = new Date(value);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatHistoryTime = (value?: string | Date | null) => {
  if (!value) return '现在';

  return new Date(value).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const buildCreator = (order: any, refs: ReferenceData): User => {
  const county = order.creatorCountyName || getCountyName(order.creatorCountyId, refs);
  const department = toDepartmentLabel(order.creatorDepartmentName, county);
  const rawRole = order.creatorRole || 'user';

  return {
    id: order.creatorName || `U-${order.creatorId}`,
    backendId: order.creatorId,
    username: order.creatorUsername || `user-${order.creatorId}`,
    name: order.creatorName || `用户${order.creatorId}`,
    avatar: getAvatar(order.creatorUsername || rawRole, order.creatorName),
    role: roleMap[rawRole] || 'employee',
    county,
    city: CITY_NAME,
    department,
    rawRole,
    countyId: order.creatorCountyId,
    departmentId: order.creatorDepartmentId,
  };
};

const mapFlowStatus = (flow: any) => {
  if (flow.action === 'create') {
    if (typeof flow.comment === 'string' && flow.comment.includes('重新编辑后再次提交')) {
      return '重新提交';
    }
    return '创建';
  }
  if (flow.action === 'assign') return '县级审批通过';
  if (flow.action === 'process') return '协同派发';
  if (flow.action === 'complete') return '部门处理完成';
  if (flow.action === 'confirm') return '初审确认';
  if (flow.action === 'attachment') return '上传附件';
  if (flow.action === 'reject') return '工单驳回';
  return flow.actionText || flow.action || '状态更新';
};

const buildHistory = (order: any): TicketHistory[] => {
  const flowHistory = (order.flows || []).map((flow: any) => ({
    time: formatHistoryTime(flow.createTime),
    status: mapFlowStatus(flow),
    desc: flow.comment || flow.actionText || '流程状态已更新',
    user: flow.operatorName || '系统',
  }));

  if (order.status === 'completed' && !flowHistory.some((item) => item.status.includes('流程闭环'))) {
    flowHistory.push({
      time: formatHistoryTime(order.updateTime),
      status: '流程闭环',
      desc: '各环节负责人已确认，工单结束。',
      user: '系统',
    });
  }

  return flowHistory;
};

const defaultPermissions: TicketPermissions = {
  canAssign: false,
  canTransfer: false,
  canProcess: false,
  canComplete: false,
  canConfirm: false,
  canReject: false,
};

export const hydrateUser = (rawUser: any, refs: ReferenceData): User => {
  const county = getCountyName(rawUser.countyId, refs);
  const departmentName = refs.departments.find((item) => item.id === rawUser.departmentId)?.name;

  return {
    id: rawUser.username,
    backendId: rawUser.id,
    username: rawUser.username,
    name: rawUser.name,
    avatar: getAvatar(rawUser.username, rawUser.name),
    role: roleMap[rawUser.role] || 'employee',
    county,
    city: CITY_NAME,
    department: toDepartmentLabel(departmentName, county),
    rawRole: rawUser.role,
    countyId: rawUser.countyId,
    departmentId: rawUser.departmentId,
  };
};

export const loadReferenceData = async (): Promise<ReferenceData> => {
  const [counties, departments] = await Promise.all([
    countiesApi.getAll(),
    departmentsApi.getAll(),
  ]);

  return {
    counties: Array.isArray(counties) ? counties : [],
    departments: Array.isArray(departments) ? departments : [],
  };
};

export const mapOrderToTicket = (order: any, refs: ReferenceData): Ticket => {
  const creator = buildCreator(order, refs);
  const status = toUiStatus(order);
  const assignedDepartmentIds = Array.isArray(order.assignedDepartmentIds)
    ? order.assignedDepartmentIds.map((item: any) => Number(item)).filter(Number.isInteger)
    : [];
  const pendingCityDepartmentName = assignedDepartmentIds.length === 1
    ? refs.departments.find((item) => item.id === assignedDepartmentIds[0])?.name
    : undefined;

  return {
    id: `WT-${String(order.id).padStart(4, '0')}`,
    backendId: order.id,
    title: order.title,
    description: order.description || '',
    status,
    severity: status === 'in_progress' || status === 'waiting_confirm' || status === 'completed'
      ? toSeverity(order.priority)
      : undefined,
    targetCityDept: toDepartmentLabel(
      status === 'pending_city' ? pendingCityDepartmentName : order.currentDepartmentName,
      '市公司',
    ) as Ticket['targetCityDept'],
    currentDepartmentId: order.currentDepartmentId,
    assignedDepartmentIds,
    creator,
    creatorConfirmed: Boolean(order.creatorConfirmed),
    topLeaderConfirmed: Boolean(order.leaderConfirmed),
    createdAt: formatDisplayDate(order.createTime || order.createdAt),
    history: buildHistory(order),
    departmentTasks: Array.isArray(order.departmentTasks)
      ? order.departmentTasks.map((task: any) => ({
          departmentId: task.departmentId,
          departmentName: task.departmentName,
          completed: Boolean(task.completed),
          completedById: task.completedById ?? null,
          completedByName: task.completedByName ?? null,
          completedAt: task.completedAt ?? null,
          comment: task.comment ?? null,
        }))
      : [],
    attachments: Array.isArray(order.attachments)
      ? order.attachments.map((attachment: any) => ({
          id: attachment.id,
          kind: attachment.kind,
          originalName: attachment.originalName,
          storedName: attachment.storedName,
          mimeType: attachment.mimeType,
          size: attachment.size,
          url: attachment.url,
          uploadedById: attachment.uploadedById,
          uploadedByName: attachment.uploadedByName,
          uploadedAt: attachment.uploadedAt,
        }))
      : [],
    permissions: {
      ...defaultPermissions,
      ...(order.permissions || {}),
    },
    raw: order,
  };
};

export const toBackendPriority = (severity: 'normal' | 'urgent' | 'major') => {
  if (severity === 'major') return 'critical';
  return severity;
};
