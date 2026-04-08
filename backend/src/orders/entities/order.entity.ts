import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum OrderStatus {
  PENDING = 'pending', // 待处理
  PROCESSED = 'processed', // 已处理/已流转
  PENDING_APPROVAL = 'pending_approval', // 待审批
  RESOLVED = 'resolved', // 已解决
  REJECTED = 'rejected', // 已退回
}

export enum EventType {
  NORMAL = 'normal', // 普通
  URGENT = 'urgent', // 紧急
  CRITICAL = 'critical', // 重大
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'creator_id' })
  creatorId: number;

  @Column({ name: 'creator_county_id' })
  creatorCountyId: number;

  @Column({ name: 'creator_department_id' })
  creatorDepartmentId: number;

  @Column({ name: 'current_handler_id', nullable: true })
  currentHandlerId: number;

  @Column({ name: 'current_county_id', nullable: true })
  currentCountyId: number;

  @Column({ name: 'current_department_id', nullable: true })
  currentDepartmentId: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({
    name: 'event_type',
    type: 'enum',
    enum: EventType,
    default: EventType.NORMAL,
  })
  eventType: EventType;

  @Column({ name: 'creator_confirmed', default: false })
  creatorConfirmed: boolean;

  @Column({ name: 'leader_confirmed', default: false })
  leaderConfirmed: boolean;

  @CreateDateColumn({ name: 'create_time' })
  createTime: Date;

  @UpdateDateColumn({ name: 'update_time' })
  updateTime: Date;
}
