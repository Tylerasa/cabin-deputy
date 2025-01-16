import { IsNumber, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateTransactionDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  amount: number;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  pin: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  recipient_id: string;
}
