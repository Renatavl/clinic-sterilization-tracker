import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Equipment } from './entities/equipment.entity.ts';

import { EquipmentController } from './equipment.controller.ts';
import { EquipmentService } from './equipment.service.ts';

@Module({
  imports: [
    TypeOrmModule.forFeature([Equipment]),
  ],
  controllers: [EquipmentController],
  providers: [EquipmentService],
  exports: [EquipmentService],
})
export class EquipmentModule {}