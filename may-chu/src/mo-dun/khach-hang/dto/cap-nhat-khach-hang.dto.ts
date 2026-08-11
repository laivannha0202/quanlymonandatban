import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CapNhatKhachHangDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  hoTen?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  soDienThoai?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ example: '1995-06-20' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  ngaySinh?: string;

  @ApiPropertyOptional({ enum: ['NAM', 'NU', 'KHAC'] })
  @IsOptional()
  @IsIn(['NAM', 'NU', 'KHAC'])
  gioiTinh?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  ghiChu?: string;
}
