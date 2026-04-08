import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './entities/department.entity';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private departmentsRepository: Repository<Department>,
  ) {}

  async findAll(): Promise<Department[]> {
    return this.departmentsRepository.find({
      where: { isActive: true },
      order: { id: 'ASC' },
    });
  }

  async findById(id: number): Promise<Department | null> {
    return this.departmentsRepository.findOne({
      where: { id, isActive: true },
    });
  }
}
