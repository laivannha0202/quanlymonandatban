import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class TaoNgayDacBietDto {
  @ApiProperty({ example: '2026-09-02' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  ngay: string;

  @ApiProperty({ example: 'Quốc khánh' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  tenSuKien: string;

  @ApiProperty({ default: true })
  @IsBoolean()
  dongCuaCaNgay: boolean;

  @ApiPropertyOptional({ example: '17:00' })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  gioMoCua?: string;

  @ApiPropertyOptional({ example: '22:00' })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  gioDongCua?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  ghiChu?: string;
}
