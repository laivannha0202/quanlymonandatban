import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';
export class PhanHoiDanhGiaDto {
  @ApiProperty()
  @IsString()
  @MaxLength(5000)
  phanHoi!: string;
}
