import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CanQuyen } from '../../dung-chung/decorator/can-quyen.decorator';
import { JwtGuard } from '../../dung-chung/guard/jwt.guard';
import { QuyenGuard } from '../../dung-chung/guard/quyen.guard';
import { DanhSachNhatKyDto } from './dto/danh-sach-nhat-ky.dto';
import { NhatKyService } from './nhat-ky.service';

@ApiTags('Quản trị - Nhật ký hoạt động')
@ApiBearerAuth()
@UseGuards(JwtGuard, QuyenGuard)
@Controller('quan-tri/nhat-ky')
export class NhatKyController {
  constructor(private readonly service: NhatKyService) {}
  @Get() @CanQuyen('NHAT_KY_XEM') danhSach(@Query() dto: DanhSachNhatKyDto) { return this.service.danhSach(dto); }
}
