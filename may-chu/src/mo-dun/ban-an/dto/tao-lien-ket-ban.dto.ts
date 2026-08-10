import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumberString, IsOptional, IsString, MaxLength } from 'class-validator';

export class TaoLienKetBanDto {
  @ApiProperty({ example: '1' })
  @IsNumberString()
  ban1Id: string;

  @ApiProperty({ example: '2' })
  @IsNumberString()
  ban2Id: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  coTheGhep?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  ghiChu?: string;
}
