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

  @ApiProperty()
  emailVerified: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  @Exclude({ toPlainOnly: true })
  password: string;

  @ApiProperty()
  @Exclude({ toPlainOnly: true })
  pin: string;
}


export class LoginUserEntity extends UserEntity {
  @ApiProperty()
  accessToken: string;
}
