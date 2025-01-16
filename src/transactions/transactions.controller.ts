import { Controller, Post, Body, Req, UseGuards, Get } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CompleteTransactionDto } from './dto/complete-transaction.dto';

@Controller('transactions')
@ApiTags('Transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('initiate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  initTransaction(
    @Body() createTransactionDto: CreateTransactionDto,
    @Req() req: any,
  ) {
    return this.transactionsService.initiateTransaction(
      createTransactionDto,
      req.user.userId,
    );
  }

  @Post('complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  completeTransaction(@Body() completeTransactionDto: CompleteTransactionDto) {
    return this.transactionsService.completeTransaction(completeTransactionDto);
  }


  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getTransactionHistory(@Req() req: any) {
    return this.transactionsService.getTransactionHistory(req.user.userId);
  }
}
