import { PartialType } from '@nestjs/swagger';
import { TaoHinhAnhMonDto } from './tao-hinh-anh-mon.dto';
export class CapNhatHinhAnhMonDto extends PartialType(TaoHinhAnhMonDto) {}
