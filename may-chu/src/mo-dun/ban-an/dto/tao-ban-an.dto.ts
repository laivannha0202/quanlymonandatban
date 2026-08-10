import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class TaoBanAnDto {
  @ApiProperty({ example: 'A07' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  maBan: string;

  @ApiProperty({ example: 'Bàn A07' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  tenBan: string;

  @ApiProperty({ example: '1' })
  @IsNumberString()
  khuVucId: string;

  @ApiProperty({ example: 4 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sucChua: number;

  @ApiProperty({ example: 6 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sucChuaToiDa: number;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  viTriX?: number;

  @ApiPropertyOptional({ example: 80 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  viTriY?: number;

  @ApiPropertyOptional({ enum: ['TRONG', 'DANG_SU_DUNG', 'BAO_TRI', 'NGUNG_SU_DUNG'], default: 'TRONG' })
  @IsOptional()
  @IsIn(['TRONG', 'DANG_SU_DUNG', 'BAO_TRI', 'NGUNG_SU_DUNG'])
  trangThai?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ghiChu?: string;
}
