import { OmitType, PartialType } from '@nestjs/swagger';
import { TaoDanhGiaDto } from './tao-danh-gia.dto';
export class CapNhatDanhGiaDto extends PartialType(OmitType(TaoDanhGiaDto, ['datBanId'] as const)) {}
