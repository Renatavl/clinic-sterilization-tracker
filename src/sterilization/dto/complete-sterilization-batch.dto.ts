import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SterilizationResult } from '../enums/sterilization-result.enum.ts';

export class CompleteSterilizationBatchDto {
  @ApiProperty({ enum: SterilizationResult })
  @IsEnum(SterilizationResult)
  result: SterilizationResult;
}
