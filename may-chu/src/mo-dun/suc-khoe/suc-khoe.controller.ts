import {
  Controller,
  Get,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { PrismaService } from '../../co-so-du-lieu/prisma.service';

@ApiTags('Hệ thống')
@Controller('suc-khoe')
export class SucKhoeController {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  @Get('song')
  @ApiOperation({
    summary:
      'Liveness: tiến trình API còn hoạt động',
  })
  song() {
    return {
      api: 'HOAT_DONG',
      thoiGian: new Date().toISOString(),
      uptimeGiay:
        Math.floor(process.uptime()),
    };
  }

  @Get('san-sang')
  @ApiOperation({
    summary:
      'Readiness: API kết nối được database',
  })
  async sanSang() {
    await this.prisma.$queryRaw`
      SELECT 1
    `;

    return {
      api: 'HOAT_DONG',
      database: 'HOAT_DONG',
      thoiGian: new Date().toISOString(),
    };
  }

  @Get()
  @ApiOperation({
    summary:
      'Kiểm tra trạng thái API và database',
  })
  async kiemTra() {
    return this.sanSang();
  }
}
