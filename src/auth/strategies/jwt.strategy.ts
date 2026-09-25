import {
  HttpStatus,
  Injectable,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import {
  PassportStrategy,
} from '@nestjs/passport';

import {
  ExtractJwt,
  Strategy,
} from 'passport-jwt';
import { UsersService } from '../../users/users.service.ts';
import { JwtPayload } from '../types/jwt-payload.type.ts';
import { AppException } from '../../common/exceptions/app.exception.ts';



@Injectable()
export class JwtStrategy extends PassportStrategy(
  Strategy,
  'jwt',
) {
  constructor(
    configService: ConfigService,

    private readonly usersService:
      UsersService,
  ) {
    super({
      jwtFromRequest:
        ExtractJwt.fromAuthHeaderAsBearerToken(),

      ignoreExpiration: false,

      secretOrKey:
        configService.getOrThrow<string>(
          'JWT_SECRET',
        ),
    });
  }

  async validate(
    payload: JwtPayload,
  ) {
    const user =
      await this.usersService.findOne(
        payload.sub,
      );

    if (!user.isActive) {
      throw new AppException(
        HttpStatus.FORBIDDEN,
        'ACCOUNT_INACTIVE',
        'Account is inactive',
      );
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
  }
}