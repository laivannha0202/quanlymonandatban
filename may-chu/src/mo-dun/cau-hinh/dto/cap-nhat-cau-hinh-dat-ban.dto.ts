import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, Max, Min } from 'class-validator';

export class CapNhatCauHinhDatBanDto {
  @ApiProperty()
  @IsBoolean()
  choPhepDatMonTruoc!: boolean;

  @ApiProperty()
  @IsBoolean()
  yeuCauThanhToanMonTruoc!: boolean;

  @ApiProperty({ minimum: 0, maximum: 100000000 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100000000)
  tienCocGiuBan!: number;

  @ApiProperty({ minimum: 0, maximum: 10080 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10080)
  thoiGianHuyTruocPhut!: number;

  @ApiProperty({ minimum: 0, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  tyLeHoanTienHuyDungHan!: number;
}
