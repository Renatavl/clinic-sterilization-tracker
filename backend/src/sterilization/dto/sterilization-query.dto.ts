import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.ts';
import { SterilizationStatus } from '../enums/sterilization-status.enum.ts';

export class SterilizationQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: SterilizationStatus })
  @IsOptional()
  @IsEnum(SterilizationStatus)
  status?: SterilizationStatus;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4')
  equipmentId?: string;
}