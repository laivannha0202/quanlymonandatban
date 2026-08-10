import { PartialType } from '@nestjs/swagger';
import { TaoDanhMucMonDto } from './tao-danh-muc-mon.dto';
export class CapNhatDanhMucMonDto extends PartialType(TaoDanhMucMonDto) {}
