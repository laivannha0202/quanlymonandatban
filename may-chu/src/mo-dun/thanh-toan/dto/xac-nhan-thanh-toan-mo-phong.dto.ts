import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength } from 'class-validator';

export class XacNhanThanhToanMoPhongDto {
  @ApiProperty({ example: 'DB20260820-000123' })
  @IsString()
  @MaxLength(40)
  maDatBan!: string;

  @ApiProperty({ example: '0909123456' })
  @IsString()
  @MaxLength(30)
  soDienThoai!: string;

  @ApiProperty({ example: 'TT20260820-000123' })
  @IsString()
  @MaxLength(50)
  maThanhToan!: string;

  @ApiProperty({
    example: 'checkout-7f12598f-1d64-4f11-a010-a13d00cb0935',
    description: 'Khóa do client tạo cho một thao tác thanh toán; gửi lại cùng khóa sẽ không thu tiền lần hai.',
  })
  @IsString()
  @MaxLength(120)
  @Matches(/^[A-Za-z0-9._:-]{8,120}$/)
  khoaIdempotency!: string;
}
