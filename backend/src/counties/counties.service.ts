import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { County } from './entities/county.entity';

@Injectable()
export class CountiesService {
  constructor(
    @InjectRepository(County)
    private countiesRepository: Repository<County>,
  ) {}

  async findAll(): Promise<County[]> {
    return this.countiesRepository.find({
      where: { isActive: true },
      order: { id: 'ASC' },
    });
  }

  async findById(id: number): Promise<County | null> {
    return this.countiesRepository.findOne({
      where: { id, isActive: true },
    });
  }
}
