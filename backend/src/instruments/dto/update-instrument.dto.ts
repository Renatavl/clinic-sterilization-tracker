import { PartialType } from '@nestjs/swagger';
import { CreateInstrumentDto } from './create-instrument.dto.ts';


export class UpdateInstrumentDto extends PartialType(CreateInstrumentDto) {}
