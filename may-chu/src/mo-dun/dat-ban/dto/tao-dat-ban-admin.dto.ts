import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { TaoDatBanDto } from './tao-dat-ban.dto';

export class TaoDatBanAdminDto extends TaoDatBanDto {
  @ApiPropertyOptional({ enum: ['DIEN_THOAI', 'FACEBOOK', 'TRUC_TIEP', 'KHAC'], default: 'TRUC_TIEP' })
  @IsOptional() @IsIn(['DIEN_THOAI', 'FACEBOOK', 'TRUC_TIEP', 'KHAC'])
  nguonDat?: 'DIEN_THOAI' | 'FACEBOOK' | 'TRUC_TIEP' | 'KHAC';

  @ApiPropertyOptional({ default: true })
  @IsOptional() @IsBoolean()
  xacNhanNgay?: boolean;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(2000)
  ghiChuNoiBo?: string;
}
