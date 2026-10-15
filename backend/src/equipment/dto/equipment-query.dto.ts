import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.ts';
import { EquipmentStatus } from '../enums/equipment-status.enum.ts';
import { EquipmentType } from '../enums/equipment-type.enum.ts';

export class EquipmentQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: EquipmentStatus })
  @IsOptional()
  @IsEnum(EquipmentStatus)
  status?: EquipmentStatus;

  @ApiPropertyOptional({ enum: EquipmentType })
  @IsOptional()
  @IsEnum(EquipmentType)
  type?: EquipmentType;
}