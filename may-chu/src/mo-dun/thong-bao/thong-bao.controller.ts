import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NguoiDungHienTai } from '../../dung-chung/decorator/nguoi-dung-hien-tai.decorator';
import { JwtGuard } from '../../dung-chung/guard/jwt.guard';
import type { NguoiDungXacThuc } from '../../dung-chung/types/nguoi-dung-xac-thuc.type';
import { DanhSachThongBaoDto } from './dto/danh-sach-thong-bao.dto';
import { ThongBaoService } from './thong-bao.service';

@ApiTags('Thông báo')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('thong-bao')
export class ThongBaoController {
  constructor(private readonly service: ThongBaoService) {}

  @Get()
  danhSach(@NguoiDungHienTai() u: NguoiDungXacThuc, @Query() dto: DanhSachThongBaoDto) {
    return this.service.danhSach(u.taiKhoanId, dto);
  }

  @Get('chua-doc')
  chuaDoc(@NguoiDungHienTai() u: NguoiDungXacThuc) {
    return this.service.soChuaDoc(u.taiKhoanId);
  }

  @Patch('doc-tat-ca')
  docTatCa(@NguoiDungHienTai() u: NguoiDungXacThuc) {
    return this.service.docTatCa(u.taiKhoanId);
  }

  @Patch(':id/da-doc')
  daDoc(@Param('id') id: string, @NguoiDungHienTai() u: NguoiDungXacThuc) {
    return this.service.danhDauDaDoc(u.taiKhoanId, id);
  }
}
