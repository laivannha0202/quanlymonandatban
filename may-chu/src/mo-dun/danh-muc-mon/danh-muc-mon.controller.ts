import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CanQuyen } from '../../dung-chung/decorator/can-quyen.decorator';
import { MaYeuCauHienTai } from '../../dung-chung/decorator/ma-yeu-cau-hien-tai.decorator';
import { NguoiDungHienTai } from '../../dung-chung/decorator/nguoi-dung-hien-tai.decorator';
import { JwtGuard } from '../../dung-chung/guard/jwt.guard';
import { QuyenGuard } from '../../dung-chung/guard/quyen.guard';
import type { NguoiDungXacThuc } from '../../dung-chung/types/nguoi-dung-xac-thuc.type';
import { DanhMucMonService } from './danh-muc-mon.service';
import { CapNhatDanhMucMonDto } from './dto/cap-nhat-danh-muc-mon.dto';
import { TaoDanhMucMonDto } from './dto/tao-danh-muc-mon.dto';

@ApiTags('Quản trị - Danh mục món')
@ApiBearerAuth()
@UseGuards(JwtGuard, QuyenGuard)
@Controller('quan-tri/danh-muc-mon')
export class DanhMucMonQuanTriController {
  constructor(private readonly service: DanhMucMonService) {}
  @Get() @CanQuyen('DANH_MUC_MON_XEM') danhSach() { return this.service.danhSachQuanTri(); }
  @Get(':id') @CanQuyen('DANH_MUC_MON_XEM') chiTiet(@Param('id') id: string) { return this.service.chiTiet(id); }
  @Post() @CanQuyen('DANH_MUC_MON_QUAN_LY') tao(@Body() dto: TaoDanhMucMonDto, @NguoiDungHienTai() u: NguoiDungXacThuc, @MaYeuCauHienTai() r?: string | null) { return this.service.tao(dto, u, r); }
  @Patch(':id') @CanQuyen('DANH_MUC_MON_QUAN_LY') capNhat(@Param('id') id: string, @Body() dto: CapNhatDanhMucMonDto, @NguoiDungHienTai() u: NguoiDungXacThuc, @MaYeuCauHienTai() r?: string | null) { return this.service.capNhat(id, dto, u, r); }
  @Delete(':id') @CanQuyen('DANH_MUC_MON_QUAN_LY') xoa(@Param('id') id: string, @NguoiDungHienTai() u: NguoiDungXacThuc, @MaYeuCauHienTai() r?: string | null) { return this.service.xoa(id, u, r); }
}

@ApiTags('Thực đơn')
@Controller('thuc-don')
export class DanhMucMonCongKhaiController {
  constructor(private readonly service: DanhMucMonService) {}
  @Get('danh-muc') danhSach() { return this.service.danhSachCongKhai(); }
}
