import {
  OmitType,
  PartialType,
} from '@nestjs/swagger';

import { CreateMaintenanceRecordDto } from './create-maintenance-record.dto.ts';

export class UpdateMaintenanceRecordDto extends PartialType(
  OmitType(
    CreateMaintenanceRecordDto,
    ['equipmentId'] as const,
  ),
) {}