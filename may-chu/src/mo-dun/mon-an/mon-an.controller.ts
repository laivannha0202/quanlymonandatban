import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CanQuyen } from '../../dung-chung/decorator/can-quyen.decorator';
import { MaYeuCauHienTai } from '../../dung-chung/decorator/ma-yeu-cau-hien-tai.decorator';
import { NguoiDungHienTai } from '../../dung-chung/decorator/nguoi-dung-hien-tai.decorator';
import { JwtGuard } from '../../dung-chung/guard/jwt.guard';
import { QuyenGuard } from '../../dung-chung/guard/quyen.guard';
import type { NguoiDungXacThuc } from '../../dung-chung/types/nguoi-dung-xac-thuc.type';
import { CapNhatHinhAnhMonDto } from './dto/cap-nhat-hinh-anh-mon.dto';
import { CapNhatMonAnDto } from './dto/cap-nhat-mon-an.dto';
import { DanhSachMonAnDto } from './dto/danh-sach-mon-an.dto';
import { TaoHinhAnhMonDto } from './dto/tao-hinh-anh-mon.dto';
import { TaoMonAnDto } from './dto/tao-mon-an.dto';
import { MonAnService } from './mon-an.service';

@ApiTags('Thực đơn')
@Controller('thuc-don/mon-an')
export class MonAnCongKhaiController {
  constructor(private readonly service: MonAnService) {}
  @Get() danhSach(@Query() dto: DanhSachMonAnDto) { return this.service.danhSachCongKhai(dto); }
  @Get(':duongDan') chiTiet(@Param('duongDan') duongDan: string) { return this.service.chiTietCongKhai(duongDan); }
}

@ApiTags('Quản trị - Món ăn')
@ApiBearerAuth()
@UseGuards(JwtGuard, QuyenGuard)
@Controller('quan-tri/mon-an')
export class MonAnQuanTriController {
  constructor(private readonly service: MonAnService) {}
  @Get() @CanQuyen('MON_AN_XEM') danhSach(@Query() dto: DanhSachMonAnDto) { return this.service.danhSachQuanTri(dto); }
  @Get(':id') @CanQuyen('MON_AN_XEM') chiTiet(@Param('id') id: string) { return this.service.chiTietQuanTri(id); }
  @Post() @CanQuyen('MON_AN_QUAN_LY') tao(@Body() dto: TaoMonAnDto, @NguoiDungHienTai() u: NguoiDungXacThuc, @MaYeuCauHienTai() r?: string | null) { return this.service.tao(dto, u, r); }
  @Patch(':id') @CanQuyen('MON_AN_QUAN_LY') capNhat(@Param('id') id: string, @Body() dto: CapNhatMonAnDto, @NguoiDungHienTai() u: NguoiDungXacThuc, @MaYeuCauHienTai() r?: string | null) { return this.service.capNhat(id, dto, u, r); }
  @Delete(':id') @CanQuyen('MON_AN_QUAN_LY') xoa(@Param('id') id: string, @NguoiDungHienTai() u: NguoiDungXacThuc, @MaYeuCauHienTai() r?: string | null) { return this.service.xoa(id, u, r); }

  @Post(':id/hinh-anh')
  @CanQuyen('MON_AN_QUAN_LY')
  @ApiOperation({ summary: 'Thêm URL/path hình ảnh cho món ăn' })
  themHinh(@Param('id') id: string, @Body() dto: TaoHinhAnhMonDto, @NguoiDungHienTai() u: NguoiDungXacThuc, @MaYeuCauHienTai() r?: string | null) { return this.service.themHinhAnh(id, dto, u, r); }

  @Patch(':id/hinh-anh/:hinhId')
  @CanQuyen('MON_AN_QUAN_LY')
  capNhatHinh(@Param('id') id: string, @Param('hinhId') hinhId: string, @Body() dto: CapNhatHinhAnhMonDto, @NguoiDungHienTai() u: NguoiDungXacThuc, @MaYeuCauHienTai() r?: string | null) { return this.service.capNhatHinhAnh(id, hinhId, dto, u, r); }

  @Delete(':id/hinh-anh/:hinhId')
  @CanQuyen('MON_AN_QUAN_LY')
  xoaHinh(@Param('id') id: string, @Param('hinhId') hinhId: string, @NguoiDungHienTai() u: NguoiDungXacThuc, @MaYeuCauHienTai() r?: string | null) { return this.service.xoaHinhAnh(id, hinhId, u, r); }
}
