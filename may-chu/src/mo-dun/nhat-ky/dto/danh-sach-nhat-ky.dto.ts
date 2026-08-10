import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PhanTrangDto } from '../../../dung-chung/dto/phan-trang.dto';

export class DanhSachNhatKyDto extends PhanTrangDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  hanhDong?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  doiTuong?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  taiKhoanId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  maYeuCau?: string;
}
