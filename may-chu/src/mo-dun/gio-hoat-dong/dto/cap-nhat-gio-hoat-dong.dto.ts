import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class GioHoatDongItemDto {
  @ApiProperty({ example: 1, description: '1=Thứ Hai ... 7=Chủ Nhật' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  thuTrongTuan: number;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  caSo: number;

  @ApiProperty({ example: '10:00' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  gioMoCua: string;

  @ApiProperty({ example: '22:00' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  gioDongCua: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  hoatDong?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  ghiChu?: string;
}

export class CapNhatGioHoatDongDto {
  @ApiProperty({ type: [GioHoatDongItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => GioHoatDongItemDto)
  danhSach: GioHoatDongItemDto[];
}
