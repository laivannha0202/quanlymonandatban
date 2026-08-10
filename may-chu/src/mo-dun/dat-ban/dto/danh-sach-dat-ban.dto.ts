import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { PhanTrangDto } from '../../../dung-chung/dto/phan-trang.dto';

export class DanhSachDatBanDto extends PhanTrangDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100)
  tuKhoa?: string;

  @ApiPropertyOptional({ enum: ['CHO_XAC_NHAN','DA_XAC_NHAN','DA_CHECK_IN','DA_HOAN_THANH','DA_HUY','KHONG_DEN'] })
  @IsOptional() @IsIn(['CHO_XAC_NHAN','DA_XAC_NHAN','DA_CHECK_IN','DA_HOAN_THANH','DA_HUY','KHONG_DEN'])
  trangThai?: string;

  @ApiPropertyOptional({ example: '2026-08-20' })
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/)
  ngay?: string;

  @ApiPropertyOptional() @IsOptional() @Matches(/^\d+$/)
  khuVucId?: string;

  @ApiPropertyOptional({ enum: ['WEBSITE','DIEN_THOAI','FACEBOOK','TRUC_TIEP','KHAC'] })
  @IsOptional() @IsIn(['WEBSITE','DIEN_THOAI','FACEBOOK','TRUC_TIEP','KHAC'])
  nguonDat?: string;
}
