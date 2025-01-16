import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { SearchUserDto } from './dto/search-user.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller('users')
@ApiTags('Users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("/search")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  searchUsers(@Query() query: SearchUserDto, @Req() req: any) {
    return this.usersService.searchUsers(query, req.user.userId);
  }

}
