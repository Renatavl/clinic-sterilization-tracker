import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SterilizationBatch } from './entities/sterilization-batch.entity.ts';
import { InstrumentsModule } from '../instruments/instruments.module.ts';
import { EquipmentModule } from '../equipment/equipment.module.ts';

import { SterilizationController } from '../sterilization/sterilization.controller.ts';
import { SterilizationService } from '../sterilization/sterilization.service.ts';

@Module({
  imports: [
    TypeOrmModule.forFeature([SterilizationBatch]),

    InstrumentsModule,
    EquipmentModule,
  ],

  controllers: [SterilizationController],

  providers: [SterilizationService],

  exports: [SterilizationService],
})
export class SterilizationModule {}
