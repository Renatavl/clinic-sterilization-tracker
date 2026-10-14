import { IsEnum } from 'class-validator';
import { SterilizationResult } from '../enums/sterilization-result.enum.ts';

export class CompleteSterilizationBatchDto {
  @IsEnum(SterilizationResult)
  result: SterilizationResult;
}
