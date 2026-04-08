import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateOrderDto {
  @IsNotEmpty({ message: '工单标题不能为空' })
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}
