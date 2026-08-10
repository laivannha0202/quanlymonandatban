import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CanQuyen } from '../../dung-chung/decorator/can-quyen.decorator';
import { MaYeuCauHienTai } from '../../dung-chung/decorator/ma-yeu-cau-hien-tai.decorator';
import { NguoiDungHienTai } from '../../dung-chung/decorator/nguoi-dung-hien-tai.decorator';
import { JwtGuard } from '../../dung-chung/guard/jwt.guard';
import { QuyenGuard } from '../../dung-chung/guard/quyen.guard';
import type { NguoiDungXacThuc } from '../../dung-chung/types/nguoi-dung-xac-thuc.type';
import { CapNhatNhanVienDto } from './dto/cap-nhat-nhan-vien.dto';
import { CapNhatTrangThaiNhanVienDto } from './dto/cap-nhat-trang-thai-nhan-vien.dto';
import { DanhSachNhanVienDto } from './dto/danh-sach-nhan-vien.dto';
import { TaoNhanVienDto } from './dto/tao-nhan-vien.dto';
import { NhanVienService } from './nhan-vien.service';

@ApiTags('Quản trị - Nhân viên')
@ApiBearerAuth()
@UseGuards(JwtGuard, QuyenGuard)
@Controller('quan-tri/nhan-vien')
export class NhanVienController {
  constructor(private readonly service: NhanVienService) {}

  @Get()
  @CanQuyen('NHAN_VIEN_XEM')
  danhSach(@Query() dto: DanhSachNhanVienDto) { return this.service.danhSach(dto); }

  @Get(':id')
  @CanQuyen('NHAN_VIEN_XEM')
  chiTiet(@Param('id') id: string) { return this.service.chiTiet(id); }

  @Post()
  @CanQuyen('NHAN_VIEN_QUAN_LY')
  @ApiOperation({ summary: 'Tạo nhân viên và tài khoản đăng nhập' })
  tao(@Body() dto: TaoNhanVienDto, @NguoiDungHienTai() nguoiDung: NguoiDungXacThuc, @MaYeuCauHienTai() maYeuCau?: string | null) {
    return this.service.tao(dto, nguoiDung, maYeuCau);
  }

  @Patch(':id')
  @CanQuyen('NHAN_VIEN_QUAN_LY')
  capNhat(@Param('id') id: string, @Body() dto: CapNhatNhanVienDto, @NguoiDungHienTai() nguoiDung: NguoiDungXacThuc, @MaYeuCauHienTai() maYeuCau?: string | null) {
    return this.service.capNhat(id, dto, nguoiDung, maYeuCau);
  }

  @Patch(':id/trang-thai')
  @CanQuyen('NHAN_VIEN_QUAN_LY')
  capNhatTrangThai(@Param('id') id: string, @Body() dto: CapNhatTrangThaiNhanVienDto, @NguoiDungHienTai() nguoiDung: NguoiDungXacThuc, @MaYeuCauHienTai() maYeuCau?: string | null) {
    return this.service.capNhatTrangThai(id, dto, nguoiDung, maYeuCau);
  }
}
