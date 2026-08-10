import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CanQuyen } from '../../dung-chung/decorator/can-quyen.decorator';
import { JwtGuard } from '../../dung-chung/guard/jwt.guard';
import { QuyenGuard } from '../../dung-chung/guard/quyen.guard';
import { VaiTroService } from './vai-tro.service';

@ApiTags('Quản trị - Quyền')
@ApiBearerAuth()
@Controller('quan-tri/quyen')
@UseGuards(JwtGuard, QuyenGuard)
export class QuyenController {
  constructor(private readonly service: VaiTroService) {}

  @Get()
  @CanQuyen('VAI_TRO_QUAN_LY')
  @ApiOperation({ summary: 'Lấy danh mục toàn bộ quyền' })
  danhSach() {
    return this.service.danhSachQuyen();
  }
}
