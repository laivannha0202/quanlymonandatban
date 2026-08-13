import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class XacNhanThanhToanThuCongDto {
  @ApiProperty({ enum: ['CHUYEN_KHOAN', 'TIEN_MAT'] })
  @IsIn(['CHUYEN_KHOAN', 'TIEN_MAT'])
  phuongThuc!: 'CHUYEN_KHOAN' | 'TIEN_MAT';

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  maGiaoDichCong?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  ghiChu?: string;
}
