import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CauHinhService } from './cau-hinh.service';

@ApiTags('Công khai - Thông tin nhà hàng')
@Controller('cau-hinh')
export class CauHinhCongKhaiController {
  constructor(private readonly service: CauHinhService) {}

  @Get('cong-khai')
  @ApiOperation({ summary: 'Lấy thông tin nhà hàng được phép công khai' })
  thongTinCongKhai() {
    return this.service.thongTinCongKhai();
  }
}
