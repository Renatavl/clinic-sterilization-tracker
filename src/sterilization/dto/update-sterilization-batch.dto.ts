import { PartialType } from '@nestjs/swagger';
import { CreateSterilizationBatchDto } from './create-sterilization-batch.dto.ts';

export class UpdateSterilizationBatchDto extends PartialType(
  CreateSterilizationBatchDto,
) {}
