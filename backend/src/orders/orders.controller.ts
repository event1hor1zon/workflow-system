import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ProcessOrderDto, TransferOrderDto, ConfirmOrderDto, RejectOrderDto } from './dto/process-order.dto';

@Controller('orders')
@UseGuards(AuthGuard('jwt'))
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(@Body() dto: CreateOrderDto, @Request() req) {
    return this.ordersService.create(dto, req.user);
  }

  @Get()
  async findAll(@Request() req, @Query('status') status?: string) {
    return this.ordersService.findAll(req.user, status);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.ordersService.findById(parseInt(id));
  }

  @Get(':id/topology')
  async getTopology(@Param('id') id: string) {
    return this.ordersService.getTopology(parseInt(id));
  }

  @Get(':id/flows')
  async getFlows(@Param('id') id: string) {
    return this.ordersService.getFlows(parseInt(id));
  }

  @Patch(':id/assign')
  async assign(
    @Param('id') id: string,
    @Body('departmentId') departmentId: number,
    @Request() req,
  ) {
    return this.ordersService.assignDepartment(parseInt(id), departmentId, req.user);
  }

  @Post(':id/transfer')
  async transfer(
    @Param('id') id: string,
    @Body() dto: TransferOrderDto,
    @Body('targetDepartmentId') targetDepartmentId: number,
    @Request() req,
  ) {
    return this.ordersService.transferDepartment(
      parseInt(id),
      targetDepartmentId,
      dto.comment,
      req.user,
    );
  }

  @Patch(':id/process')
  async process(
    @Param('id') id: string,
    @Body() dto: ProcessOrderDto,
    @Request() req,
  ) {
    return this.ordersService.processOrder(parseInt(id), dto.eventType, dto.comment, req.user);
  }

  @Patch(':id/confirm')
  async confirm(
    @Param('id') id: string,
    @Body() dto: ConfirmOrderDto,
    @Request() req,
  ) {
    return this.ordersService.confirmOrder(parseInt(id), dto.comment, req.user);
  }

  @Patch(':id/reject')
  async reject(
    @Param('id') id: string,
    @Body() dto: RejectOrderDto,
    @Request() req,
  ) {
    return this.ordersService.rejectOrder(parseInt(id), dto.reason, req.user);
  }
}
