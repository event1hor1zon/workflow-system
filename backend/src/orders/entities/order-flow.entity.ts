import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

export enum FlowAction {
  CREATE = 'create', // 创建
  ASSIGN = 'assign', // 分配
  TRANSFER = 'transfer', // 流转
  PROCESS = 'process', // 处理
  COMPLETE = 'complete', // 完成
  CONFIRM = 'confirm', // 确认
  REJECT = 'reject', // 退回
  ATTACHMENT = 'attachment', // 附件
}

@Entity('order_flows')
export class OrderFlow {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'order_id' })
  orderId: number;

  @Column({
    type: 'enum',
    enum: FlowAction,
  })
  action: FlowAction;

  @Column({ name: 'from_department_id', nullable: true })
  fromDepartmentId: number;

  @Column({ name: 'to_department_id', nullable: true })
  toDepartmentId: number;

  @Column({ name: 'from_user_id', nullable: true })
  fromUserId: number;

  @Column({ name: 'to_user_id', nullable: true })
  toUserId: number;

  @Column({ name: 'operator_id', nullable: true })
  operatorId: number | null;

  @Column({ name: 'operator_name', length: 100, nullable: true })
  operatorName: string | null;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @CreateDateColumn({ name: 'create_time' })
  createTime: Date;
}
