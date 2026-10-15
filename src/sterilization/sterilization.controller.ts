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
import { SterilizationService } from './sterilization.service.ts';
import { Roles } from '../auth/decorators/roles.decorator.ts';
import { UserRole } from '../users/enums/user-role.enum.ts';
import { CreateSterilizationBatchDto } from './dto/create-sterilization-batch.dto.ts';
import { UpdateSterilizationBatchDto } from './dto/update-sterilization-batch.dto.ts';
import { CompleteSterilizationBatchDto } from './dto/complete-sterilization-batch.dto.ts';
import { SterilizationQueryDto } from './dto/sterilization-query.dto.ts';
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

@ApiTags('Sterilization')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@ApiForbiddenResponse({ description: 'Insufficient role' })
@Controller('sterilization-batches')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SterilizationController {
  constructor(private readonly sterilizationService: SterilizationService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Create sterilization batch' })
  @ApiCreatedResponse({ description: 'Sterilization batch created' })
  @ApiBadRequestResponse({ description: 'Invalid sterilization input' })
  @ApiNotFoundResponse({ description: 'Equipment or instrument not found' })
  @ApiConflictResponse({ description: 'Equipment or instrument unavailable' })
  create(
    @Body()
    dto: CreateSterilizationBatchDto,
  ) {
    return this.sterilizationService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get paginated sterilization batches' })
  @ApiOkResponse({ description: 'Paginated sterilization batches returned' })
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  findAll(
    @Query()
    query: SterilizationQueryDto,
  ) {
    return this.sterilizationService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get sterilization batch by ID' })
  @ApiParam({ name: 'id', description: 'Sterilization batch UUID', format: 'uuid' })
  @ApiOkResponse({ description: 'Sterilization batch returned' })
  @ApiNotFoundResponse({ description: 'Sterilization batch not found' })
  findOne(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    return this.sterilizationService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Update sterilization batch' })
  @ApiParam({ name: 'id', description: 'Sterilization batch UUID', format: 'uuid' })
  @ApiOkResponse({ description: 'Sterilization batch updated' })
  @ApiBadRequestResponse({ description: 'Invalid sterilization input' })
  @ApiNotFoundResponse({ description: 'Batch, equipment, or instrument not found' })
  @ApiConflictResponse({ description: 'Batch state or resource availability conflict' })
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
  @ApiOperation({ summary: 'Start sterilization batch' })
  @ApiParam({ name: 'id', description: 'Sterilization batch UUID', format: 'uuid' })
  @ApiOkResponse({ description: 'Sterilization batch started' })
  @ApiNotFoundResponse({ description: 'Sterilization batch not found' })
  @ApiConflictResponse({ description: 'Batch state, equipment, or instrument conflict' })
  start(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    return this.sterilizationService.start(id);
  }

  @Post(':id/complete')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete sterilization batch' })
  @ApiParam({ name: 'id', description: 'Sterilization batch UUID', format: 'uuid' })
  @ApiOkResponse({ description: 'Sterilization batch completed' })
  @ApiBadRequestResponse({ description: 'Invalid completion result' })
  @ApiNotFoundResponse({ description: 'Sterilization batch not found' })
  @ApiConflictResponse({ description: 'Batch or instrument state conflict' })
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
  @ApiOperation({ summary: 'Delete sterilization batch' })
  @ApiParam({ name: 'id', description: 'Sterilization batch UUID', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Sterilization batch deleted' })
  @ApiNotFoundResponse({ description: 'Sterilization batch not found' })
  @ApiConflictResponse({ description: 'Only deletable batch states can be removed' })
  async remove(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    await this.sterilizationService.remove(id);
  }
}
