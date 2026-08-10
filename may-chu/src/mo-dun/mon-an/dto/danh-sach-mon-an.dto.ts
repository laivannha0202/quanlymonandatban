import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PhanTrangDto } from '../../../dung-chung/dto/phan-trang.dto';

export class DanhSachMonAnDto extends PhanTrangDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  tuKhoa?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  danhMucId?: string;

  @ApiPropertyOptional({ enum: ['HOAT_DONG', 'NGUNG_HOAT_DONG'] })
  @IsOptional()
  @IsIn(['HOAT_DONG', 'NGUNG_HOAT_DONG'])
  trangThai?: string;

  @ApiPropertyOptional({ enum: ['true', 'false'] })
  @IsOptional()
  @IsIn(['true', 'false'])
  conMon?: string;

  @ApiPropertyOptional({ enum: ['true', 'false'] })
  @IsOptional()
  @IsIn(['true', 'false'])
  noiBat?: string;
}
