import {
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';
import { CanQuyen } from '../../dung-chung/decorator/can-quyen.decorator';
import { JwtGuard } from '../../dung-chung/guard/jwt.guard';
import { QuyenGuard } from '../../dung-chung/guard/quyen.guard';
import { CauHinhService } from './cau-hinh.service';
import { CapNhatCauHinhDatBanDto } from './dto/cap-nhat-cau-hinh-dat-ban.dto';

@ApiTags('Quản trị - Cấu hình đặt bàn')
@ApiBearerAuth()
@UseGuards(JwtGuard, QuyenGuard)
@Controller('quan-tri/cau-hinh-dat-ban')
export class CauHinhDatBanQuanTriController {
  constructor(private readonly service: CauHinhService) {}

  @Get()
  @CanQuyen('CAU_HINH_DAT_BAN_QUAN_LY')
  chiTiet() {
    return this.service.cauHinhDatBan();
  }

  @Patch()
  @CanQuyen('CAU_HINH_DAT_BAN_QUAN_LY')
  capNhat(@Body() dto: CapNhatCauHinhDatBanDto) {
    return this.service.capNhatCauHinhDatBan(dto);
  }
}
