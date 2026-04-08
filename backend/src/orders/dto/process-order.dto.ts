import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EventType } from '../entities/order.entity';

export class ProcessOrderDto {
  @IsOptional()
  @IsEnum(EventType)
  eventType?: EventType;

  @IsOptional()
  @IsString()
  comment?: string;
}

export class TransferOrderDto {
  @IsOptional()
  @IsString()
  comment?: string;
}

export class ConfirmOrderDto {
  @IsOptional()
  @IsString()
  comment?: string;
}

export class RejectOrderDto {
  @IsNotEmpty({ message: '退回原因不能为空' })
  @IsString()
  reason: string;
}
