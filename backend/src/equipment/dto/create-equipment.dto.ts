import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EquipmentType } from '../enums/equipment-type.enum.ts';
import { EquipmentStatus } from '../enums/equipment-status.enum.ts';

export class CreateEquipmentDto {
  @ApiProperty({ example: 'Main Autoclave' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name: string;

  @ApiProperty({ example: 'AUTO-001' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  serialNumber: string;

  @ApiProperty({ enum: EquipmentType, example: EquipmentType.AUTOCLAVE })
  @IsEnum(EquipmentType)
  type: EquipmentType;

  @ApiPropertyOptional({ example: 'Melag' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  manufacturer?: string;

  @ApiPropertyOptional({ example: 'Vacuklav 40 B+' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  model?: string;

  @ApiPropertyOptional({
    enum: EquipmentStatus,
    default: EquipmentStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(EquipmentStatus)
  status?: EquipmentStatus;
}