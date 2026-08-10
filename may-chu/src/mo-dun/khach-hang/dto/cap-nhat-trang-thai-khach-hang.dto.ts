import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class CapNhatTrangThaiKhachHangDto {
  @ApiProperty({ enum: ['HOAT_DONG', 'BI_KHOA', 'NGUNG_HOAT_DONG'] })
  @IsIn(['HOAT_DONG', 'BI_KHOA', 'NGUNG_HOAT_DONG'])
  trangThai!: string;
}
