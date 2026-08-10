import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class CapNhatTrangThaiNhanVienDto {
  @ApiProperty({ enum: ['HOAT_DONG', 'TAM_NGHI', 'DA_NGHI'] })
  @IsIn(['HOAT_DONG', 'TAM_NGHI', 'DA_NGHI'])
  trangThai!: string;
}
