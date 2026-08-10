import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CanQuyen } from '../../dung-chung/decorator/can-quyen.decorator';
import { MaYeuCauHienTai } from '../../dung-chung/decorator/ma-yeu-cau-hien-tai.decorator';
import { NguoiDungHienTai } from '../../dung-chung/decorator/nguoi-dung-hien-tai.decorator';
import { JwtGuard } from '../../dung-chung/guard/jwt.guard';
import { QuyenGuard } from '../../dung-chung/guard/quyen.guard';
import type { NguoiDungXacThuc } from '../../dung-chung/types/nguoi-dung-xac-thuc.type';
import { CapNhatQuyenVaiTroDto } from './dto/cap-nhat-quyen-vai-tro.dto';
import { VaiTroService } from './vai-tro.service';

@ApiTags('Quản trị - Vai trò')
@ApiBearerAuth()
@Controller('quan-tri/vai-tro')
@UseGuards(JwtGuard, QuyenGuard)
export class VaiTroController {
  constructor(private readonly service: VaiTroService) {}

  @Get()
  @CanQuyen('VAI_TRO_QUAN_LY')
  @ApiOperation({ summary: 'Lấy danh sách vai trò cùng quyền' })
  danhSach() {
    return this.service.danhSach();
  }

  @Get(':id')
  @CanQuyen('VAI_TRO_QUAN_LY')
  @ApiOperation({ summary: 'Lấy chi tiết vai trò cùng quyền' })
  chiTiet(@Param('id') id: string) {
    return this.service.chiTiet(id);
  }

  @Put(':id/quyen')
  @CanQuyen('VAI_TRO_QUAN_LY')
  @ApiOperation({ summary: 'Gán lại toàn bộ quyền cho vai trò' })
  capNhatQuyen(
    @Param('id') id: string,
    @Body() dto: CapNhatQuyenVaiTroDto,
    @NguoiDungHienTai() nguoiDung: NguoiDungXacThuc,
    @MaYeuCauHienTai() maYeuCau?: string | null,
  ) {
    return this.service.capNhatQuyen(id, dto, nguoiDung, maYeuCau);
  }
}
