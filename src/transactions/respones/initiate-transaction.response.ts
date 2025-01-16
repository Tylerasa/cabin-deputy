import { ApiProperty } from '@nestjs/swagger';

interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  idempotencyKey: string;
  userId: string;
  expiryDate: Date;
  phoneNumber: string;
  otpCode: string;
}

export class InitiateTransactionResponse {
  @ApiProperty()
  message: string;

  @ApiProperty()
  data: PaymentIntent;

  constructor(message: string, data: PaymentIntent) {
    this.message = message;
    this.data = data;
  }
}
