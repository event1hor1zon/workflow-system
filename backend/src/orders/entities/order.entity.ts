import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum OrderStatus {
  PENDING = 'pending', // 待处理
  PROCESSING = 'processing', // 已分配部门并处理中
  WAITING_CONFIRM = 'waiting_confirm', // 待确认
  COMPLETED = 'completed', // 已完成
  REJECTED = 'rejected', // 已退回
}

export enum OrderPriority {
  NORMAL = 'normal', // 普通
  URGENT = 'urgent', // 紧急
  CRITICAL = 'critical', // 重大
}

export type OrderAttachmentKind = 'issue' | 'proof';

export interface OrderAttachment {
  id: string;
  kind: OrderAttachmentKind;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedById: number;
  uploadedByName: string;
  uploadedAt: string;
}

export interface OrderDepartmentTask {
  departmentId: number;
  departmentName: string;
  completed: boolean;
  completedById: number | null;
  completedByName: string | null;
  completedAt: string | null;
  comment: string | null;
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  title: string;

  @Column({ length: 50, default: 'other' })
  type: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'creator_id' })
  creatorId: number;

  @Column({ name: 'creator_county_id' })
  creatorCountyId: number;

  @Column({ name: 'creator_department_id', nullable: true })
  creatorDepartmentId: number | null;

  @Column({ name: 'current_handler_id', nullable: true })
  currentHandlerId: number | null;

  @Column({ name: 'current_county_id', nullable: true })
  currentCountyId: number | null;

  @Column({ name: 'current_department_id', nullable: true })
  currentDepartmentId: number | null;

  @Column({ name: 'assigned_department_ids', type: 'jsonb', default: () => "'[]'" })
  assignedDepartmentIds: number[];

  @Column({ name: 'department_tasks', type: 'jsonb', default: () => "'[]'" })
  departmentTasks: OrderDepartmentTask[];

  @Column({ name: 'attachments', type: 'jsonb', default: () => "'[]'" })
  attachments: OrderAttachment[];

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({
    type: 'enum',
    enum: OrderPriority,
    default: OrderPriority.NORMAL,
  })
  priority: OrderPriority;

  @Column({ name: 'creator_confirmed', default: false })
  creatorConfirmed: boolean;

  @Column({ name: 'leader_confirmed', default: false })
  leaderConfirmed: boolean;

  @CreateDateColumn({ name: 'create_time' })
  createTime: Date;

  @UpdateDateColumn({ name: 'update_time' })
  updateTime: Date;
}
