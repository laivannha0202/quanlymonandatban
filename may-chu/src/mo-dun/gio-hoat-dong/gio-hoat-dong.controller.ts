import { Body, Controller, Delete, Get, Param, ParseIntPipe, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CanQuyen } from '../../dung-chung/decorator/can-quyen.decorator';
import { JwtGuard } from '../../dung-chung/guard/jwt.guard';
import { QuyenGuard } from '../../dung-chung/guard/quyen.guard';
import { CapNhatGioHoatDongDto } from './dto/cap-nhat-gio-hoat-dong.dto';
import { GioHoatDongService } from './gio-hoat-dong.service';

@ApiTags('Quản trị - Giờ hoạt động')
@ApiBearerAuth()
@UseGuards(JwtGuard, QuyenGuard)
@CanQuyen('CAU_HINH_QUAN_LY')
@Controller('quan-tri/gio-hoat-dong')
export class GioHoatDongController {
  constructor(private readonly service: GioHoatDongService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy lịch hoạt động theo tuần' })
  danhSach() {
    return this.service.danhSach();
  }

  @Put()
  @ApiOperation({ summary: 'Upsert các ca hoạt động' })
  capNhat(@Body() dto: CapNhatGioHoatDongDto) {
    return this.service.capNhat(dto);
  }

  @Delete(':thu/:caSo')
  @ApiOperation({ summary: 'Xóa một ca hoạt động' })
  xoa(
    @Param('thu', ParseIntPipe) thu: number,
    @Param('caSo', ParseIntPipe) caSo: number,
  ) {
    return this.service.xoa(thu, caSo);
  }
}
