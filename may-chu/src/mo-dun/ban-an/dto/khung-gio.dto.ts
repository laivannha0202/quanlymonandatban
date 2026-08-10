import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

export class KhungGioDto {
  @ApiProperty({ example: '2026-08-20' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  ngay: string;
}
