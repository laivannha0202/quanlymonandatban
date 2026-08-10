import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DangNhapDto {
  @ApiProperty({ example: 'admin@example.com' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  taiKhoan: string;

  @ApiProperty({ example: 'MatKhauManh123!' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  matKhau: string;
}
