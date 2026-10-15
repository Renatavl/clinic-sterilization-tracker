import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.ts';
import { RolesGuard } from '../auth/guards/roles.guard.ts';
import { MaintenanceService } from './maintenance.service.ts';
import { Roles } from '../auth/decorators/roles.decorator.ts';
import { UserRole } from '../users/enums/user-role.enum.ts';
import { CreateMaintenanceRecordDto } from './dto/create-maintenance-record.dto.ts';
import { UpdateMaintenanceRecordDto } from './dto/update-maintenance-record.dto.ts';
import { MaintenanceQueryDto } from './dto/maintenance-query.dto.ts';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('Maintenance')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@ApiForbiddenResponse({ description: 'Insufficient role' })
@Controller('maintenance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Create maintenance record' })
  @ApiCreatedResponse({ description: 'Maintenance record created' })
  @ApiBadRequestResponse({ description: 'Invalid maintenance input' })
  @ApiNotFoundResponse({ description: 'Equipment not found' })
  create(
    @Body()
    dto: CreateMaintenanceRecordDto,
  ) {
    return this.maintenanceService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get paginated maintenance records' })
  @ApiOkResponse({ description: 'Paginated maintenance records returned' })
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  findAll(
    @Query()
    query: MaintenanceQueryDto,
  ) {
    return this.maintenanceService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get maintenance record by ID' })
  @ApiParam({ name: 'id', description: 'Maintenance record UUID', format: 'uuid' })
  @ApiOkResponse({ description: 'Maintenance record returned' })
  @ApiNotFoundResponse({ description: 'Maintenance record not found' })
  findOne(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    return this.maintenanceService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Update maintenance record' })
  @ApiParam({ name: 'id', description: 'Maintenance record UUID', format: 'uuid' })
  @ApiOkResponse({ description: 'Maintenance record updated' })
  @ApiBadRequestResponse({ description: 'Invalid maintenance input' })
  @ApiNotFoundResponse({ description: 'Maintenance record not found' })
  update(
    @Param('id', ParseUUIDPipe)
    id: string,

    @Body()
    dto: UpdateMaintenanceRecordDto,
  ) {
    return this.maintenanceService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete maintenance record' })
  @ApiParam({ name: 'id', description: 'Maintenance record UUID', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Maintenance record deleted' })
  @ApiNotFoundResponse({ description: 'Maintenance record not found' })
  async remove(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    await this.maintenanceService.remove(id);
  }
}
