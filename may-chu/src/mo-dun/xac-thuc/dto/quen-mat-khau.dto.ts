import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MaxLength } from 'class-validator';

export class QuenMatKhauDto {
  @ApiProperty({ example: 'khach@example.com' })
  @IsEmail()
  @MaxLength(255)
  email: string;
}
