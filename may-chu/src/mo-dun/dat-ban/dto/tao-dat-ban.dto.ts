import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { MonDatTruocDto } from './tinh-tien-dat-ban.dto';
import { ArrayMaxSize, IsArray, IsEmail, IsInt, IsOptional, IsString, Matches, MaxLength, Min, ValidateNested } from 'class-validator';

export class TaoDatBanDto {
  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsString() @MaxLength(150)
  hoTen!: string;

  @ApiProperty({ example: '0909123456' })
  @IsString() @MaxLength(30)
  soDienThoai!: string;

  @ApiPropertyOptional({ example: 'a@example.com' })
  @IsOptional() @IsEmail() @MaxLength(255)
  email?: string;

  @ApiProperty({ example: '2026-08-20' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  ngay!: string;

  @ApiProperty({ example: '19:00' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  gioBatDau!: string;

  @ApiProperty({ example: 4 })
  @Type(() => Number) @IsInt() @Min(1)
  soNguoi!: number;

  @ApiPropertyOptional({ example: '1' })
  @IsOptional() @Matches(/^\d+$/)
  khuVucId?: string;

  @ApiPropertyOptional({ type: [String], example: ['3'] })
  @IsOptional() @IsArray() @ArrayMaxSize(2) @Matches(/^\d+$/, { each: true })
  banAnIds?: string[];

  @ApiPropertyOptional({ type: [MonDatTruocDto] })
  @IsOptional() @IsArray() @ArrayMaxSize(50) @ValidateNested({ each: true })
  @Type(() => MonDatTruocDto)
  monAn?: MonDatTruocDto[];

  @ApiPropertyOptional({ example: 'HV_HE2026', maxLength: 50 })
  @IsOptional() @IsString() @MaxLength(50)
  maKhuyenMai?: string;

  @ApiPropertyOptional({ example: 'Cho bàn gần cửa sổ' })
  @IsOptional() @IsString() @MaxLength(2000)
  ghiChu?: string;
}
