import {
  Controller,
  Get,
  Param,
  ParseFilePipeBuilder,
  ParseUUIDPipe,
  Post,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { memoryStorage } from 'multer';

import { AttachmentsService } from '../attachments/attachments.service.ts';
import {
  ATTACHMENT_FILE_TYPES,
  MAX_ATTACHMENT_SIZE,
} from './constants/attachment.constants.ts';
import { createReadStream } from 'fs';
import { Roles } from '../auth/decorators/roles.decorator.ts';
import { UserRole } from '../users/enums/user-role.enum.ts';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.ts';
import { RolesGuard } from '../auth/guards/roles.guard.ts';

@Controller('attachments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post('maintenance/:maintenanceId')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),

      limits: {
        fileSize: MAX_ATTACHMENT_SIZE,
      },
    }),
  )
  uploadForMaintenance(
    @Param('maintenanceId', ParseUUIDPipe)
    maintenanceId: string,

    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({
          maxSize: MAX_ATTACHMENT_SIZE,
        })
        .addFileTypeValidator({
          fileType: ATTACHMENT_FILE_TYPES,
        })
        .build({
          fileIsRequired: true,
        }),
    )
    file: Express.Multer.File,
  ) {
    return this.attachmentsService.uploadForMaintenance(maintenanceId, file);
  }

  @Post('sterilization/:batchId')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),

      limits: {
        fileSize: MAX_ATTACHMENT_SIZE,
      },
    }),
  )
  uploadForSterilization(
    @Param('batchId', ParseUUIDPipe)
    batchId: string,

    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({
          maxSize: MAX_ATTACHMENT_SIZE,
        })
        .addFileTypeValidator({
          fileType: ATTACHMENT_FILE_TYPES,
        })
        .build({
          fileIsRequired: true,
        }),
    )
    file: Express.Multer.File,
  ) {
    return this.attachmentsService.uploadForSterilization(batchId, file);
  }

  @Get('maintenance/:maintenanceId')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  findForMaintenance(
    @Param('maintenanceId', ParseUUIDPipe)
    maintenanceId: string,
  ) {
    return this.attachmentsService.findForMaintenance(maintenanceId);
  }

  @Get('sterilization/:batchId')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  findForSterilization(
    @Param('batchId', ParseUUIDPipe)
    batchId: string,
  ) {
    return this.attachmentsService.findForSterilization(batchId);
  }

  @Get(':id/download')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async download(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    const { attachment, absolutePath } =
      await this.attachmentsService.getDownloadFile(id);

    return new StreamableFile(createReadStream(absolutePath), {
      type: attachment.mimeType,

      disposition: `attachment; filename*=UTF-8''${encodeURIComponent(
        attachment.originalName,
      )}`,

      length: attachment.size,
    });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  findOne(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    return this.attachmentsService.findOne(id);
  }
}
