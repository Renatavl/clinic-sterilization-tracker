import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.ts';

export class MaintenanceQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID('4')
  equipmentId?: string;
}