import {
  Controller,
  Post,
  Body,
  Param,
  Req,
  Get,
  UseGuards,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-auth.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { LoginUserEntity, UserEntity } from './entities/auth.entity';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendEmailVerificationDto } from './dto/resend-verification.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiCreatedResponse({ type: UserEntity })
  async register(@Body() createUserDto: CreateUserDto) {
    const user = await this.authService.register(createUserDto);
    return user;
  }

  @Post('login')
  @ApiOkResponse({ type: LoginUserEntity })
  login(@Body() { username, password }: LoginDto) {
    return this.authService.login(username, password);
  }

  @Post('verify-email')
  @ApiOkResponse({ type: UserEntity })
  verifyEmail(@Body() { token, email, pin }: VerifyEmailDto) {
    return this.authService.verifyEmail(token, email, pin);
  }

  @Post('/resend-verification')
  @ApiOkResponse({ type: UserEntity })
  resendEmailVerification(@Body() { email }: ResendEmailVerificationDto) {
    return this.authService.resendEmailVerification(email);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: UserEntity })
  async getMe(@Req() req: any) {
    return this.authService.getMe(req.user.userId);
  }
}
