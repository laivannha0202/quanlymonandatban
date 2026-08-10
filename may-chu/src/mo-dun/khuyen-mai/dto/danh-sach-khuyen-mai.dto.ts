import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PhanTrangDto } from '../../../dung-chung/dto/phan-trang.dto';

export class DanhSachKhuyenMaiDto extends PhanTrangDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  tuKhoa?: string;

  @ApiPropertyOptional({ enum: ['HOAT_DONG', 'NGUNG_HOAT_DONG'] })
  @IsOptional()
  @IsIn(['HOAT_DONG', 'NGUNG_HOAT_DONG'])
  trangThai?: string;
}
