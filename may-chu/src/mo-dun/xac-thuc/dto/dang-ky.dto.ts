import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class DangKyDto {
  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  hoTen: string;

  @ApiProperty({ example: '0909123456' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  soDienThoai: string;

  @ApiProperty({ example: 'a@example.com' })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: 'MatKhauManh123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  matKhau: string;
}
