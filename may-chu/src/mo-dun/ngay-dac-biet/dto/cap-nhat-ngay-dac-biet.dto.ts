import { PartialType } from '@nestjs/swagger';
import { TaoNgayDacBietDto } from './tao-ngay-dac-biet.dto';

export class CapNhatNgayDacBietDto extends PartialType(TaoNgayDacBietDto) {}
