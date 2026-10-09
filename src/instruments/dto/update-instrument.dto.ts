import { PartialType } from '@nestjs/mapped-types';
import { CreateInstrumentDto } from './create-instrument.dto.ts';


export class UpdateInstrumentDto extends PartialType(CreateInstrumentDto) {}
