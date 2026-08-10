import { Module } from '@nestjs/common';
import { QuyenGuard } from '../../dung-chung/guard/quyen.guard';
import { NhatKyModule } from '../nhat-ky/nhat-ky.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';
import { KhachHangController } from './khach-hang.controller';
import { KhachHangCaNhanController } from './khach-hang-ca-nhan.controller';
import { KhachHangService } from './khach-hang.service';

@Module({
  imports: [XacThucModule, NhatKyModule],
  controllers: [KhachHangController, KhachHangCaNhanController],
  providers: [KhachHangService, QuyenGuard],
  exports: [KhachHangService],
})
export class KhachHangModule {}
