export type Role = 'employee' | 'county_head' | 'city_head' | 'top_leader' | 'admin';
export type Department = '县公司网络部' | '市网络部' | '市工程建设部' | '市客户响应中心';
export type DepartmentSlug = 'network' | 'engineering' | 'maintenance';

export type Page =
  | 'login'
  | 'dashboard'
  | 'tickets'
  | 'ticket-detail'
  | 'create-ticket'
  | 'profile'
  | 'department-detail';

export interface User {
  id: string;
  backendId: number;
  username: string;
  name: string;
  avatar: string;
  role: Role;
  county: string;
  city: string;
  department?: Department;
  rawRole: string;
  countyId?: number | null;
  departmentId?: number | null;
}

export interface TicketHistory {
  time: string;
  status: string;
  desc: string;
  user: string;
}

export interface TicketPermissions {
  canAssign: boolean;
  canTransfer: boolean;
  canProcess: boolean;
  canComplete: boolean;
  canConfirm: boolean;
  canReject: boolean;
}

export interface TicketDepartmentTask {
  departmentId: number;
  departmentName: string;
  completed: boolean;
  completedById: number | null;
  completedByName: string | null;
  completedAt: string | null;
  comment: string | null;
}

export interface TicketAttachment {
  id: string;
  kind: 'issue' | 'proof';
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedById: number;
  uploadedByName: string;
  uploadedAt: string;
}

export interface Ticket {
  id: string;
  backendId: number;
  title: string;
  description: string;
  status: 'pending_county' | 'pending_city' | 'rejected' | 'in_progress' | 'waiting_confirm' | 'completed';
  severity?: 'normal' | 'urgent' | 'major';
  targetCityDept?: '市网络部' | '市工程建设部' | '市客户响应中心';
  currentDepartmentId?: number | null;
  assignedDepartmentIds?: number[];
  departmentTasks?: TicketDepartmentTask[];
  attachments?: TicketAttachment[];
  creator: User;
  currentHandler?: User;
  creatorConfirmed: boolean;
  topLeaderConfirmed: boolean;
  createdAt: string;
  history: TicketHistory[];
  permissions: TicketPermissions;
  raw: any;
}

export interface ReferenceData {
  counties: Array<{ id: number; name: string }>;
  departments: Array<{ id: number; name: string; type?: string }>;
}
