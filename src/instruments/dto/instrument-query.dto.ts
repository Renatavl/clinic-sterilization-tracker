import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.ts';
import { InstrumentStatus } from '../enums/instrument-status.enum.ts';

export class InstrumentQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: InstrumentStatus })
  @IsOptional()
  @IsEnum(InstrumentStatus)
  status?: InstrumentStatus;
}