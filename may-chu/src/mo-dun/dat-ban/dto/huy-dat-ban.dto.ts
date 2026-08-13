import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class HuyDatBanDto {
  @ApiPropertyOptional({ example: 'Có việc đột xuất' })
  @IsOptional() @IsString() @MaxLength(2000)
  lyDo?: string;

  @ApiPropertyOptional({
    enum: ['KHACH_YEU_CAU', 'NHA_HANG_CHU_DONG'],
    default: 'KHACH_YEU_CAU',
    description:
      'Nguồn hủy khi nhân viên thao tác: khách yêu cầu hoặc nhà hàng chủ động.',
  })
  @IsOptional()
  @IsIn(['KHACH_YEU_CAU', 'NHA_HANG_CHU_DONG'])
  nguonHuy?: 'KHACH_YEU_CAU' | 'NHA_HANG_CHU_DONG';
}
