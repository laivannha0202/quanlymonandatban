import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PhanTrangDto } from '../../../dung-chung/dto/phan-trang.dto';

export class DanhSachNhanVienDto extends PhanTrangDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  tuKhoa?: string;

  @ApiPropertyOptional({ enum: ['HOAT_DONG', 'TAM_NGHI', 'DA_NGHI'] })
  @IsOptional()
  @IsIn(['HOAT_DONG', 'TAM_NGHI', 'DA_NGHI'])
  trangThai?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  maVaiTro?: string;
}
