import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class TaoNhanVienDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  maNhanVien!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  hoTen!: string;

  @ApiProperty()
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  tenDangNhap?: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  matKhau!: string;

  @ApiPropertyOptional({ default: 'NHAN_VIEN' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  maVaiTro?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  soDienThoai?: string;

  @ApiPropertyOptional({ example: '2026-08-10' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  ngayVaoLam?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  ghiChu?: string;

  @ApiPropertyOptional({ enum: ['HOAT_DONG', 'TAM_NGHI', 'DA_NGHI'] })
  @IsOptional()
  @IsIn(['HOAT_DONG', 'TAM_NGHI', 'DA_NGHI'])
  trangThai?: string;
}
