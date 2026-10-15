import { IsString, MaxLength, MinLength } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class CreateInstrumentDto {
  @ApiProperty({ example: 'Dental Mirror' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name: string;

  @ApiProperty({ example: 'MIRROR-001' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  instrumentCode: string;
}