import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class TraCuuDatBanDto {
  @ApiProperty({ example: 'DB20260820-000123' })
  @IsString() @MaxLength(40)
  maDatBan!: string;

  @ApiProperty({ example: '0909123456' })
  @IsString() @MaxLength(30)
  soDienThoai!: string;
}
