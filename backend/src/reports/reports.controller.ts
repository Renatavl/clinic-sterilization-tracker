import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';

import { createReadStream } from 'fs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.ts';
import { RolesGuard } from '../auth/guards/roles.guard.ts';
import { ReportsService } from './reports.service.ts';
import { Roles } from '../auth/decorators/roles.decorator.ts';
import { UserRole } from '../users/enums/user-role.enum.ts';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('Reports')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@ApiForbiddenResponse({ description: 'Insufficient role' })
@Controller('reports')
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
)
export class ReportsController {
  constructor(
    private readonly reportsService:
      ReportsService,
  ) {}

  @Post('sterilization/:batchId')
  @Roles(
    UserRole.ADMIN,
    UserRole.STAFF,
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate sterilization report' })
  @ApiParam({
    name: 'batchId',
    description: 'Sterilization batch UUID',
    format: 'uuid',
  })
  @ApiProduces('text/html')
  @ApiOkResponse({
    description: 'Generated HTML sterilization report',
    content: {
      'text/html': { schema: { type: 'string' } },
    },
  })
  @ApiNotFoundResponse({ description: 'Sterilization batch not found' })
  @ApiConflictResponse({ description: 'Sterilization batch is not completed' })
  async generateSterilizationReport(
    @Param(
      'batchId',
      ParseUUIDPipe,
    )
    batchId: string,
  ) {
    const {
      fileName,
      absolutePath,
    } =
      await this.reportsService
        .generateSterilizationReport(
          batchId,
        );

    return new StreamableFile(
      createReadStream(
        absolutePath,
      ),
      {
        type:
          'text/html; charset=utf-8',

        disposition:
          `attachment; filename="${fileName}"`,
      },
    );
  }

  @Post('maintenance/:maintenanceId')
  @Roles(
    UserRole.ADMIN,
    UserRole.STAFF,
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate maintenance report' })
  @ApiParam({
    name: 'maintenanceId',
    description: 'Maintenance record UUID',
    format: 'uuid',
  })
  @ApiProduces('text/html')
  @ApiOkResponse({
    description: 'Generated HTML maintenance report',
    content: {
      'text/html': { schema: { type: 'string' } },
    },
  })
  @ApiNotFoundResponse({ description: 'Maintenance record not found' })
  async generateMaintenanceReport(
    @Param(
      'maintenanceId',
      ParseUUIDPipe,
    )
    maintenanceId: string,
  ) {
    const {
      fileName,
      absolutePath,
    } =
      await this.reportsService
        .generateMaintenanceReport(
          maintenanceId,
        );

    return new StreamableFile(
      createReadStream(
        absolutePath,
      ),
      {
        type:
          'text/html; charset=utf-8',

        disposition:
          `attachment; filename="${fileName}"`,
      },
    );
  }
}