import { IsString, MaxLength, MinLength } from "class-validator";

export class CreateInstrumentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  instrumentCode: string;
}