import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CanQuyen } from '../../dung-chung/decorator/can-quyen.decorator';
import { MaYeuCauHienTai } from '../../dung-chung/decorator/ma-yeu-cau-hien-tai.decorator';
import { NguoiDungHienTai } from '../../dung-chung/decorator/nguoi-dung-hien-tai.decorator';
import { JwtGuard } from '../../dung-chung/guard/jwt.guard';
import { QuyenGuard } from '../../dung-chung/guard/quyen.guard';
import type { NguoiDungXacThuc } from '../../dung-chung/types/nguoi-dung-xac-thuc.type';
import { DatBanService } from './dat-ban.service';
import { DatBanWorkflowService } from './dat-ban-workflow.service';
import { CapNhatThongTinDatBanDto } from './dto/cap-nhat-thong-tin-dat-ban.dto';
import { DanhSachDatBanDto } from './dto/danh-sach-dat-ban.dto';
import { HuyDatBanDto } from './dto/huy-dat-ban.dto';
import { SapBanDto } from './dto/sap-ban.dto';
import { TaoDatBanAdminDto } from './dto/tao-dat-ban-admin.dto';

@ApiTags('Quản trị - Đặt bàn')
@ApiBearerAuth()
@UseGuards(JwtGuard, QuyenGuard)
@Controller('quan-tri/dat-ban')
export class DatBanQuanTriController {
  constructor(
    private readonly service: DatBanService,
    private readonly workflow: DatBanWorkflowService,
  ) {}

  @Get()
  @CanQuyen('DAT_BAN_XEM')
  danhSach(@Query() dto: DanhSachDatBanDto) { return this.service.danhSachQuanTri(dto); }

  @Post()
  @CanQuyen('DAT_BAN_TAO')
  tao(
    @Body() dto: TaoDatBanAdminDto,
    @NguoiDungHienTai() nguoiDung: NguoiDungXacThuc,
    @MaYeuCauHienTai() maYeuCau: string | null,
  ) { return this.service.taoQuanTri(dto, nguoiDung, maYeuCau); }

  @Get('thong-so/check-in')
  @CanQuyen('DAT_BAN_XEM')
  thongSoCheckIn() { return this.workflow.thongSoCheckIn(); }

  @Get(':id')
  @CanQuyen('DAT_BAN_XEM')
  chiTiet(@Param('id') id: string) { return this.service.chiTietQuanTri(id); }

  @Patch(':id')
  @CanQuyen('DAT_BAN_SUA')
  capNhat(
    @Param('id') id: string,
    @Body() dto: CapNhatThongTinDatBanDto,
    @NguoiDungHienTai() nguoiDung: NguoiDungXacThuc,
    @MaYeuCauHienTai() maYeuCau: string | null,
  ) { return this.service.capNhatThongTin(id, dto, nguoiDung, maYeuCau); }

  @Patch(':id/sap-ban')
  @CanQuyen('DAT_BAN_SAP_BAN')
  sapBan(@Param('id') id: string, @Body() dto: SapBanDto, @NguoiDungHienTai() nd: NguoiDungXacThuc, @MaYeuCauHienTai() myc: string | null) {
    return this.workflow.sapBan(id, dto, nd, myc);
  }

  @Patch(':id/xac-nhan')
  @CanQuyen('DAT_BAN_XAC_NHAN')
  @ApiOperation({ summary: 'CHO_XAC_NHAN → DA_XAC_NHAN' })
  xacNhan(@Param('id') id: string, @NguoiDungHienTai() nd: NguoiDungXacThuc, @MaYeuCauHienTai() myc: string | null) {
    return this.workflow.xacNhan(id, nd, myc);
  }

  @Patch(':id/check-in')
  @CanQuyen('DAT_BAN_CHECK_IN')
  checkIn(@Param('id') id: string, @NguoiDungHienTai() nd: NguoiDungXacThuc, @MaYeuCauHienTai() myc: string | null) {
    return this.workflow.checkIn(id, nd, myc);
  }

  @Patch(':id/hoan-thanh')
  @CanQuyen('DAT_BAN_HOAN_THANH')
  hoanThanh(@Param('id') id: string, @NguoiDungHienTai() nd: NguoiDungXacThuc, @MaYeuCauHienTai() myc: string | null) {
    return this.workflow.hoanThanh(id, nd, myc);
  }

  @Patch(':id/huy')
  @CanQuyen('DAT_BAN_HUY')
  huy(@Param('id') id: string, @Body() dto: HuyDatBanDto, @NguoiDungHienTai() nd: NguoiDungXacThuc, @MaYeuCauHienTai() myc: string | null) {
    return this.workflow.huyQuanTri(id, dto, nd, myc);
  }

  @Patch(':id/khong-den')
  @CanQuyen('DAT_BAN_KHONG_DEN')
  khongDen(@Param('id') id: string, @NguoiDungHienTai() nd: NguoiDungXacThuc, @MaYeuCauHienTai() myc: string | null) {
    return this.workflow.khongDen(id, nd, myc);
  }
}
