import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CapNhatKhachHangDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  hoTen?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
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
