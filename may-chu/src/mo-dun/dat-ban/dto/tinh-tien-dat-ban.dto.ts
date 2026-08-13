import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class MonDatTruocDto {
  @ApiProperty({ example: '3' })
  @Matches(/^\d+$/)
  monAnId!: string;

  @ApiProperty({ example: 2, minimum: 1, maximum: 99 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(99)
  soLuong!: number;

  @ApiPropertyOptional({ example: 'Ít cay', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  ghiChu?: string;
}

export class TinhTienDatBanDto {
  @ApiPropertyOptional({ type: [MonDatTruocDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => MonDatTruocDto)
  monAn?: MonDatTruocDto[];

  @ApiPropertyOptional({ example: 'HV_HE2026', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  maKhuyenMai?: string;

  @ApiPropertyOptional({
    description: 'Số điện thoại để kiểm tra giới hạn lượt khuyến mãi theo khách khi báo giá.',
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  soDienThoai?: string;
}
