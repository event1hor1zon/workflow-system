import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';

const PUBLIC_USER_FIELDS: (keyof User)[] = [
  'id',
  'username',
  'name',
  'role',
  'countyId',
  'departmentId',
  'createTime',
];

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      where: { isActive: true },
      select: PUBLIC_USER_FIELDS,
    });
  }

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id, isActive: true },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { username },
    });
  }

  async findPublicById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id, isActive: true },
      select: PUBLIC_USER_FIELDS,
    });
  }

  async findLeaders(): Promise<User[]> {
    return this.usersRepository.find({
      where: [
        { role: UserRole.TOP_LEADER, isActive: true },
        { role: UserRole.DEPARTMENT_HEAD, isActive: true },
      ],
      select: PUBLIC_USER_FIELDS,
    });
  }

  async findTopLeaders(): Promise<User[]> {
    return this.usersRepository.find({
      where: { role: UserRole.TOP_LEADER, isActive: true },
      select: PUBLIC_USER_FIELDS,
    });
  }

  async findByCounty(countyId: number): Promise<User[]> {
    return this.usersRepository.find({
      where: { countyId, isActive: true },
      select: PUBLIC_USER_FIELDS,
    });
  }

  async findByDepartment(departmentId: number): Promise<User[]> {
    return this.usersRepository.find({
      where: { departmentId, isActive: true },
      select: PUBLIC_USER_FIELDS,
    });
  }

  async findCountyHandlers(countyId: number): Promise<User[]> {
    return this.usersRepository.find({
      where: { countyId, role: UserRole.COUNTY_HANDLER, isActive: true },
      select: PUBLIC_USER_FIELDS,
    });
  }

  async findDepartmentHeads(departmentId: number): Promise<User[]> {
    return this.usersRepository.find({
      where: { departmentId, role: UserRole.DEPARTMENT_HEAD, isActive: true },
      select: PUBLIC_USER_FIELDS,
    });
  }

  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
