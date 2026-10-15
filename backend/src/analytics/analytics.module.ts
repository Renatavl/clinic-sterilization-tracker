import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Equipment } from '../equipment/entities/equipment.entity.ts';
import { Instrument } from '../instruments/entities/instrument.entity.ts';
import { MaintenanceRecord } from '../maintenance/entities/maintenance-record.entity.ts';
import { SterilizationBatch } from '../sterilization/entities/sterilization-batch.entity.ts';
import { AnalyticsController } from './analytics.controller.ts';
import { AnalyticsService } from './analytics.service.ts';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Equipment,
      Instrument,
      MaintenanceRecord,
      SterilizationBatch,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}