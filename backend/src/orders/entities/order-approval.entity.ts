import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

export enum ApprovalType {
  CREATOR = 'creator', // 发起人
  LEADER = 'leader', // 领导
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
}

@Entity('order_approvals')
export class OrderApproval {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'order_id' })
  orderId: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({
    name: 'approval_type',
    type: 'enum',
    enum: ApprovalType,
  })
  approvalType: ApprovalType;

  @Column({
    type: 'enum',
    enum: ApprovalStatus,
    default: ApprovalStatus.PENDING,
  })
  status: ApprovalStatus;

  @CreateDateColumn({ name: 'create_time' })
  createTime: Date;
}
