import { IsNotEmpty } from "class-validator";

import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

export class ResendEmailVerificationDto {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty()
  email: string;
}
