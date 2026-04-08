import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { County } from './counties/entities/county.entity';
import { Department } from './departments/entities/department.entity';
import { User } from './users/entities/user.entity';
import { UserRole } from './users/entities/user.entity';

@Injectable()
export class SeedService {
  constructor(private dataSource: DataSource) {}

  async seed() {
    const countyRepo = this.dataSource.getRepository(County);
    const deptRepo = this.dataSource.getRepository(Department);
    const userRepo = this.dataSource.getRepository(User);

    // Check if data already exists
    const existingCounties = await countyRepo.count();
    if (existingCounties > 0) {
      console.log('Seed data already exists, skipping...');
      return;
    }

    console.log('Seeding database...');

    // Seed Counties
    const counties = await countyRepo.save([
      { name: 'A县', isActive: true },
      { name: 'B县', isActive: true },
      { name: 'C县', isActive: true },
    ]);

    // Seed Departments
    const departments = await deptRepo.save([
      { name: '网络部', type: 'network', isActive: true },
      { name: '客户响应中心', type: 'maintenance', isActive: true },
      { name: '工程建设部', type: 'engineering', isActive: true },
    ]);

    // Seed Users
    const hashedPassword = await bcrypt.hash('123456', 10);

    const users = [
      // Admin
      {
        username: 'admin',
        password: hashedPassword,
        name: '系统管理员',
        role: UserRole.ADMIN,
        countyId: null,
        departmentId: null,
        isActive: true,
      },
      // Top Leader
      {
        username: 'leader',
        password: hashedPassword,
        name: '最高领导',
        role: UserRole.TOP_LEADER,
        countyId: null,
        departmentId: null,
        isActive: true,
      },
      // A县 County Handlers
      {
        username: 'a_county_handler',
        password: hashedPassword,
        name: 'A县经办人',
        role: UserRole.COUNTY_HANDLER,
        countyId: counties[0].id,
        departmentId: null,
        isActive: true,
      },
      // B县 County Handlers
      {
        username: 'b_county_handler',
        password: hashedPassword,
        name: 'B县经办人',
        role: UserRole.COUNTY_HANDLER,
        countyId: counties[1].id,
        departmentId: null,
        isActive: true,
      },
      // C县 County Handlers
      {
        username: 'c_county_handler',
        password: hashedPassword,
        name: 'C县经办人',
        role: UserRole.COUNTY_HANDLER,
        countyId: counties[2].id,
        departmentId: null,
        isActive: true,
      },
      // Network Department Heads
      {
        username: 'network_head',
        password: hashedPassword,
        name: '网络部负责人',
        role: UserRole.DEPARTMENT_HEAD,
        countyId: null,
        departmentId: departments[0].id,
        isActive: true,
      },
      // Maintenance Department Heads
      {
        username: 'maintenance_head',
        password: hashedPassword,
        name: '客户响应中心负责人',
        role: UserRole.DEPARTMENT_HEAD,
        countyId: null,
        departmentId: departments[1].id,
        isActive: true,
      },
      // Engineering Department Heads
      {
        username: 'engineering_head',
        password: hashedPassword,
        name: '工程建设部负责人',
        role: UserRole.DEPARTMENT_HEAD,
        countyId: null,
        departmentId: departments[2].id,
        isActive: true,
      },
      // Regular Users from different counties
      {
        username: 'user_a1',
        password: hashedPassword,
        name: 'A县员工1',
        role: UserRole.USER,
        countyId: counties[0].id,
        departmentId: departments[0].id,
        isActive: true,
      },
      {
        username: 'user_a2',
        password: hashedPassword,
        name: 'A县员工2',
        role: UserRole.USER,
        countyId: counties[0].id,
        departmentId: departments[1].id,
        isActive: true,
      },
      {
        username: 'user_b1',
        password: hashedPassword,
        name: 'B县员工1',
        role: UserRole.USER,
        countyId: counties[1].id,
        departmentId: departments[0].id,
        isActive: true,
      },
      {
        username: 'user_c1',
        password: hashedPassword,
        name: 'C县员工1',
        role: UserRole.USER,
        countyId: counties[2].id,
        departmentId: departments[2].id,
        isActive: true,
      },
    ];

    await userRepo.save(users);

    console.log('Seed data created successfully!');
    console.log('Test accounts (password: 123456):');
    console.log('  - admin: 系统管理员');
    console.log('  - leader: 最高领导');
    console.log('  - a_county_handler: A县经办人');
    console.log('  - network_head: 网络部负责人');
    console.log('  - user_a1: A县员工1');
  }
}
