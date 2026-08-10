import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, Matches } from 'class-validator';

export class SapBanDto {
  @ApiProperty({ type: [String], example: ['3'] })
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(2) @Matches(/^\d+$/, { each: true })
  banAnIds!: string[];
}
