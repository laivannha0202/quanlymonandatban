import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class DoiMatKhauDto {
  @ApiProperty({ example: 'MatKhauCu123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  matKhauHienTai: string;

  @ApiProperty({ example: 'MatKhauMoi456!' })
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  matKhauMoi: string;
}
