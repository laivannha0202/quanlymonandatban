import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CanQuyen } from '../../dung-chung/decorator/can-quyen.decorator';
import { JwtGuard } from '../../dung-chung/guard/jwt.guard';
import { QuyenGuard } from '../../dung-chung/guard/quyen.guard';
import { CapNhatCauHinhDto } from './dto/cap-nhat-cau-hinh.dto';
import { CauHinhService } from './cau-hinh.service';

@ApiTags('Quản trị - Cấu hình')
@ApiBearerAuth()
@UseGuards(JwtGuard, QuyenGuard)
@CanQuyen('CAU_HINH_QUAN_LY')
@Controller('quan-tri/cau-hinh')
export class CauHinhController {
  constructor(private readonly service: CauHinhService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy cấu hình hệ thống' })
  @ApiQuery({ name: 'nhom', required: false })
  danhSach(@Query('nhom') nhom?: string) {
    return this.service.danhSach(nhom);
  }

  @Patch()
  @ApiOperation({ summary: 'Cập nhật nhiều cấu hình' })
  capNhat(@Body() dto: CapNhatCauHinhDto) {
    return this.service.capNhat(dto);
  }
}
