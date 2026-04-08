import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

export enum FlowAction {
  ASSIGN = 'assign', // 分配
  TRANSFER = 'transfer', // 流转
  PROCESS = 'process', // 处理
  CONFIRM = 'confirm', // 确认
  REJECT = 'reject', // 退回
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

  @Column({ type: 'text', nullable: true })
  comment: string;

  @CreateDateColumn({ name: 'create_time' })
  createTime: Date;
}
