import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto.ts';

export class UpdateUserDto extends PartialType(CreateUserDto) {}