import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.ts';
import { SterilizationStatus } from '../enums/sterilization-status.enum.ts';

export class SterilizationQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(SterilizationStatus)
  status?: SterilizationStatus;

  @IsOptional()
  @IsUUID('4')
  equipmentId?: string;
}