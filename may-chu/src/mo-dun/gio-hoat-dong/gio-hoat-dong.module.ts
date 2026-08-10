import { Module } from '@nestjs/common';
import { QuyenGuard } from '../../dung-chung/guard/quyen.guard';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';
import { GioHoatDongController } from './gio-hoat-dong.controller';
import { GioHoatDongService } from './gio-hoat-dong.service';

@Module({
  imports: [XacThucModule],
  controllers: [GioHoatDongController],
  providers: [GioHoatDongService, QuyenGuard],
  exports: [GioHoatDongService],
})
export class GioHoatDongModule {}
