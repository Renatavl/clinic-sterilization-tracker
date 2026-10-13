import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMaintenanceRecordDto {
  @IsUUID()
  equipmentId: string;

  @IsDateString()
  performedAt: string;

  @IsInt()
  @Min(1)
  @Max(60)
  intervalMonths: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
