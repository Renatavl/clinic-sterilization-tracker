import {
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@clinic.com' })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: 'StrongPassword123', format: 'password' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}