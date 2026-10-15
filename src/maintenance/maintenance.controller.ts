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

@Controller('maintenance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  create(
    @Body()
    dto: CreateMaintenanceRecordDto,
  ) {
    return this.maintenanceService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  findAll(
    @Query()
    query: MaintenanceQueryDto,
  ) {
    return this.maintenanceService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  findOne(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    return this.maintenanceService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
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
  async remove(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    await this.maintenanceService.remove(id);
  }
}
