import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNumberString, IsOptional, IsString, MaxLength } from 'class-validator';
import { PhanTrangDto } from '../../../dung-chung/dto/phan-trang.dto';

export class DanhSachBanAnDto extends PhanTrangDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  tuKhoa?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  khuVucId?: string;

  @ApiPropertyOptional({ enum: ['TRONG', 'DANG_SU_DUNG', 'BAO_TRI', 'NGUNG_SU_DUNG'] })
  @IsOptional()
  @IsIn(['TRONG', 'DANG_SU_DUNG', 'BAO_TRI', 'NGUNG_SU_DUNG'])
  trangThai?: string;
}
