import { PartialType } from '@nestjs/swagger';
import { TaoMonAnDto } from './tao-mon-an.dto';
export class CapNhatMonAnDto extends PartialType(TaoMonAnDto) {}
