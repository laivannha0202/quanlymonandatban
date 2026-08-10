import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class TaoKhuVucDto {
  @ApiProperty({ example: 'KV_TANG_1' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  maKhuVuc: string;

  @ApiProperty({ example: 'Tầng 1' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  tenKhuVuc: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
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

  @ApiPropertyOptional({ enum: ['HOAT_DONG', 'NGUNG_HOAT_DONG'], default: 'HOAT_DONG' })
  @IsOptional()
  @IsIn(['HOAT_DONG', 'NGUNG_HOAT_DONG'])
  trangThai?: string;
}
