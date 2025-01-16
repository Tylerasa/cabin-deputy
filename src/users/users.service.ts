import { Injectable } from '@nestjs/common';
import { SearchUserDto } from './dto/search-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  searchUsers(query: SearchUserDto, userId: string) {

    const { page = 1, limit = 10, query: searchQuery } = query;
    const skip = (page - 1) * limit;
    const take = limit;

    const whereClause: Prisma.UserWhereInput = {
      OR: [
        { username: { contains: searchQuery, mode: 'insensitive' } },
        { name: { contains: searchQuery, mode: 'insensitive' } },
      ],
      id: {
        not: userId
      },
      emailVerified: true,
    };

    return this.prisma.user.findMany({
      where: whereClause,
      skip,
      take,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        wallet: {
          select: {
            id: true,
          },
        },
      },
    });
  }
}
