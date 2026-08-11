import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { ChoPhepKhiBatBuocDoiMatKhau } from '../../dung-chung/decorator/cho-phep-khi-bat-buoc-doi-mat-khau.decorator';
import { NguoiDungHienTai } from '../../dung-chung/decorator/nguoi-dung-hien-tai.decorator';
import { LoiNghiepVuException } from '../../dung-chung/exception/loi-nghiep-vu.exception';
import { JwtGuard } from '../../dung-chung/guard/jwt.guard';
import type { NguoiDungXacThuc } from '../../dung-chung/types/nguoi-dung-xac-thuc.type';
import { DangKyDto } from './dto/dang-ky.dto';
import { DangNhapDto } from './dto/dang-nhap.dto';
import { DatLaiMatKhauDto } from './dto/dat-lai-mat-khau.dto';
import { DoiMatKhauDto } from './dto/doi-mat-khau.dto';
import { QuenMatKhauDto } from './dto/quen-mat-khau.dto';
import { PhienCookieService } from './phien-cookie.service';
import { XacThucService } from './xac-thuc.service';

type BoTokenNoiBo = {
  accessToken: string;
  refreshToken: string;
  loaiToken: string;
  accessHetHanSauGiay: number;
};

@ApiTags('Xác thực')
@Controller('xac-thuc')
export class XacThucController {
  constructor(
    private readonly service: XacThucService,
    private readonly phienCookie: PhienCookieService,
  ) {}

  @Post('dang-nhap')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Đăng nhập' })
  async dangNhap(
    @Body() dto: DangNhapDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.hoanTatCapToken(
      response,
      await this.service.dangNhap(dto),
    );
  }

  @Post('dang-ky')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Đăng ký tài khoản khách hàng' })
  async dangKy(
    @Body() dto: DangKyDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.hoanTatCapToken(
      response,
      await this.service.dangKy(dto),
    );
  }

  @Post('lam-moi-token')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Cấp access token mới từ refresh token HttpOnly cookie',
  })
  async lamMoiToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken =
      this.phienCookie.layRefreshToken(request);

    if (!refreshToken) {
      throw new LoiNghiepVuException(
        'XAC_THUC_004',
        'Thiếu refresh token hợp lệ.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      return this.hoanTatCapToken(
        response,
        await this.service.lamMoiToken(refreshToken),
      );
    } catch (error) {
      this.phienCookie.xoaRefreshToken(response);
      throw error;
    }
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
  async datLaiMatKhau(
    @Body() dto: DatLaiMatKhauDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const ketQua =
      await this.service.datLaiMatKhau(dto);

    this.phienCookie.xoaRefreshToken(response);
    return ketQua;
  }

  @Post('doi-mat-khau')
  @ChoPhepKhiBatBuocDoiMatKhau()
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 5, ttl: 600_000 } })
  @ApiOperation({ summary: 'Đổi mật khẩu của tài khoản đang đăng nhập' })
  async doiMatKhau(
    @NguoiDungHienTai() nguoiDung: NguoiDungXacThuc,
    @Body() dto: DoiMatKhauDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const ketQua =
      await this.service.doiMatKhau(
        nguoiDung.taiKhoanId,
        dto,
      );

    this.phienCookie.xoaRefreshToken(response);
    return ketQua;
  }

  @Post('dang-xuat')
  @ChoPhepKhiBatBuocDoiMatKhau()
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đăng xuất và vô hiệu refresh token' })
  async dangXuat(
    @NguoiDungHienTai() nguoiDung: NguoiDungXacThuc,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      return await this.service.dangXuat(
        nguoiDung.taiKhoanId,
      );
    } finally {
      this.phienCookie.xoaRefreshToken(response);
    }
  }

  @Get('thong-tin-hien-tai')
  @ChoPhepKhiBatBuocDoiMatKhau()
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin tài khoản hiện tại' })
  thongTinHienTai(
    @NguoiDungHienTai() nguoiDung: NguoiDungXacThuc,
  ) {
    return this.service.thongTinHienTai(nguoiDung);
  }

  private hoanTatCapToken(
    response: Response,
    boToken: BoTokenNoiBo,
  ) {
    this.phienCookie.ganRefreshToken(
      response,
      boToken.refreshToken,
    );

    const {
      refreshToken: _khongTraVeClient,
      ...tokenCongKhai
    } = boToken;

    return tokenCongKhai;
  }
}
