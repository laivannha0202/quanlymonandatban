import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { KhungGioDto } from './dto/khung-gio.dto';
import { TimBanTrongDto } from './dto/tim-ban-trong.dto';
import { LichPhucVuService } from './lich-phuc-vu.service';
import { KetQuaTimBanTrong, TimBanTrongService } from './tim-ban-trong.service';

@ApiTags('Khách hàng - Đặt bàn')
@Controller()
export class BanAnController {
  constructor(
    private readonly timBanTrong: TimBanTrongService,
    private readonly lichPhucVu: LichPhucVuService,
  ) {}

  @Get('ban-an/tim-ban-trong')
  @ApiOperation({ summary: 'Tìm phương án bàn còn trống theo ngày, giờ và số người' })
  tim(@Query() dto: TimBanTrongDto): Promise<KetQuaTimBanTrong> {
    return this.timBanTrong.tim(dto);
  }

  @Get('dat-ban/khung-gio')
  @ApiOperation({ summary: 'Lấy các khung giờ còn hợp lệ theo lịch hoạt động' })
  async khungGio(@Query() dto: KhungGioDto) {
    return {
      ngay: dto.ngay,
      danhSach: await this.lichPhucVu.taoKhungGio(dto.ngay),
    };
  }
}
