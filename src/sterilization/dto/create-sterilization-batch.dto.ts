import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSterilizationBatchDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsUUID('4')
  equipmentId: string;

  @ApiProperty({
    type: [String],
    example: [
      '550e8400-e29b-41d4-a716-446655440001',
      '550e8400-e29b-41d4-a716-446655440002',
    ],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID('4', {
    each: true,
  })
  instrumentIds: string[];

  @ApiPropertyOptional({ example: 'Routine sterilization cycle' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
