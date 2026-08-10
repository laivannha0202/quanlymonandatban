import { PartialType } from '@nestjs/swagger';
import { TaoKhuyenMaiDto } from './tao-khuyen-mai.dto';
export class CapNhatKhuyenMaiDto extends PartialType(TaoKhuyenMaiDto) {}
