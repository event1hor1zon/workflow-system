import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

export enum UserRole {
  USER = 'user', // 普通员工
  COUNTY_HANDLER = 'county_handler', // 县级经办人
  DEPARTMENT_HEAD = 'department_head', // 部门负责人
  TOP_LEADER = 'top_leader', // 最高权限人
  ADMIN = 'admin', // 管理员
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, unique: true })
  username: string;

  @Column({ length: 100 })
  password: string;

  @Column({ length: 100 })
  name: string;

  @Column({ name: 'county_id', nullable: true })
  countyId: number;

  @Column({ name: 'department_id', nullable: true })
  departmentId: number;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'create_time' })
  createTime: Date;
}
