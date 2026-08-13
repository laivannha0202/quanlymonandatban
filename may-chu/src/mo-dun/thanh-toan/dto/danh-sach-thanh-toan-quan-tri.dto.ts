import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PhanTrangDto } from '../../../dung-chung/dto/phan-trang.dto';

export class DanhSachThanhToanQuanTriDto extends PhanTrangDto {
  @ApiPropertyOptional({
    description: 'Tìm theo mã thanh toán, mã giao dịch hoặc mã đặt bàn',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  tuKhoa?: string;

  @ApiPropertyOptional({
    enum: [
      'CHO_THANH_TOAN',
      'DA_THANH_TOAN',
      'THAT_BAI',
      'DA_HUY',
      'DA_HOAN_TIEN',
      'HOAN_MOT_PHAN',
    ],
  })
  @IsOptional()
  @IsIn([
    'CHO_THANH_TOAN',
    'DA_THANH_TOAN',
    'THAT_BAI',
    'DA_HUY',
    'DA_HOAN_TIEN',
    'HOAN_MOT_PHAN',
  ])
  trangThai?: string;

  @ApiPropertyOptional({
    enum: ['MO_PHONG', 'VNPAY', 'MOMO', 'CHUYEN_KHOAN', 'TIEN_MAT'],
  })
  @IsOptional()
  @IsIn(['MO_PHONG', 'VNPAY', 'MOMO', 'CHUYEN_KHOAN', 'TIEN_MAT'])
  phuongThuc?: string;
}
