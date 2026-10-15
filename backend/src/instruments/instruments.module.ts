import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Instrument } from './entities/instrument.entity.ts';

import { InstrumentsController } from './instruments.controller.ts';
import { InstrumentsService } from './instruments.service.ts';

@Module({
  imports: [
    TypeOrmModule.forFeature([Instrument]),
  ],
  controllers: [
    InstrumentsController,
  ],
  providers: [
    InstrumentsService,
  ],
  exports: [
    InstrumentsService,
  ],
})
export class InstrumentsModule {}