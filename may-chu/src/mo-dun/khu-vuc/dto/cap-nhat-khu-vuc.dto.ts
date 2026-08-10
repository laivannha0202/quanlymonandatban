import { PartialType } from '@nestjs/swagger';
import { TaoKhuVucDto } from './tao-khu-vuc.dto';

export class CapNhatKhuVucDto extends PartialType(TaoKhuVucDto) {}
