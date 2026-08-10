import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PhanTrangDto } from '../../../dung-chung/dto/phan-trang.dto';

export class DanhSachKhachHangDto extends PhanTrangDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  tuKhoa?: string;

  @ApiPropertyOptional({ enum: ['HOAT_DONG', 'BI_KHOA', 'NGUNG_HOAT_DONG'] })
  @IsOptional()
  @IsIn(['HOAT_DONG', 'BI_KHOA', 'NGUNG_HOAT_DONG'])
  trangThai?: string;
}
