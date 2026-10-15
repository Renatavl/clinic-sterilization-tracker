import { IsDateString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AnalyticsDateRangeQueryDto {
  @ApiPropertyOptional({ example: '2026-10-01', format: 'date' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-10-31', format: 'date' })
  @IsOptional()
  @IsDateString()
  to?: string;
}