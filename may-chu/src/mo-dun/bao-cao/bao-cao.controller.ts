import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CanQuyen } from '../../dung-chung/decorator/can-quyen.decorator';
import { JwtGuard } from '../../dung-chung/guard/jwt.guard';
import { QuyenGuard } from '../../dung-chung/guard/quyen.guard';
import { BaoCaoService } from './bao-cao.service';
import { KhoangNgayBaoCaoDto } from './dto/khoang-ngay-bao-cao.dto';

@ApiTags('Quản trị - Báo cáo')
@ApiBearerAuth()
@UseGuards(JwtGuard, QuyenGuard)
@Controller('quan-tri/bao-cao')
export class BaoCaoController {
  constructor(private readonly service: BaoCaoService) {}
  @Get('dat-ban') @CanQuyen('BAO_CAO_XEM') datBan(@Query() dto: KhoangNgayBaoCaoDto) { return this.service.datBan(dto); }
  @Get('khach-hang') @CanQuyen('BAO_CAO_XEM') khachHang(@Query() dto: KhoangNgayBaoCaoDto) { return this.service.khachHang(dto); }
  @Get('danh-gia') @CanQuyen('BAO_CAO_XEM') danhGia(@Query() dto: KhoangNgayBaoCaoDto) { return this.service.danhGia(dto); }
}
