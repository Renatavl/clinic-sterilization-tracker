import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateSterilizationBatchDto {
  @IsUUID('4')
  equipmentId: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID('4', {
    each: true,
  })
  instrumentIds: string[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
