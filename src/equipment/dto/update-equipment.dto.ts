import { PartialType } from '@nestjs/mapped-types';
import { CreateEquipmentDto } from './create-equipment.dto.ts';


export class UpdateEquipmentDto extends PartialType(CreateEquipmentDto) {}
