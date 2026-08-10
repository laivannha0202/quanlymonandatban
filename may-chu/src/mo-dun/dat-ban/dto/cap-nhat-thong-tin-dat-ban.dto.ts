import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CapNhatThongTinDatBanDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(150)
  hoTen?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(30)
  soDienThoai?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() @MaxLength(255)
  email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000)
  ghiChuKhach?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000)
  ghiChuNoiBo?: string;
}
