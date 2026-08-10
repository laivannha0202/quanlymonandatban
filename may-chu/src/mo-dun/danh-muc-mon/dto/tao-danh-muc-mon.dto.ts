import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class TaoDanhMucMonDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  maDanhMuc!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  tenDanhMuc!: string;

  @ApiPropertyOptional({ description: 'Nếu bỏ trống hệ thống tự sinh từ tên danh mục' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  duongDan?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  moTa?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  hinhAnh?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  thuTu?: number;

  @ApiPropertyOptional({ enum: ['HOAT_DONG', 'NGUNG_HOAT_DONG'] })
  @IsOptional()
  @IsIn(['HOAT_DONG', 'NGUNG_HOAT_DONG'])
  trangThai?: string;
}
