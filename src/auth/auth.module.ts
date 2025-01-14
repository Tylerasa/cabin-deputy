import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MailSenderModule } from 'src/mail-sender/mail-sender.module';
import { JwtModule } from '@nestjs/jwt';



export const jwtSecret = 'b3B0aWNhc2gK';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  imports: [
    PrismaModule,
    MailSenderModule,

    JwtModule.register({
      secret: jwtSecret,
      signOptions: { expiresIn: '1d' },
    }),
  ],
})
export class AuthModule {}
