import { PartialType } from '@nestjs/swagger';
import { CreateEquipmentDto } from './create-equipment.dto.ts';


export class UpdateEquipmentDto extends PartialType(CreateEquipmentDto) {}
