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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMaintenanceRecordDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsUUID()
  equipmentId: string;

  @ApiProperty({
    example: '2026-10-15T10:00:00.000Z',
    format: 'date-time',
  })
  @IsDateString()
  performedAt: string;

  @ApiProperty({ example: 12, minimum: 1, maximum: 60 })
  @IsInt()
  @Min(1)
  @Max(60)
  intervalMonths: number;

  @ApiPropertyOptional({ example: 'Annual preventive maintenance' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
