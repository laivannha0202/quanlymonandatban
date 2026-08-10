import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class HuyDatBanDto {
  @ApiPropertyOptional({ example: 'Có việc đột xuất' })
  @IsOptional() @IsString() @MaxLength(2000)
  lyDo?: string;
}
