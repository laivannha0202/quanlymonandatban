import { PartialType } from '@nestjs/swagger';
import { TaoBanAnDto } from './tao-ban-an.dto';

export class CapNhatBanAnDto extends PartialType(TaoBanAnDto) {}
