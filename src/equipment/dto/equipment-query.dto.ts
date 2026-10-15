import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.ts';
import { EquipmentStatus } from '../enums/equipment-status.enum.ts';
import { EquipmentType } from '../enums/equipment-type.enum.ts';

export class EquipmentQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(EquipmentStatus)
  status?: EquipmentStatus;

  @IsOptional()
  @IsEnum(EquipmentType)
  type?: EquipmentType;
}