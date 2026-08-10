import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NguoiDungHienTai } from '../../dung-chung/decorator/nguoi-dung-hien-tai.decorator';
import { JwtGuard } from '../../dung-chung/guard/jwt.guard';
import type { NguoiDungXacThuc } from '../../dung-chung/types/nguoi-dung-xac-thuc.type';
import { CapNhatHoSoKhachHangDto } from './dto/cap-nhat-ho-so-khach-hang.dto';
import { KhachHangService } from './khach-hang.service';

@ApiTags('Khách hàng - Hồ sơ')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('khach-hang/ho-so')
export class KhachHangCaNhanController {
  constructor(private readonly service: KhachHangService) {}
  @Get() hoSo(@NguoiDungHienTai() u: NguoiDungXacThuc) { return this.service.hoSoCuaToi(u.taiKhoanId); }
  @Patch() capNhat(@Body() dto: CapNhatHoSoKhachHangDto, @NguoiDungHienTai() u: NguoiDungXacThuc) { return this.service.capNhatHoSoCuaToi(u.taiKhoanId, dto); }
}
