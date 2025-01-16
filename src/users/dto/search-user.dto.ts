import { ApiProperty } from '@nestjs/swagger';
import {  IsString } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination.dto';

export class SearchUserDto extends PaginationQueryDto {
  @IsString()
  @ApiProperty()
  query: string;
}
