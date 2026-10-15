import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.ts';
import { InstrumentStatus } from '../enums/instrument-status.enum.ts';

export class InstrumentQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(InstrumentStatus)
  status?: InstrumentStatus;
}