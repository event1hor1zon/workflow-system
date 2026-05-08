import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CountiesService } from './counties.service';
import { UsersService } from '../users/users.service';

@Controller('counties')
@UseGuards(AuthGuard('jwt'))
export class CountiesController {
  constructor(
    private readonly countiesService: CountiesService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  async findAll() {
    return this.countiesService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.countiesService.findById(parseInt(id, 10));
  }

  @Get(':id/users')
  async findUsers(@Param('id') id: string) {
    return this.usersService.findByCounty(parseInt(id, 10));
  }
}
