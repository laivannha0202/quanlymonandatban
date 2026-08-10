import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CanQuyen } from '../../dung-chung/decorator/can-quyen.decorator';
import { JwtGuard } from '../../dung-chung/guard/jwt.guard';
import { QuyenGuard } from '../../dung-chung/guard/quyen.guard';
import { BanAnService } from './ban-an.service';
import { CapNhatBanAnDto } from './dto/cap-nhat-ban-an.dto';
import { CapNhatLienKetBanDto } from './dto/cap-nhat-lien-ket-ban.dto';
import { DanhSachBanAnDto } from './dto/danh-sach-ban-an.dto';
import { TaoBanAnDto } from './dto/tao-ban-an.dto';
import { TaoLienKetBanDto } from './dto/tao-lien-ket-ban.dto';
import { LienKetBanService } from './lien-ket-ban.service';

@ApiTags('Quản trị - Bàn ăn')
@ApiBearerAuth()
@UseGuards(JwtGuard, QuyenGuard)
@Controller('quan-tri/ban-an')
export class BanAnQuanTriController {
  constructor(
    private readonly service: BanAnService,
    private readonly lienKetBan: LienKetBanService,
  ) {}

  @Get()
  @CanQuyen('BAN_AN_XEM')
  danhSach(@Query() dto: DanhSachBanAnDto) {
    return this.service.danhSach(dto);
  }

  @Get('so-do')
  @CanQuyen('BAN_AN_XEM')
  @ApiOperation({ summary: 'Lấy sơ đồ bàn theo khu vực' })
  soDo() {
    return this.service.soDo();
  }

  @Get('lien-ket')
  @CanQuyen('BAN_AN_XEM')
  danhSachLienKet() {
    return this.lienKetBan.danhSach();
  }

  @Post('lien-ket')
  @CanQuyen('BAN_AN_QUAN_LY')
  taoLienKet(@Body() dto: TaoLienKetBanDto) {
    return this.lienKetBan.tao(dto);
  }

  @Patch('lien-ket/:id')
  @CanQuyen('BAN_AN_QUAN_LY')
  capNhatLienKet(@Param('id') id: string, @Body() dto: CapNhatLienKetBanDto) {
    return this.lienKetBan.capNhat(id, dto);
  }

  @Delete('lien-ket/:id')
  @CanQuyen('BAN_AN_QUAN_LY')
  xoaLienKet(@Param('id') id: string) {
    return this.lienKetBan.xoa(id);
  }

  @Get(':id')
  @CanQuyen('BAN_AN_XEM')
  chiTiet(@Param('id') id: string) {
    return this.service.chiTiet(id);
  }

  @Post()
  @CanQuyen('BAN_AN_QUAN_LY')
  tao(@Body() dto: TaoBanAnDto) {
    return this.service.tao(dto);
  }

  @Patch(':id')
  @CanQuyen('BAN_AN_QUAN_LY')
  capNhat(@Param('id') id: string, @Body() dto: CapNhatBanAnDto) {
    return this.service.capNhat(id, dto);
  }

  @Delete(':id')
  @CanQuyen('BAN_AN_QUAN_LY')
  xoa(@Param('id') id: string) {
    return this.service.xoa(id);
  }
}
