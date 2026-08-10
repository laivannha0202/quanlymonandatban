import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CanQuyen } from '../../dung-chung/decorator/can-quyen.decorator';
import { MaYeuCauHienTai } from '../../dung-chung/decorator/ma-yeu-cau-hien-tai.decorator';
import { NguoiDungHienTai } from '../../dung-chung/decorator/nguoi-dung-hien-tai.decorator';
import { JwtGuard } from '../../dung-chung/guard/jwt.guard';
import { QuyenGuard } from '../../dung-chung/guard/quyen.guard';
import type { NguoiDungXacThuc } from '../../dung-chung/types/nguoi-dung-xac-thuc.type';
import { CapNhatKhachHangDto } from './dto/cap-nhat-khach-hang.dto';
import { CapNhatTrangThaiKhachHangDto } from './dto/cap-nhat-trang-thai-khach-hang.dto';
import { DanhSachKhachHangDto } from './dto/danh-sach-khach-hang.dto';
import { KhachHangService } from './khach-hang.service';

@ApiTags('Quản trị - Khách hàng')
@ApiBearerAuth()
@UseGuards(JwtGuard, QuyenGuard)
@Controller('quan-tri/khach-hang')
export class KhachHangController {
  constructor(private readonly service: KhachHangService) {}

  @Get()
  @CanQuyen('KHACH_HANG_XEM')
  danhSach(@Query() dto: DanhSachKhachHangDto) {
    return this.service.danhSach(dto);
  }

  @Get(':id')
  @CanQuyen('KHACH_HANG_XEM')
  chiTiet(@Param('id') id: string) {
    return this.service.chiTiet(id);
  }

  @Patch(':id')
  @CanQuyen('KHACH_HANG_SUA')
  @ApiOperation({ summary: 'Cập nhật hồ sơ khách hàng' })
  capNhat(
    @Param('id') id: string,
    @Body() dto: CapNhatKhachHangDto,
    @NguoiDungHienTai() nguoiDung: NguoiDungXacThuc,
    @MaYeuCauHienTai() maYeuCau?: string | null,
  ) {
    return this.service.capNhat(id, dto, nguoiDung, maYeuCau);
  }

  @Patch(':id/trang-thai')
  @CanQuyen('KHACH_HANG_KHOA')
  @ApiOperation({ summary: 'Khóa, mở khóa hoặc ngừng hoạt động khách hàng' })
  capNhatTrangThai(
    @Param('id') id: string,
    @Body() dto: CapNhatTrangThaiKhachHangDto,
    @NguoiDungHienTai() nguoiDung: NguoiDungXacThuc,
    @MaYeuCauHienTai() maYeuCau?: string | null,
  ) {
    return this.service.capNhatTrangThai(id, dto, nguoiDung, maYeuCau);
  }
}
