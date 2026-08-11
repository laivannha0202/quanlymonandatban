import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CapNhatNhanVienDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  maVaiTro?: string;

  @ApiPropertyOptional({ example: '2026-08-10' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  ngayVaoLam?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  ghiChu?: string;

  @ApiPropertyOptional({ minLength: 8, description: 'Đặt lại mật khẩu nếu có giá trị' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  matKhauMoi?: string;
}
