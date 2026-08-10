import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { NguoiDungHienTai } from '../../dung-chung/decorator/nguoi-dung-hien-tai.decorator';
import { JwtGuard } from '../../dung-chung/guard/jwt.guard';
import type { NguoiDungXacThuc } from '../../dung-chung/types/nguoi-dung-xac-thuc.type';
import { DangKyDto } from './dto/dang-ky.dto';
import { DangNhapDto } from './dto/dang-nhap.dto';
import { DatLaiMatKhauDto } from './dto/dat-lai-mat-khau.dto';
import { DoiMatKhauDto } from './dto/doi-mat-khau.dto';
import { LamMoiTokenDto } from './dto/lam-moi-token.dto';
import { QuenMatKhauDto } from './dto/quen-mat-khau.dto';
import { XacThucService } from './xac-thuc.service';

@ApiTags('Xác thực')
@Controller('xac-thuc')
export class XacThucController {
  constructor(private readonly service: XacThucService) {}

  @Post('dang-nhap')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Đăng nhập' })
  dangNhap(@Body() dto: DangNhapDto) {
    return this.service.dangNhap(dto);
  }

  @Post('dang-ky')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Đăng ký tài khoản khách hàng' })
  dangKy(@Body() dto: DangKyDto) {
    return this.service.dangKy(dto);
  }

  @Post('lam-moi-token')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Cấp bộ token mới' })
  lamMoiToken(@Body() dto: LamMoiTokenDto) {
    return this.service.lamMoiToken(dto.refreshToken);
  }

  @Post('quen-mat-khau')
  @Throttle({ default: { limit: 3, ttl: 600_000 } })
  @ApiOperation({ summary: 'Tạo yêu cầu đặt lại mật khẩu' })
  quenMatKhau(@Body() dto: QuenMatKhauDto) {
    return this.service.quenMatKhau(dto);
  }

  @Post('dat-lai-mat-khau')
  @Throttle({ default: { limit: 5, ttl: 600_000 } })
  @ApiOperation({ summary: 'Đặt lại mật khẩu bằng token khôi phục' })
  datLaiMatKhau(@Body() dto: DatLaiMatKhauDto) {
    return this.service.datLaiMatKhau(dto);
  }

  @Post('doi-mat-khau')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 5, ttl: 600_000 } })
  @ApiOperation({ summary: 'Đổi mật khẩu của tài khoản đang đăng nhập' })
  doiMatKhau(
    @NguoiDungHienTai() nguoiDung: NguoiDungXacThuc,
    @Body() dto: DoiMatKhauDto,
  ) {
    return this.service.doiMatKhau(nguoiDung.taiKhoanId, dto);
  }

  @Post('dang-xuat')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đăng xuất và vô hiệu refresh token' })
  dangXuat(@NguoiDungHienTai() nguoiDung: NguoiDungXacThuc) {
    return this.service.dangXuat(nguoiDung.taiKhoanId);
  }

  @Get('thong-tin-hien-tai')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin tài khoản hiện tại' })
  thongTinHienTai(@NguoiDungHienTai() nguoiDung: NguoiDungXacThuc) {
    return this.service.thongTinHienTai(nguoiDung);
  }
}
