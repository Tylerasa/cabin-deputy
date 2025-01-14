import { Controller, Post, Body, Param, Req, Get } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-auth.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { LoginUserEntity, UserEntity } from './entities/auth.entity';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendEmailVerificationDto } from './dto/resend-verification.dto';

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

  @Post('verify-email/:token')
  @ApiOkResponse({ type: UserEntity })
  verifyEmail(@Param('token') token: string, @Body() { email }: VerifyEmailDto) {
    return this.authService.verifyEmail(token, email);
  }


  @Post('/resend-verification')
  @ApiOkResponse({ type: UserEntity })
  resendEmailVerification(@Body() { email }: ResendEmailVerificationDto) {
    return this.authService.resendEmailVerification(email);
  }


  @Get('me')
  @ApiBearerAuth()
  @ApiOkResponse({ type: UserEntity })
  getMe(@Req() req: any) {
    const user = req.user;
    return this.authService.getMe(user.id);
  }
}
