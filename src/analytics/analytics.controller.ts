import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.ts';
import { RolesGuard } from '../auth/guards/roles.guard.ts';
import { Roles } from '../auth/decorators/roles.decorator.ts';
import { UserRole } from '../users/enums/user-role.enum.ts';
import { AnalyticsService } from './analytics.service.ts';
import { AnalyticsDateRangeQueryDto } from './dto/analytics-date-range-query.dto.ts';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  getOverview() {
    return this.analyticsService.getOverview();
  }

  @Get('equipment')
  getEquipmentAnalytics() {
    return this.analyticsService.getEquipmentAnalytics();
  }

  @Get('instruments')
  getInstrumentAnalytics() {
    return this.analyticsService.getInstrumentAnalytics();
  }

  @Get('sterilization')
  getSterilizationAnalytics(
    @Query()
    query: AnalyticsDateRangeQueryDto,
  ) {
    return this.analyticsService.getSterilizationAnalytics(query);
  }

  @Get('maintenance')
  getMaintenanceAnalytics() {
    return this.analyticsService.getMaintenanceAnalytics();
  }
}