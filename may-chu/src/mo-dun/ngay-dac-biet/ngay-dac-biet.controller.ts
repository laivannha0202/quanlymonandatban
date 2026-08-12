import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CanQuyen } from '../../dung-chung/decorator/can-quyen.decorator';
import { JwtGuard } from '../../dung-chung/guard/jwt.guard';
import { QuyenGuard } from '../../dung-chung/guard/quyen.guard';
import { CapNhatNgayDacBietDto } from './dto/cap-nhat-ngay-dac-biet.dto';
import { TaoNgayDacBietDto } from './dto/tao-ngay-dac-biet.dto';
import { NgayDacBietService } from './ngay-dac-biet.service';

@ApiTags('Quản trị - Ngày đặc biệt')
@ApiBearerAuth()
@UseGuards(JwtGuard, QuyenGuard)
@CanQuyen('LICH_PHUC_VU_QUAN_LY')
@Controller('quan-tri/ngay-dac-biet')
export class NgayDacBietController {
  constructor(private readonly service: NgayDacBietService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách ngày nghỉ/ngày hoạt động đặc biệt' })
  @ApiQuery({ name: 'tuNgay', required: false })
  @ApiQuery({ name: 'denNgay', required: false })
  danhSach(@Query('tuNgay') tuNgay?: string, @Query('denNgay') denNgay?: string) {
    return this.service.danhSach(tuNgay, denNgay);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo ngày đặc biệt' })
  tao(@Body() dto: TaoNgayDacBietDto) {
    return this.service.tao(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật ngày đặc biệt' })
  capNhat(@Param('id') id: string, @Body() dto: CapNhatNgayDacBietDto) {
    return this.service.capNhat(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa ngày đặc biệt' })
  xoa(@Param('id') id: string) {
    return this.service.xoa(id);
  }
}
