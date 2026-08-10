import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CanQuyen } from '../../dung-chung/decorator/can-quyen.decorator';
import { MaYeuCauHienTai } from '../../dung-chung/decorator/ma-yeu-cau-hien-tai.decorator';
import { NguoiDungHienTai } from '../../dung-chung/decorator/nguoi-dung-hien-tai.decorator';
import { JwtGuard } from '../../dung-chung/guard/jwt.guard';
import { QuyenGuard } from '../../dung-chung/guard/quyen.guard';
import type { NguoiDungXacThuc } from '../../dung-chung/types/nguoi-dung-xac-thuc.type';
import { CapNhatDanhGiaDto } from './dto/cap-nhat-danh-gia.dto';
import { CapNhatHienThiDanhGiaDto } from './dto/cap-nhat-hien-thi-danh-gia.dto';
import { DanhSachDanhGiaDto } from './dto/danh-sach-danh-gia.dto';
import { PhanHoiDanhGiaDto } from './dto/phan-hoi-danh-gia.dto';
import { TaoDanhGiaDto } from './dto/tao-danh-gia.dto';
import { DanhGiaService } from './danh-gia.service';

@ApiTags('Đánh giá')
@Controller('danh-gia')
export class DanhGiaCongKhaiController {
  constructor(private readonly service: DanhGiaService) {}
  @Get() danhSach(@Query() dto: DanhSachDanhGiaDto) { return this.service.danhSachCongKhai(dto); }
}

@ApiTags('Khách hàng - Đánh giá')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('khach-hang/danh-gia')
export class DanhGiaKhachHangController {
  constructor(private readonly service: DanhGiaService) {}
  @Post() tao(@Body() dto: TaoDanhGiaDto, @NguoiDungHienTai() u: NguoiDungXacThuc) { return this.service.taoCuaKhach(dto, u); }
  @Patch(':id') capNhat(@Param('id') id: string, @Body() dto: CapNhatDanhGiaDto, @NguoiDungHienTai() u: NguoiDungXacThuc) { return this.service.capNhatCuaKhach(id, dto, u); }
  @Delete(':id') xoa(@Param('id') id: string, @NguoiDungHienTai() u: NguoiDungXacThuc) { return this.service.xoaCuaKhach(id, u); }
}

@ApiTags('Quản trị - Đánh giá')
@ApiBearerAuth()
@UseGuards(JwtGuard, QuyenGuard)
@Controller('quan-tri/danh-gia')
export class DanhGiaQuanTriController {
  constructor(private readonly service: DanhGiaService) {}
  @Get() @CanQuyen('DANH_GIA_XEM') danhSach(@Query() dto: DanhSachDanhGiaDto) { return this.service.danhSachQuanTri(dto); }
  @Get(':id') @CanQuyen('DANH_GIA_XEM') chiTiet(@Param('id') id: string) { return this.service.chiTiet(id); }
  @Patch(':id/phan-hoi') @CanQuyen('DANH_GIA_QUAN_LY') phanHoi(@Param('id') id: string, @Body() dto: PhanHoiDanhGiaDto, @NguoiDungHienTai() u: NguoiDungXacThuc, @MaYeuCauHienTai() r?: string | null) { return this.service.phanHoi(id, dto, u, r); }
  @Patch(':id/hien-thi') @CanQuyen('DANH_GIA_QUAN_LY') hienThi(@Param('id') id: string, @Body() dto: CapNhatHienThiDanhGiaDto, @NguoiDungHienTai() u: NguoiDungXacThuc, @MaYeuCauHienTai() r?: string | null) { return this.service.capNhatHienThi(id, dto, u, r); }
}
