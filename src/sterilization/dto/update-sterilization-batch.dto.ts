import { PartialType } from '@nestjs/mapped-types';
import { CreateSterilizationBatchDto } from './create-sterilization-batch.dto.ts';

export class UpdateSterilizationBatchDto extends PartialType(
  CreateSterilizationBatchDto,
) {}
