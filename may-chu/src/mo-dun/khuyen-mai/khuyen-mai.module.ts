import { Module } from '@nestjs/common';
import { QuyenGuard } from '../../dung-chung/guard/quyen.guard';
import { NhatKyModule } from '../nhat-ky/nhat-ky.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';
import { KhuyenMaiCongKhaiController, KhuyenMaiQuanTriController } from './khuyen-mai.controller';
import { KhuyenMaiService } from './khuyen-mai.service';

@Module({ imports: [XacThucModule, NhatKyModule], controllers: [KhuyenMaiCongKhaiController, KhuyenMaiQuanTriController], providers: [KhuyenMaiService, QuyenGuard] })
export class KhuyenMaiModule {}
