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
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.ts';
import { RolesGuard } from '../auth/guards/roles.guard.ts';
import { SterilizationService } from './sterilization.service.ts';
import { Roles } from '../auth/decorators/roles.decorator.ts';
import { UserRole } from '../users/enums/user-role.enum.ts';
import { CreateSterilizationBatchDto } from './dto/create-sterilization-batch.dto.ts';
import { UpdateSterilizationBatchDto } from './dto/update-sterilization-batch.dto.ts';
import { CompleteSterilizationBatchDto } from './dto/complete-sterilization-batch.dto.ts';

@Controller('sterilization-batches')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SterilizationController {
  constructor(private readonly sterilizationService: SterilizationService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  create(
    @Body()
    dto: CreateSterilizationBatchDto,
  ) {
    return this.sterilizationService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  findAll() {
    return this.sterilizationService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  findOne(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    return this.sterilizationService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  update(
    @Param('id', ParseUUIDPipe)
    id: string,

    @Body()
    dto: UpdateSterilizationBatchDto,
  ) {
    return this.sterilizationService.update(id, dto);
  }

  @Post(':id/start')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @HttpCode(HttpStatus.OK)
  start(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    return this.sterilizationService.start(id);
  }

  @Post(':id/complete')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @HttpCode(HttpStatus.OK)
  complete(
    @Param('id', ParseUUIDPipe)
    id: string,

    @Body()
    dto: CompleteSterilizationBatchDto,
  ) {
    return this.sterilizationService.complete(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    await this.sterilizationService.remove(id);
  }
}
