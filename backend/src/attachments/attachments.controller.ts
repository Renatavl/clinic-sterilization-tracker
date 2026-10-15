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
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('Attachments')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@ApiForbiddenResponse({ description: 'Insufficient role' })
@Controller('attachments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post('maintenance/:maintenanceId')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({
    summary: 'Upload maintenance attachment',
    description: 'Accepts JPEG, PNG, or PDF files up to 5 MB.',
  })
  @ApiParam({
    name: 'maintenanceId',
    description: 'Maintenance record UUID',
    format: 'uuid',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @ApiCreatedResponse({ description: 'Attachment uploaded' })
  @ApiBadRequestResponse({ description: 'Invalid file type, size, or request' })
  @ApiNotFoundResponse({ description: 'Maintenance record not found' })
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
  @ApiOperation({
    summary: 'Upload sterilization attachment',
    description: 'Accepts JPEG, PNG, or PDF files up to 5 MB.',
  })
  @ApiParam({
    name: 'batchId',
    description: 'Sterilization batch UUID',
    format: 'uuid',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @ApiCreatedResponse({ description: 'Attachment uploaded' })
  @ApiBadRequestResponse({ description: 'Invalid file type, size, or request' })
  @ApiNotFoundResponse({ description: 'Sterilization batch not found' })
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
  @ApiOperation({ summary: 'Get maintenance attachments' })
  @ApiParam({
    name: 'maintenanceId',
    description: 'Maintenance record UUID',
    format: 'uuid',
  })
  @ApiOkResponse({ description: 'Maintenance attachments returned' })
  @ApiNotFoundResponse({ description: 'Maintenance record not found' })
  findForMaintenance(
    @Param('maintenanceId', ParseUUIDPipe)
    maintenanceId: string,
  ) {
    return this.attachmentsService.findForMaintenance(maintenanceId);
  }

  @Get('sterilization/:batchId')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get sterilization attachments' })
  @ApiParam({
    name: 'batchId',
    description: 'Sterilization batch UUID',
    format: 'uuid',
  })
  @ApiOkResponse({ description: 'Sterilization attachments returned' })
  @ApiNotFoundResponse({ description: 'Sterilization batch not found' })
  findForSterilization(
    @Param('batchId', ParseUUIDPipe)
    batchId: string,
  ) {
    return this.attachmentsService.findForSterilization(batchId);
  }

  @Get(':id/download')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Download attachment' })
  @ApiParam({ name: 'id', description: 'Attachment UUID', format: 'uuid' })
  @ApiOkResponse({
    description: 'Attachment file',
    content: {
      'application/octet-stream': {
        schema: { type: 'string', format: 'binary' },
      },
      'image/jpeg': { schema: { type: 'string', format: 'binary' } },
      'image/png': { schema: { type: 'string', format: 'binary' } },
      'application/pdf': { schema: { type: 'string', format: 'binary' } },
    },
  })
  @ApiNotFoundResponse({ description: 'Attachment or file not found' })
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
  @ApiOperation({ summary: 'Get attachment metadata' })
  @ApiParam({ name: 'id', description: 'Attachment UUID', format: 'uuid' })
  @ApiOkResponse({ description: 'Attachment metadata returned' })
  @ApiNotFoundResponse({ description: 'Attachment not found' })
  findOne(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    return this.attachmentsService.findOne(id);
  }
}
