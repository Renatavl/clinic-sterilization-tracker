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
import { InstrumentsService } from './instruments.service.ts';
import { Roles } from '../auth/decorators/roles.decorator.ts';
import { UserRole } from '../users/enums/user-role.enum.ts';
import { CreateInstrumentDto } from './dto/create-instrument.dto.ts';
import { UpdateInstrumentDto } from './dto/update-instrument.dto.ts';
import { InstrumentQueryDto } from './dto/instrument-query.dto.ts';
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

@ApiTags('Instruments')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@ApiForbiddenResponse({ description: 'Insufficient role' })
@Controller('instruments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InstrumentsController {
  constructor(private readonly instrumentsService: InstrumentsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create instrument' })
  @ApiCreatedResponse({ description: 'Instrument created' })
  @ApiBadRequestResponse({ description: 'Invalid instrument input' })
  @ApiConflictResponse({ description: 'Instrument code already exists' })
  create(@Body() dto: CreateInstrumentDto) {
    return this.instrumentsService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get paginated instrument list' })
  @ApiOkResponse({ description: 'Paginated instruments returned' })
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  findAll(
    @Query()
    query: InstrumentQueryDto,
  ) {
    return this.instrumentsService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get instrument by ID' })
  @ApiParam({ name: 'id', description: 'Instrument UUID', format: 'uuid' })
  @ApiOkResponse({ description: 'Instrument returned' })
  @ApiNotFoundResponse({ description: 'Instrument not found' })
  findOne(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    return this.instrumentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update instrument' })
  @ApiParam({ name: 'id', description: 'Instrument UUID', format: 'uuid' })
  @ApiOkResponse({ description: 'Instrument updated' })
  @ApiBadRequestResponse({ description: 'Invalid instrument input' })
  @ApiNotFoundResponse({ description: 'Instrument not found' })
  @ApiConflictResponse({ description: 'Instrument code already exists' })
  update(
    @Param('id', ParseUUIDPipe)
    id: string,

    @Body()
    dto: UpdateInstrumentDto,
  ) {
    return this.instrumentsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete instrument' })
  @ApiParam({ name: 'id', description: 'Instrument UUID', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Instrument deleted' })
  @ApiNotFoundResponse({ description: 'Instrument not found' })
  async remove(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    await this.instrumentsService.remove(id);
  }
}
