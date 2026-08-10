import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class DatLaiMatKhauDto {
  @ApiProperty({ description: 'Token đặt lại mật khẩu nhận từ kênh khôi phục' })
  @IsString()
  @MinLength(32)
  @MaxLength(200)
  token: string;

  @ApiProperty({ example: 'MatKhauMoi456!' })
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  matKhauMoi: string;
}
