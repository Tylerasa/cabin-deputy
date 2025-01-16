import {  IsString } from 'class-validator';

import { IsNotEmpty } from 'class-validator';

export class CompleteTransactionDto {
  @IsNotEmpty()
  @IsString()
  otpCode: string;


  @IsNotEmpty()
  @IsString()
  idempotencyKey: string;
}
