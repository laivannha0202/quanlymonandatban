import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class TaoKhuyenMaiDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  maKhuyenMai!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  tenKhuyenMai!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  moTa?: string;

  @ApiProperty({ enum: ['PHAN_TRAM', 'SO_TIEN'] })
  @IsIn(['PHAN_TRAM', 'SO_TIEN'])
  loaiGiam!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  giaTri!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  giaTriDonToiThieu?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  giamToiDa?: number;


  @ApiPropertyOptional({
    nullable: true,
    minimum: 1,
    description: 'Tổng lượt sử dụng. Bỏ trống/null = không giới hạn.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  soLuotToiDa?: number | null;

  @ApiPropertyOptional({
    nullable: true,
    minimum: 1,
    description: 'Số lượt tối đa cho mỗi khách. Bỏ trống/null = không giới hạn.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  soLuotMoiKhach?: number | null;

  @ApiProperty({ example: '2026-08-10T00:00:00+07:00' })
  @IsDateString()
  ngayBatDau!: string;

  @ApiProperty({ example: '2026-08-31T23:59:59+07:00' })
  @IsDateString()
  ngayKetThuc!: string;

  @ApiPropertyOptional({ enum: ['HOAT_DONG', 'NGUNG_HOAT_DONG'] })
  @IsOptional()
  @IsIn(['HOAT_DONG', 'NGUNG_HOAT_DONG'])
  trangThai?: string;
}
