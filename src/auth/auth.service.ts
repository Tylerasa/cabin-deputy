import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  LoggerService,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-auth.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';
import { MailSenderService } from 'src/mail-sender/mail-sender.service';
import { LoginUserEntity, UserEntity } from './entities/auth.entity';
import { Prisma } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';

export const roundsOfHashing = 10;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailSenderService: MailSenderService,
    private readonly jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    this.logger.log('Registering user', {
      ...createUserDto,
      password: '[REDACTED]',
    });
    const { email, phone, password, username, name } = createUserDto;
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: email, mode: 'insensitive' } },
          { username: { equals: username, mode: 'insensitive' } },
          { phone: { equals: phone, mode: 'insensitive' } },
        ],
      },
    });
    if (existingUser) {
      throw new BadRequestException(
        'Email or Username or Phone already exists',
      );
    }

    const hashedPassword = await bcrypt.hash(password, roundsOfHashing);

    const token = faker.string.nanoid();

    await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
        verificationToken: token,
      },
    });

    await this.mailSenderService.sendWelcomeMail(name, email, token);
    return {
      message:
        'User created successfully, please check your email for verification',
    };
  }

  async login(username: string, password: string): Promise<LoginUserEntity> {
    const whereClause: Prisma.UserWhereInput = {
      OR: [
        { username: { equals: username, mode: 'insensitive' } },
        { email: { equals: username, mode: 'insensitive' } },
      ],
    };
    const user = await this.prisma.user.findFirst({
      where: whereClause,
    });


    if (!user) {
      throw new NotFoundException(`No user found for username: ${username}`);
    }

    if (!user?.emailVerified) {
      throw new UnauthorizedException('Please verify your email first.');
    }

    if (!user.pin) {
      throw new UnauthorizedException('Please set a pin first.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    const accessToken = this.jwtService.sign({ userId: user.id });

    const sanitizedUser = {
      ...user,
      password: undefined,
      pin: undefined,
      verificationToken: undefined,
      emailVerified: undefined,
    };

    return {
      accessToken,
      message: 'Login successful',
      ...sanitizedUser,
    };
  }

  async verifyEmail(token: string, email: string, pin: string) {
    const user = await this.prisma.user.findFirst({
      where: { verificationToken: token, email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException(
        'This email has already been verified. No need to verify again.',
      );
    }

    const hashedPin = await bcrypt.hash(pin, roundsOfHashing);

    await this.prisma.wallet.create({
      data: {
        userId: user.id,
        balance: 10,
      },
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, pin: hashedPin },
    });

    return {
      message: 'Email verified successfully',
    };
  }

  async resendEmailVerification(email: string) {
    const user = await this.prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException(
        'This email has already been verified. No need to verify again.',
      );
    }

    await this.mailSenderService.sendWelcomeMail(
      user.name,
      user.email,
      user.verificationToken,
    );
    return {
      message: 'Email verification resent',
    };
  }

  async getMe(userId: string) {
    return this.findOne(userId);
  }
  async findOne(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        createdAt: true,
        wallet: true
      },
    });
  }
}
