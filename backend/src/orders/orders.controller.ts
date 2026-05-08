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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import {
  AssignOrderDto,
  ProcessOrderDto,
  TransferOrderDto,
  ConfirmOrderDto,
  RejectOrderDto,
  CompleteDepartmentDto,
  UploadAttachmentDto,
} from './dto/process-order.dto';

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
  async findById(@Param('id') id: string, @Request() req) {
    return this.ordersService.findById(parseInt(id, 10), req.user);
  }

  @Get(':id/topology')
  async getTopology(@Param('id') id: string, @Request() req) {
    return this.ordersService.getTopology(parseInt(id, 10), req.user);
  }

  @Get(':id/flows')
  async getFlows(@Param('id') id: string, @Request() req) {
    return this.ordersService.getFlows(parseInt(id, 10), req.user);
  }

  @Patch(':id/assign')
  async assign(
    @Param('id') id: string,
    @Body() dto: AssignOrderDto,
    @Request() req,
  ) {
    return this.ordersService.assignDepartment(parseInt(id, 10), dto, req.user);
  }

  @Post(':id/transfer')
  async transfer(
    @Param('id') id: string,
    @Body() dto: TransferOrderDto,
    @Request() req,
  ) {
    return this.ordersService.transferDepartment(
      parseInt(id, 10),
      dto,
      req.user,
    );
  }

  @Patch(':id/process')
  async process(
    @Param('id') id: string,
    @Body() dto: ProcessOrderDto,
    @Request() req,
  ) {
    return this.ordersService.processOrder(parseInt(id, 10), dto, req.user);
  }

  @Patch(':id/complete')
  async completeDepartment(
    @Param('id') id: string,
    @Body() dto: CompleteDepartmentDto,
    @Request() req,
  ) {
    return this.ordersService.completeDepartmentTask(parseInt(id, 10), dto.comment, req.user);
  }

  @Patch(':id/confirm')
  async confirm(
    @Param('id') id: string,
    @Body() dto: ConfirmOrderDto,
    @Request() req,
  ) {
    return this.ordersService.confirmOrder(parseInt(id, 10), dto.comment, req.user);
  }

  @Patch(':id/reject')
  async reject(
    @Param('id') id: string,
    @Body() dto: RejectOrderDto,
    @Request() req,
  ) {
    return this.ordersService.rejectOrder(parseInt(id, 10), dto.reason, req.user);
  }

  @Patch(':id/resubmit')
  async resubmit(
    @Param('id') id: string,
    @Body() dto: CreateOrderDto,
    @Request() req,
  ) {
    return this.ordersService.resubmitOrder(parseInt(id, 10), dto, req.user);
  }

  @Post(':id/attachments')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const uploadDir = join(process.cwd(), 'uploads');
          if (!existsSync(uploadDir)) {
            mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (_req, file, cb) => {
          const safeExt = extname(file.originalname || '');
          const stamp = `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
          cb(null, `${stamp}${safeExt}`);
        },
      }),
      limits: {
        fileSize: 15 * 1024 * 1024,
      },
    }),
  )
  async uploadAttachment(
    @Param('id') id: string,
    @Body() dto: UploadAttachmentDto,
    @UploadedFile() file: any,
    @Request() req,
  ) {
    return this.ordersService.uploadAttachment(parseInt(id, 10), dto.kind, file, req.user);
  }
}
