import { HttpStatus, Injectable } from '@nestjs/common';

import { randomUUID } from 'crypto';

import { join } from 'path';

import * as fs from 'fs-extra';
import { AppException } from '../common/exceptions/app.exception.ts';
import { InjectRepository } from '@nestjs/typeorm';
import { Attachment } from './entities/attachment.entity.ts';
import { Repository } from 'typeorm';
import { MaintenanceService } from '../maintenance/maintenance.service.ts';
import { SterilizationService } from '../sterilization/sterilization.service.ts';

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(Attachment)
    private readonly attachmentsRepository: Repository<Attachment>,
    private readonly maintenanceService: MaintenanceService,
    private readonly sterilizationService: SterilizationService,
  ) {}
  private readonly uploadDirectory = join(
    process.cwd(),
    'uploads',
    'attachments',
  );

  private getExtension(mimeType: string) {
    switch (mimeType) {
      case 'image/jpeg':
        return '.jpg';

      case 'image/png':
        return '.png';

      case 'application/pdf':
        return '.pdf';

      default:
        throw new AppException(
          HttpStatus.BAD_REQUEST,
          'UNSUPPORTED_ATTACHMENT_TYPE',
          'Unsupported attachment type',
        );
    }
  }

  private async storeFile(file: Express.Multer.File) {
    const extension = this.getExtension(file.mimetype);

    const storedName = `${randomUUID()}${extension}`;

    const absolutePath = join(this.uploadDirectory, storedName);

    await fs.outputFile(absolutePath, file.buffer);

    return {
      storedName,
      absolutePath,
    };
  }

  async uploadForMaintenance(maintenanceId: string, file: Express.Multer.File) {
    const maintenance = await this.maintenanceService.findOne(maintenanceId);

    const { storedName, absolutePath } = await this.storeFile(file);

    try {
      const attachment = this.attachmentsRepository.create({
        originalName: file.originalname,

        storedName,

        mimeType: file.mimetype,

        size: file.size,

        maintenanceRecord: maintenance,

        sterilizationBatch: null,
      });

      return await this.attachmentsRepository.save(attachment);
    } catch (error) {
      await fs.remove(absolutePath);

      throw error;
    }
  }

  async findOne(id: string) {
    const attachment = await this.attachmentsRepository.findOne({
      where: {
        id,
      },

      relations: {
        maintenanceRecord: true,
        sterilizationBatch: true,
      },
    });

    if (!attachment) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'ATTACHMENT_NOT_FOUND',
        'Attachment was not found',
      );
    }

    return attachment;
  }

  async findForMaintenance(maintenanceId: string) {
    await this.maintenanceService.findOne(maintenanceId);

    return this.attachmentsRepository.find({
      where: {
        maintenanceRecord: {
          id: maintenanceId,
        },
      },

      order: {
        createdAt: 'DESC',
      },
    });
  }

  async uploadForSterilization(batchId: string, file: Express.Multer.File) {
    const sterilizationBatch = await this.sterilizationService.findOne(batchId);

    const { storedName, absolutePath } = await this.storeFile(file);

    try {
      const attachment = this.attachmentsRepository.create({
        originalName: file.originalname,

        storedName,

        mimeType: file.mimetype,

        size: file.size,

        maintenanceRecord: null,

        sterilizationBatch,
      });

      return await this.attachmentsRepository.save(attachment);
    } catch (error) {
      await fs.remove(absolutePath);

      throw error;
    }
  }

  async findForSterilization(batchId: string) {
    await this.sterilizationService.findOne(batchId);

    return this.attachmentsRepository.find({
      where: {
        sterilizationBatch: {
          id: batchId,
        },
      },

      order: {
        createdAt: 'DESC',
      },
    });
  }

  async getDownloadFile(id: string) {
    const attachment = await this.findOne(id);

    const absolutePath = join(this.uploadDirectory, attachment.storedName);

    const exists = await fs.pathExists(absolutePath);

    if (!exists) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'ATTACHMENT_FILE_NOT_FOUND',
        'Attachment file was not found',
      );
    }

    return {
      attachment,
      absolutePath,
    };
  }

  async remove(id: string) {
    const attachment = await this.findOne(id);

    const absolutePath = join(this.uploadDirectory, attachment.storedName);

    await this.attachmentsRepository.softDelete(id);

    await fs.remove(absolutePath);
  }
}
