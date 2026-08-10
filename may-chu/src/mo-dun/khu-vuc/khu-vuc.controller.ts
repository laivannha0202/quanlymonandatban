import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { KhuVucService } from './khu-vuc.service';

@ApiTags('Khách hàng - Khu vực')
@Controller('khu-vuc')
export class KhuVucController {
  constructor(private readonly service: KhuVucService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách khu vực đang hoạt động' })
  danhSach() {
    return this.service.danhSachCongKhai();
  }
}
