import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class TaoMonAnDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  maMon!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  danhMucId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  tenMon!: string;

  @ApiPropertyOptional({ description: 'Nếu bỏ trống hệ thống tự sinh từ tên món' })
  @IsOptional()
  @IsString()
  @MaxLength(220)
  duongDan?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  moTa?: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  gia!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  giaKhuyenMai?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  hinhAnhChinh?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  laMonNoiBat?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  conMon?: boolean;

  @ApiPropertyOptional({ enum: ['HOAT_DONG', 'NGUNG_HOAT_DONG'] })
  @IsOptional()
  @IsIn(['HOAT_DONG', 'NGUNG_HOAT_DONG'])
  trangThai?: string;
}
