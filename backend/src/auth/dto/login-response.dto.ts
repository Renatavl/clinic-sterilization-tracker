import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../users/enums/user-role.enum.ts';

export class AuthenticatedUserResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'admin@clinic.com' })
  email: string;

  @ApiProperty({ example: 'Clinic' })
  firstName: string;

  @ApiProperty({ example: 'Administrator' })
  lastName: string;

  @ApiProperty({ enum: UserRole, example: UserRole.ADMIN })
  role: UserRole;
}

export class LoginResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ type: AuthenticatedUserResponseDto })
  user: AuthenticatedUserResponseDto;
}