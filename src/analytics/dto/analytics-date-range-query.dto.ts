import { IsDateString, IsOptional } from 'class-validator';

export class AnalyticsDateRangeQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}