import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumberString, IsOptional, Matches, Max, Min } from 'class-validator';

export class TimBanTrongDto {
  @ApiProperty({ example: '2026-08-20' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  ngay: string;

  @ApiProperty({ example: '19:00' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  gioBatDau: string;

  @ApiProperty({ example: 4 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  soNguoi: number;

  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsNumberString()
  khuVucId?: string;
}
