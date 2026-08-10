import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CapNhatLienKetBanDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  coTheGhep?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  ghiChu?: string;
}
