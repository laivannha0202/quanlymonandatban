import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CanQuyen } from '../../dung-chung/decorator/can-quyen.decorator';
import { NguoiDungHienTai } from '../../dung-chung/decorator/nguoi-dung-hien-tai.decorator';
import { JwtGuard } from '../../dung-chung/guard/jwt.guard';
import { QuyenGuard } from '../../dung-chung/guard/quyen.guard';
import type { NguoiDungXacThuc } from '../../dung-chung/types/nguoi-dung-xac-thuc.type';
import { DanhSachThanhToanQuanTriDto } from './dto/danh-sach-thanh-toan-quan-tri.dto';
import { TraCuuThanhToanDto } from './dto/tra-cuu-thanh-toan.dto';
import { XacNhanHoanTienDto } from './dto/xac-nhan-hoan-tien.dto';
import { XacNhanThanhToanThuCongDto } from './dto/xac-nhan-thanh-toan-thu-cong.dto';
import { XacNhanThanhToanMoPhongDto } from './dto/xac-nhan-thanh-toan-mo-phong.dto';
import { ThanhToanService } from './thanh-toan.service';

@ApiTags('Khách hàng - Thanh toán')
@Controller('thanh-toan')
export class ThanhToanController {
  constructor(private readonly service: ThanhToanService) {}

  @Post('tra-cuu')
  @ApiOperation({
    summary: 'Tra cứu giao dịch thanh toán của đặt bàn bằng mã đặt bàn và số điện thoại',
  })
  @ApiOkResponse({ description: 'Trả trạng thái giao dịch gần nhất' })
  traCuu(@Body() dto: TraCuuThanhToanDto) {
    return this.service.traCuu(dto);
  }

  @Post('mo-phong/xac-nhan')
  @ApiOperation({
    summary: 'Xác nhận thanh toán mô phỏng cho môi trường demo; có idempotency chống thu hai lần',
  })
  @ApiOkResponse({ description: 'Thanh toán thành công hoặc giao dịch đã được thanh toán trước đó' })
  @ApiConflictResponse({ description: 'Giao dịch/đặt bàn không còn ở trạng thái cho phép thanh toán' })
  xacNhanMoPhong(@Body() dto: XacNhanThanhToanMoPhongDto) {
    return this.service.xacNhanMoPhong(dto);
  }
}

@ApiTags('Quản trị - Thanh toán & hoàn tiền')
@ApiBearerAuth()
@UseGuards(JwtGuard, QuyenGuard)
@Controller('quan-tri/thanh-toan')
export class ThanhToanQuanTriController {
  constructor(private readonly service: ThanhToanService) {}

  @Get()
  @CanQuyen('THANH_TOAN_XEM')
  danhSach(@Query() dto: DanhSachThanhToanQuanTriDto) {
    return this.service.danhSachQuanTri(dto);
  }

  @Get(':id')
  @CanQuyen('THANH_TOAN_XEM')
  chiTiet(@Param('id') id: string) {
    return this.service.chiTietQuanTri(id);
  }

  @Post(':id/xac-nhan-thu-cong')
  @CanQuyen('THANH_TOAN_QUAN_LY')
  xacNhanThuCong(
    @Param('id') id: string,
    @Body() dto: XacNhanThanhToanThuCongDto,
    @NguoiDungHienTai() nguoiDung: NguoiDungXacThuc,
  ) {
    return this.service.xacNhanThuCong(
      id,
      dto,
      nguoiDung.taiKhoanId,
    );
  }

  @Post('hoan-tien/:id/xac-nhan')
  @CanQuyen('HOAN_TIEN_THUC_HIEN')
  xacNhanHoanTien(
    @Param('id') id: string,
    @Body() dto: XacNhanHoanTienDto,
    @NguoiDungHienTai() nguoiDung: NguoiDungXacThuc,
  ) {
    return this.service.xacNhanHoanTienQuanTri(
      id,
      dto,
      nguoiDung.taiKhoanId,
    );
  }
}
