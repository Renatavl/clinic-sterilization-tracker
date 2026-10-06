import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { EquipmentType } from '../enums/equipment-type.enum.ts';
import { EquipmentStatus } from '../enums/equipment-status.enum.ts';

export class CreateEquipmentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  serialNumber: string;

  @IsEnum(EquipmentType)
  type: EquipmentType;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  manufacturer?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  model?: string;

  @IsOptional()
  @IsEnum(EquipmentStatus)
  status?: EquipmentStatus;
}