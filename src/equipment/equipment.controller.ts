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
import { EquipmentService } from './equipment.service.ts';
import { UserRole } from '../users/enums/user-role.enum.ts';
import { Roles } from '../auth/decorators/roles.decorator.ts';
import { CreateEquipmentDto } from './dto/create-equipment.dto.ts';
import { UpdateEquipmentDto } from './dto/update-equipment.dto.ts';
import { EquipmentQueryDto } from './dto/equipment-query.dto.ts';

@Controller('equipment')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateEquipmentDto) {
    return this.equipmentService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  findAll(
    @Query()
    query: EquipmentQueryDto,
  ) {
    return this.equipmentService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  findOne(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    return this.equipmentService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(
    @Param('id', ParseUUIDPipe)
    id: string,

    @Body()
    dto: UpdateEquipmentDto,
  ) {
    return this.equipmentService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    await this.equipmentService.remove(id);
  }
}
