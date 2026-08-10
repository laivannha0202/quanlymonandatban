import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';
export class CapNhatHienThiDanhGiaDto {
  @ApiProperty()
  @IsBoolean()
  hienThi!: boolean;
}
