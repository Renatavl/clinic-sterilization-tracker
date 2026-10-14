import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attachment } from './entities/attachment.entity.ts';
import { MaintenanceModule } from '../maintenance/maintenance.module.ts';
import { SterilizationModule } from '../sterilization/sterilization.module.ts';
import { AttachmentsController } from '../attachments/attachments.controller.ts';
import { AttachmentsService } from '../attachments/attachments.service.ts';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attachment]),

    MaintenanceModule,
    SterilizationModule,
  ],

  controllers: [AttachmentsController],

  providers: [AttachmentsService],

  exports: [AttachmentsService],
})
export class AttachmentsModule {}
