import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { AuthService } from './auth.service.ts';
import { LoginDto } from './dto/login.dto.ts';
import { JwtAuthGuard } from './guards/jwt-auth.guard.ts';
import { CurrentUser } from './decorators/current-user.decorator.ts';
import type { AuthenticatedUser } from './types/authenticated-user.type.ts';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return user;
  }
}
