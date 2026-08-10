import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayUnique, IsArray, IsString, MaxLength } from 'class-validator';

export class CapNhatQuyenVaiTroDto {
  @ApiProperty({
    type: [String],
    example: ['DAT_BAN_XEM', 'DAT_BAN_XAC_NHAN', 'BAN_AN_XEM'],
    description: 'Danh sách mã quyền mới của vai trò',
  })
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  maQuyens: string[];
}
