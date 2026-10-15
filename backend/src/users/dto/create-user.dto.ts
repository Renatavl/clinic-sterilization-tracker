import {
    IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../enums/user-role.enum.ts';

export class CreateUserDto {
  @ApiProperty({ example: 'admin@clinic.com' })
  @IsString()
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: 'StrongPassword123', format: 'password' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @ApiProperty({ example: 'Clinic' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Administrator' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.STAFF })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
