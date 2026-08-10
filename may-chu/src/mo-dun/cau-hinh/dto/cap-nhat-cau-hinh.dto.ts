import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsNotEmpty, IsString, MaxLength, ValidateNested } from 'class-validator';

export class GiaTriCauHinhDto {
  @ApiProperty({ example: 'THOI_LUONG_DAT_BAN_PHUT' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  khoa: string;

  @ApiProperty({ example: '120' })
  @IsString()
  giaTri: string;
}

export class CapNhatCauHinhDto {
  @ApiProperty({ type: [GiaTriCauHinhDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => GiaTriCauHinhDto)
  danhSach: GiaTriCauHinhDto[];
}
