import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CanQuyen } from '../../dung-chung/decorator/can-quyen.decorator';
import { MaYeuCauHienTai } from '../../dung-chung/decorator/ma-yeu-cau-hien-tai.decorator';
import { NguoiDungHienTai } from '../../dung-chung/decorator/nguoi-dung-hien-tai.decorator';
import { JwtGuard } from '../../dung-chung/guard/jwt.guard';
import { QuyenGuard } from '../../dung-chung/guard/quyen.guard';
import type { NguoiDungXacThuc } from '../../dung-chung/types/nguoi-dung-xac-thuc.type';
import { CapNhatKhuyenMaiDto } from './dto/cap-nhat-khuyen-mai.dto';
import { DanhSachKhuyenMaiDto } from './dto/danh-sach-khuyen-mai.dto';
import { TaoKhuyenMaiDto } from './dto/tao-khuyen-mai.dto';
import { KhuyenMaiService } from './khuyen-mai.service';

@ApiTags('Khuyến mãi')
@Controller('khuyen-mai')
export class KhuyenMaiCongKhaiController {
  constructor(private readonly service: KhuyenMaiService) {}
  @Get('dang-ap-dung') danhSach() { return this.service.dangApDung(); }
}

@ApiTags('Quản trị - Khuyến mãi')
@ApiBearerAuth()
@UseGuards(JwtGuard, QuyenGuard)
@Controller('quan-tri/khuyen-mai')
export class KhuyenMaiQuanTriController {
  constructor(private readonly service: KhuyenMaiService) {}
  @Get() @CanQuyen('KHUYEN_MAI_XEM') danhSach(@Query() dto: DanhSachKhuyenMaiDto) { return this.service.danhSach(dto); }
  @Get(':id') @CanQuyen('KHUYEN_MAI_XEM') chiTiet(@Param('id') id: string) { return this.service.chiTiet(id); }
  @Post() @CanQuyen('KHUYEN_MAI_QUAN_LY') tao(@Body() dto: TaoKhuyenMaiDto, @NguoiDungHienTai() u: NguoiDungXacThuc, @MaYeuCauHienTai() r?: string | null) { return this.service.tao(dto, u, r); }
  @Patch(':id') @CanQuyen('KHUYEN_MAI_QUAN_LY') capNhat(@Param('id') id: string, @Body() dto: CapNhatKhuyenMaiDto, @NguoiDungHienTai() u: NguoiDungXacThuc, @MaYeuCauHienTai() r?: string | null) { return this.service.capNhat(id, dto, u, r); }
  @Delete(':id') @CanQuyen('KHUYEN_MAI_QUAN_LY') xoa(@Param('id') id: string, @NguoiDungHienTai() u: NguoiDungXacThuc, @MaYeuCauHienTai() r?: string | null) { return this.service.xoa(id, u, r); }
}
