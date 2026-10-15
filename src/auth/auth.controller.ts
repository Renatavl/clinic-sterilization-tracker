import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import { AuthService } from './auth.service.ts';
import { LoginDto } from './dto/login.dto.ts';
import { JwtAuthGuard } from './guards/jwt-auth.guard.ts';
import { CurrentUser } from './decorators/current-user.decorator.ts';
import type { AuthenticatedUser } from './types/authenticated-user.type.ts';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  AuthenticatedUserResponseDto,
  LoginResponseDto,
} from './dto/login-response.dto.ts';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login' })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid login input' })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current user' })
  @ApiOkResponse({ type: AuthenticatedUserResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  getMe(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return user;
  }
}
