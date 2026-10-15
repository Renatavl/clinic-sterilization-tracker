import { Module } from '@nestjs/common';
import { SterilizationModule } from '../sterilization/sterilization.module.ts';
import { ReportsService } from './reports.service.ts';
import { ReportsController } from './reports.controller.ts';
import { MaintenanceModule } from '../maintenance/maintenance.module.ts';


@Module({
  imports: [MaintenanceModule, SterilizationModule],

  providers: [ReportsService],

  controllers: [ReportsController],

  exports: [ReportsService],
})
export class ReportsModule {}
