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
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
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

@ApiTags('Equipment')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@ApiForbiddenResponse({ description: 'Insufficient role' })
@Controller('equipment')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create equipment' })
  @ApiCreatedResponse({ description: 'Equipment created' })
  @ApiBadRequestResponse({ description: 'Invalid equipment input' })
  @ApiConflictResponse({ description: 'Serial number already exists' })
  create(@Body() dto: CreateEquipmentDto) {
    return this.equipmentService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get paginated equipment list' })
  @ApiOkResponse({ description: 'Paginated equipment returned' })
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  findAll(
    @Query()
    query: EquipmentQueryDto,
  ) {
    return this.equipmentService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get equipment by ID' })
  @ApiParam({ name: 'id', description: 'Equipment UUID', format: 'uuid' })
  @ApiOkResponse({ description: 'Equipment returned' })
  @ApiNotFoundResponse({ description: 'Equipment not found' })
  findOne(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    return this.equipmentService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update equipment' })
  @ApiParam({ name: 'id', description: 'Equipment UUID', format: 'uuid' })
  @ApiOkResponse({ description: 'Equipment updated' })
  @ApiBadRequestResponse({ description: 'Invalid equipment input' })
  @ApiNotFoundResponse({ description: 'Equipment not found' })
  @ApiConflictResponse({ description: 'Serial number already exists' })
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
  @ApiOperation({ summary: 'Delete equipment' })
  @ApiParam({ name: 'id', description: 'Equipment UUID', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Equipment deleted' })
  @ApiNotFoundResponse({ description: 'Equipment not found' })
  async remove(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    await this.equipmentService.remove(id);
  }
}
