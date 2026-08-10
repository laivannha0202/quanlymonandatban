import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class TaoHinhAnhMonDto {
  @ApiProperty()
  @IsString()
  @MaxLength(500)
  duongDanAnh!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  altText?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  thuTu?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  laAnhChinh?: boolean;
}
