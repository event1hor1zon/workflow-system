import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DepartmentsService } from './departments.service';

@Controller('departments')
@UseGuards(AuthGuard('jwt'))
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  async findAll() {
    return this.departmentsService.findAll();
  }

  @Get('three')
  async findThreeDepartments() {
    return this.departmentsService.findCoreDepartments();
  }

  @Get('transferable')
  async findTransferableDepartments() {
    return this.departmentsService.findCoreDepartments();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.departmentsService.findById(parseInt(id, 10));
  }
}
