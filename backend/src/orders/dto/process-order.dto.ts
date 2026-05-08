import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';
import { OrderAttachmentKind, OrderPriority } from '../entities/order.entity';

export class AssignOrderDto {
  @Type(() => Number)
  @IsInt({ message: 'departmentId 必须是有效的部门 ID' })
  departmentId: number;

  @IsOptional()
  @Type(() => Number)
  @IsArray()
  @ArrayUnique({ message: '协同部门不能重复' })
  @IsInt({ each: true })
  departmentIds?: number[];

  @IsOptional()
  @IsString()
  comment?: string;
}

export class ProcessOrderDto {
  @IsOptional()
  @IsEnum(OrderPriority)
  priority?: OrderPriority;

  @IsOptional()
  @Type(() => Number)
  @IsArray()
  @ArrayUnique({ message: '协同部门不能重复' })
  @IsInt({ each: true })
  departmentIds?: number[];

  @IsOptional()
  @IsString()
  comment?: string;
}

export class TransferOrderDto {
  @Type(() => Number)
  @IsInt({ message: 'targetDepartmentId 必须是有效的部门 ID' })
  targetDepartmentId: number;

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

export class CompleteDepartmentDto {
  @IsOptional()
  @IsString()
  comment?: string;
}

export class UploadAttachmentDto {
  @IsIn(['issue', 'proof'], { message: '附件类型必须是 issue 或 proof' })
  kind: OrderAttachmentKind;
}
