import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.ts';
import { RolesGuard } from '../auth/guards/roles.guard.ts';
import { Roles } from '../auth/decorators/roles.decorator.ts';
import { UserRole } from '../users/enums/user-role.enum.ts';
import { AnalyticsService } from './analytics.service.ts';
import { AnalyticsDateRangeQueryDto } from './dto/analytics-date-range-query.dto.ts';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('Analytics')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@ApiForbiddenResponse({ description: 'Insufficient role' })
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get analytics overview' })
  @ApiOkResponse({
    description: 'Overview totals returned',
    schema: {
      example: {
        equipment: 12,
        instruments: 86,
        maintenanceRecords: 25,
        sterilizationBatches: 50,
      },
    },
  })
  getOverview() {
    return this.analyticsService.getOverview();
  }

  @Get('equipment')
  @ApiOperation({ summary: 'Get equipment analytics' })
  @ApiOkResponse({ description: 'Equipment analytics returned' })
  getEquipmentAnalytics() {
    return this.analyticsService.getEquipmentAnalytics();
  }

  @Get('instruments')
  @ApiOperation({ summary: 'Get instrument analytics' })
  @ApiOkResponse({ description: 'Instrument analytics returned' })
  getInstrumentAnalytics() {
    return this.analyticsService.getInstrumentAnalytics();
  }

  @Get('sterilization')
  @ApiOperation({ summary: 'Get sterilization analytics' })
  @ApiOkResponse({ description: 'Sterilization analytics returned' })
  @ApiBadRequestResponse({ description: 'Invalid date range' })
  getSterilizationAnalytics(
    @Query()
    query: AnalyticsDateRangeQueryDto,
  ) {
    return this.analyticsService.getSterilizationAnalytics(query);
  }

  @Get('maintenance')
  @ApiOperation({ summary: 'Get maintenance analytics' })
  @ApiOkResponse({ description: 'Maintenance analytics returned' })
  getMaintenanceAnalytics() {
    return this.analyticsService.getMaintenanceAnalytics();
  }
}