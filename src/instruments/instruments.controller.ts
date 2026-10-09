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
import { InstrumentsService } from './instruments.service.ts';
import { Roles } from '../auth/decorators/roles.decorator.ts';
import { UserRole } from '../users/enums/user-role.enum.ts';
import { CreateInstrumentDto } from './dto/create-instrument.dto.ts';
import { UpdateInstrumentDto } from './dto/update-instrument.dto.ts';

@Controller('instruments')
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
)
export class InstrumentsController {
  constructor(
    private readonly instrumentsService: InstrumentsService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(
    @Body() dto: CreateInstrumentDto,
  ) {
    return this.instrumentsService.create(dto);
  }

  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.STAFF,
  )
  findAll() {
    return this.instrumentsService.findAll();
  }

  @Get(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.STAFF,
  )
  findOne(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    return this.instrumentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(
    @Param('id', ParseUUIDPipe)
    id: string,

    @Body()
    dto: UpdateInstrumentDto,
  ) {
    return this.instrumentsService.update(
      id,
      dto,
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    await this.instrumentsService.remove(id);
  }
}