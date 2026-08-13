import { Body, Controller, Post } from '@nestjs/common';
import { ApiConflictResponse, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DatBanService } from './dat-ban.service';
import { DatBanTinhTienService } from './dat-ban-tinh-tien.service';
import { TaoDatBanDto } from './dto/tao-dat-ban.dto';
import { TinhTienDatBanDto } from './dto/tinh-tien-dat-ban.dto';
import { TraCuuDatBanDto } from './dto/tra-cuu-dat-ban.dto';

@ApiTags('Khách hàng - Đặt bàn')
@Controller('dat-ban')
export class DatBanController {
  constructor(
    private readonly service: DatBanService,
    private readonly tinhTienService: DatBanTinhTienService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Tạo đặt bàn mới; backend khóa bàn và kiểm tra trùng lịch lần cuối' })
  @ApiCreatedResponse({ description: 'Tạo đặt bàn thành công' })
  @ApiConflictResponse({ description: 'Bàn vừa bị đặt bởi request khác' })
  tao(@Body() dto: TaoDatBanDto) {
    return this.service.taoPublic(dto);
  }

  @Post('tinh-tien')
  @ApiOperation({ summary: 'Tính món đặt trước, áp mã ưu đãi và tiền cọc từ dữ liệu phía server' })
  tinhTien(@Body() dto: TinhTienDatBanDto) {
    return this.tinhTienService.tinh(dto);
  }

  @Post('tra-cuu')
  @ApiOperation({ summary: 'Tra cứu đặt bàn bằng mã đặt bàn và số điện thoại' })
  traCuu(@Body() dto: TraCuuDatBanDto) {
    return this.service.traCuu(dto);
  }
}
