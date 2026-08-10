import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';
export class KhoangNgayBaoCaoDto {
  @ApiPropertyOptional({ example: '2026-08-01' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  tuNgay?: string;

  @ApiPropertyOptional({ example: '2026-08-31' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  denNgay?: string;
}
