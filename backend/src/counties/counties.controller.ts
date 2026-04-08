import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CountiesService } from './counties.service';

@Controller('counties')
@UseGuards(AuthGuard('jwt'))
export class CountiesController {
  constructor(private readonly countiesService: CountiesService) {}

  @Get()
  async findAll() {
    return this.countiesService.findAll();
  }
}
