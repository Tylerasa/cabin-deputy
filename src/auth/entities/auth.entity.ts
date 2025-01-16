import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phone: string;

  @Exclude()
  emailVerified: boolean;

  @ApiProperty()
  createdAt: Date;

  @Exclude()
  password: string;

  @Exclude()
  pin: string;
}

export class LoginUserEntity extends UserEntity {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  message: string;
}
