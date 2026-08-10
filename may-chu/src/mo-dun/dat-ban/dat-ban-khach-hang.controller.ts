import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NguoiDungHienTai } from '../../dung-chung/decorator/nguoi-dung-hien-tai.decorator';
import { PhanTrangDto } from '../../dung-chung/dto/phan-trang.dto';
import { JwtGuard } from '../../dung-chung/guard/jwt.guard';
import type { NguoiDungXacThuc } from '../../dung-chung/types/nguoi-dung-xac-thuc.type';
import { DatBanService } from './dat-ban.service';
import { DatBanWorkflowService } from './dat-ban-workflow.service';
import { HuyDatBanDto } from './dto/huy-dat-ban.dto';

@ApiTags('Khách hàng - Lịch đặt bàn')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('khach-hang/dat-ban')
export class DatBanKhachHangController {
  constructor(
    private readonly service: DatBanService,
    private readonly workflow: DatBanWorkflowService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách đặt bàn của tài khoản khách hàng hiện tại' })
  danhSach(@NguoiDungHienTai() nguoiDung: NguoiDungXacThuc, @Query() dto: PhanTrangDto) {
    return this.service.danhSachCuaKhach(nguoiDung, dto.trang, dto.kichThuoc);
  }

  @Get(':id')
  chiTiet(@Param('id') id: string, @NguoiDungHienTai() nguoiDung: NguoiDungXacThuc) {
    return this.service.chiTietCuaKhach(id, nguoiDung);
  }

  @Patch(':id/huy')
  @ApiOperation({ summary: 'Khách hàng tự hủy đặt bàn nếu còn đủ thời gian cho phép' })
  huy(@Param('id') id: string, @Body() dto: HuyDatBanDto, @NguoiDungHienTai() nguoiDung: NguoiDungXacThuc) {
    return this.workflow.huyCuaKhach(id, dto, nguoiDung);
  }
}
