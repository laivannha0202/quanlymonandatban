import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CanQuyen } from '../../dung-chung/decorator/can-quyen.decorator';
import { JwtGuard } from '../../dung-chung/guard/jwt.guard';
import { QuyenGuard } from '../../dung-chung/guard/quyen.guard';
import { CapNhatKhuVucDto } from './dto/cap-nhat-khu-vuc.dto';
import { TaoKhuVucDto } from './dto/tao-khu-vuc.dto';
import { KhuVucService } from './khu-vuc.service';

@ApiTags('Quản trị - Khu vực')
@ApiBearerAuth()
@UseGuards(JwtGuard, QuyenGuard)
@Controller('quan-tri/khu-vuc')
export class KhuVucQuanTriController {
  constructor(private readonly service: KhuVucService) {}

  @Get()
  @CanQuyen('KHU_VUC_XEM')
  @ApiQuery({ name: 'tuKhoa', required: false })
  @ApiQuery({ name: 'trangThai', required: false })
  danhSach(@Query('tuKhoa') tuKhoa?: string, @Query('trangThai') trangThai?: string) {
    return this.service.danhSachQuanTri(tuKhoa, trangThai);
  }

  @Get(':id')
  @CanQuyen('KHU_VUC_XEM')
  chiTiet(@Param('id') id: string) {
    return this.service.chiTiet(id);
  }

  @Post()
  @CanQuyen('KHU_VUC_QUAN_LY')
  @ApiOperation({ summary: 'Tạo khu vực' })
  tao(@Body() dto: TaoKhuVucDto) {
    return this.service.tao(dto);
  }

  @Patch(':id')
  @CanQuyen('KHU_VUC_QUAN_LY')
  capNhat(@Param('id') id: string, @Body() dto: CapNhatKhuVucDto) {
    return this.service.capNhat(id, dto);
  }

  @Delete(':id')
  @CanQuyen('KHU_VUC_QUAN_LY')
  xoa(@Param('id') id: string) {
    return this.service.xoa(id);
  }
}
