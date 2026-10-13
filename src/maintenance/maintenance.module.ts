import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaintenanceRecord } from './entities/maintenance-record.entity.ts';
import { EquipmentModule } from '../equipment/equipment.module.ts';

import { MaintenanceController } from './maintenance.controller.ts';
import { MaintenanceService } from './maintenance.service.ts';

@Module({
  imports: [TypeOrmModule.forFeature([MaintenanceRecord]), EquipmentModule],

  controllers: [MaintenanceController],

  providers: [MaintenanceService],

  exports: [MaintenanceService],
})
export class MaintenanceModule {}
