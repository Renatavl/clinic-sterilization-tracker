import { dirname, join } from 'path';

import { fileURLToPath } from 'url';

import { HttpStatus, Injectable } from '@nestjs/common';

import fs from 'fs-extra';

import Handlebars from 'handlebars';

import { format } from 'date-fns';
import { SterilizationService } from '../sterilization/sterilization.service.ts';
import { SterilizationStatus } from '../sterilization/enums/sterilization-status.enum.ts';
import { AppException } from '../common/exceptions/app.exception.ts';
import { MaintenanceService } from '../maintenance/maintenance.service.ts';

@Injectable()
export class ReportsService {
  constructor(
    private readonly sterilizationService: SterilizationService,
    private readonly maintenanceService: MaintenanceService,
  ) {}

  private readonly sterilizationReportsDirectory = join(
    process.cwd(),
    'reports',
    'sterilization',
  );

  private readonly maintenanceReportsDirectory = join(
    process.cwd(),
    'reports',
    'maintenance',
  );

  private readonly currentDirectory = dirname(fileURLToPath(import.meta.url));

  private async renderTemplate(templateName: string, data: object) {
    const templatePath = join(this.currentDirectory, 'templates', templateName);

    const templateSource = await fs.readFile(templatePath, 'utf8');

    const template = Handlebars.compile(templateSource);

    return template(data);
  }

  async generateSterilizationReport(batchId: string) {
    const batch = await this.sterilizationService.findOne(batchId);

    if (
      batch.status !== SterilizationStatus.PASSED &&
      batch.status !== SterilizationStatus.FAILED
    ) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'STERILIZATION_BATCH_NOT_COMPLETED',
        'Only completed sterilization batches can have a report',
      );
    }

    const reportData = {
      title: 'Sterilization Report',

      batchId: batch.id,

      status: batch.status,

      equipmentName: batch.equipment.name,

      equipmentSerialNumber: batch.equipment.serialNumber,

      equipmentType: batch.equipment.type,

      startedAt: batch.startedAt
        ? format(batch.startedAt, 'dd MMMM yyyy, HH:mm')
        : '-',

      completedAt: batch.completedAt
        ? format(batch.completedAt, 'dd MMMM yyyy, HH:mm')
        : '-',

      instruments: batch.instruments.map((instrument) => ({
        name: instrument.name,

        instrumentCode: instrument.instrumentCode,
      })),

      notes: batch.notes,
    };

    const html = await this.renderTemplate(
      'sterilization-report.hbs',
      reportData,
    );

    const fileName = `sterilization-${batch.id}.html`;

    const absolutePath = join(this.sterilizationReportsDirectory, fileName);

    await fs.outputFile(absolutePath, html, 'utf8');

    return {
      fileName,
      absolutePath,
    };
  }

  async generateMaintenanceReport(maintenanceId: string) {
    const maintenance = await this.maintenanceService.findOne(maintenanceId);

    const reportData = {
      title: 'Maintenance Report',

      maintenanceId: maintenance.id,

      equipmentName: maintenance.equipment.name,

      equipmentSerialNumber: maintenance.equipment.serialNumber,

      equipmentType: maintenance.equipment.type,

      performedAt: format(maintenance.performedAt, 'dd MMMM yyyy, HH:mm'),

      intervalMonths: maintenance.intervalMonths,

      nextMaintenanceAt: format(
        maintenance.nextMaintenanceAt,
        'dd MMMM yyyy, HH:mm',
      ),

      notes: maintenance.notes,
    };

    const html = await this.renderTemplate(
      'maintenance-report.hbs',
      reportData,
    );

    const fileName = `maintenance-${maintenance.id}.html`;

    const absolutePath = join(this.maintenanceReportsDirectory, fileName);

    await fs.outputFile(absolutePath, html, 'utf8');

    return {
      fileName,
      absolutePath,
    };
  }
}
