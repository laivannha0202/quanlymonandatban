import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';
export class DashboardDto {
  @ApiPropertyOptional({ example: '2026-08-10' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  ngay?: string;
}
