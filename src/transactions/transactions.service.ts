import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaymentIntent } from '@prisma/client';
import { MailSenderService } from 'src/mail-sender/mail-sender.service';
import * as bcrypt from 'bcrypt';
import { CompleteTransactionDto } from './dto/complete-transaction.dto';

interface UserEmailWithWallet {
  user: {
    name: string;
    email: string;
    wallet: {
      currencyCode: string;
    };
  };
}

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailSenderService: MailSenderService,
  ) {}

  private readonly logger = new Logger(TransactionsService.name);

  async initiateTransaction(
    createTransactionDto: CreateTransactionDto,
    userId: string,
  ): Promise<{ message: string; data: PaymentIntent }> {
    this.logger.log('Initiating transaction', {
      userId,
      createTransactionDto,
    });
    const { amount, pin, recipient_id } = createTransactionDto;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallet: {
          select: {
            id: true,
            balance: true,
          },
        },
      },
    });

    const decryptedPin = await bcrypt.compare(pin, user.pin);

    if (!decryptedPin) {
      this.logger.error('Invalid pin', {
        userId,
        pin,
      });
      throw new UnauthorizedException('Invalid pin');
    }

    if (!user) {
      this.logger.error('User not found', {
        userId,
      });
      throw new UnauthorizedException('Invalid pin');
    }

    if (amount <= 0) {
      this.logger.error('Amount must be greater than 0', {
        userId,
        amount,
      });
      throw new BadRequestException('Amount must be greater than 0');
    }

    if (amount > user.wallet.balance) {
      this.logger.error('Insufficient balance', {
        userId,
        amount,
        balance: user.wallet.balance,
      });
      throw new BadRequestException('Insufficient balance');
    }

    const recipient = await this.prisma.user.findUnique({
      where: { id: recipient_id },
      include: {
        wallet: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!recipient) {
      this.logger.error('Recipient not found', {
        recipient_id,
      });
      throw new NotFoundException('Recipient not found');
    }

    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

    const paymentIntent = await this.prisma.paymentIntent.create({
      data: {
        userId: user.id,
        otpCode,
        senderWalletId: user.wallet.id,
        recipientWalletId: recipient.wallet.id,
        amount,
      },
    });

    await this.mailSenderService.sendPaymentIntentMail(
      user.name,
      user.email,
      otpCode,
    );

    this.logger.log('Transaction initiated successfully', {
      paymentIntentId: paymentIntent.id,
    });

    return {
      message: 'Transaction initiated successfully',
      data: paymentIntent,
    };
  }

  async completeTransaction(completeTransactionDto: CompleteTransactionDto) {
    const { otpCode, idempotencyKey } = completeTransactionDto;

    this.logger.log('Completing transaction', {
      idempotencyKey,
    });

    const paymentIntent = await this.prisma.paymentIntent.findUnique({
      where: { idempotencyKey },
      select: {
        id: true,
        otpCode: true,
        expiryDate: true,
        amount: true,
        senderWalletId: true,
        recipientWalletId: true,
        senderWallet: {
          select: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            currencyCode: true,
          },
        },
        recipientWallet: {
          select: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        transaction: true,
      },
    });

    if (!paymentIntent) {
      this.logger.error('Payment intent not found', {
        idempotencyKey,
      });
      throw new NotFoundException('Payment intent not found');
    }

    if (paymentIntent.transaction) {
      this.logger.error('Transaction already processed', {
        idempotencyKey,
      });
      return {
        message: 'Transaction already processed',
        data: paymentIntent.transaction,
      };
    }

    if (paymentIntent.otpCode !== otpCode) {
      this.logger.error('Invalid OTP code', {
        idempotencyKey,
        otpCode,
      });
      throw new UnauthorizedException('Invalid OTP code');
    }

    if (paymentIntent.expiryDate < new Date()) {
      this.logger.error('Payment intent expired', {
        idempotencyKey,
      });
      throw new UnauthorizedException('Payment intent expired');
    }

    try {
      const [transaction] = await this.prisma.$transaction([
        this.prisma.transaction.create({
          data: {
            amount: paymentIntent.amount,
            senderWalletId: paymentIntent.senderWalletId,
            recipientWalletId: paymentIntent.recipientWalletId,
            paymentIntentId: paymentIntent.id,
          },
        }),
        this.prisma.wallet.update({
          where: { id: paymentIntent.senderWalletId },
          data: { balance: { decrement: paymentIntent.amount } },
        }),
        this.prisma.wallet.update({
          where: { id: paymentIntent.recipientWalletId },
          data: { balance: { increment: paymentIntent.amount } },
        }),
      ]);

      this.logger.log('Transaction completed successfully', {
        transactionId: transaction.id,
      });

      await this.generateTransactionEmails(
        {
          user: {
            name: paymentIntent.senderWallet.user.name,
            email: paymentIntent.senderWallet.user.email,
            wallet: {
              currencyCode: paymentIntent.senderWallet.currencyCode,
            },
          },
        },
        {
          user: {
            name: paymentIntent.recipientWallet.user.name,
            email: paymentIntent.recipientWallet.user.email,
            wallet: {
              currencyCode: paymentIntent.senderWallet.currencyCode,
            },
          },
        },
        paymentIntent.amount,
        paymentIntent.senderWallet.currencyCode,
      );

      return {
        message: 'Transaction completed successfully',
        data: transaction,
      };
    } catch (error) {
      this.logger.error('Transaction failed', {
        idempotencyKey,
        error: error.message,
      });

      await this.prisma.transaction.create({
        data: {
          amount: paymentIntent.amount,
          senderWalletId: paymentIntent.senderWalletId,
          recipientWalletId: paymentIntent.recipientWalletId,
          paymentIntentId: paymentIntent.id,
          status: 'FAILED',
        },
      });

      throw new Error(`Transaction failed: ${error.message}`);
    }
  }

  generateTransactionEmails(
    sender: UserEmailWithWallet,
    recipient: UserEmailWithWallet,
    amount: number,
    currency: string,
  ) {
    this.logger.log('Generating transaction emails', {
      sender,
      recipient,
      amount,
      currency,
    });
    this.mailSenderService.sendTransactionSuccessSenderMail(
      sender.user.name,
      sender.user.email,
      amount,
      recipient.user.name,
      currency,
    );

    this.mailSenderService.sendTransactionSuccessRecipientMail(
      recipient.user.name,
      recipient.user.email,
      amount,
      sender.user.name,
      currency,
    );
  }

  async getTransactionHistory(userId: string) {
    this.logger.log('Getting transaction history', {
      userId,
    });
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      this.logger.error('Wallet not found', {
        userId,
      });
      throw new NotFoundException('Wallet not found');
    }

    return this.prisma.transaction.findMany({
      where: {
        OR: [{ senderWalletId: wallet.id }, { recipientWalletId: wallet.id }],
      },
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true,
        senderWallet: {
          select: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            currencyCode: true,
          },
        },
        recipientWallet: {
          select: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            currencyCode: true,
          },
        },
      },
    });
  }
}
