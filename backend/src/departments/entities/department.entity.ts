import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

export enum DepartmentType {
  NETWORK = 'network', // 网络部
  MAINTENANCE = 'maintenance', // 客户响应中心
  ENGINEERING = 'engineering', // 工程建设部
}

@Entity('departments')
export class Department {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({
    type: 'enum',
    enum: DepartmentType,
    default: DepartmentType.NETWORK,
  })
  type: DepartmentType;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'create_time' })
  createTime: Date;
}
