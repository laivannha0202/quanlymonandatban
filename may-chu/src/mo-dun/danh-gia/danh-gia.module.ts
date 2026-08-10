import { Module } from '@nestjs/common';
import { QuyenGuard } from '../../dung-chung/guard/quyen.guard';
import { NhatKyModule } from '../nhat-ky/nhat-ky.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';
import { DanhGiaCongKhaiController, DanhGiaKhachHangController, DanhGiaQuanTriController } from './danh-gia.controller';
import { DanhGiaService } from './danh-gia.service';

@Module({ imports: [XacThucModule, NhatKyModule], controllers: [DanhGiaCongKhaiController, DanhGiaKhachHangController, DanhGiaQuanTriController], providers: [DanhGiaService, QuyenGuard] })
export class DanhGiaModule {}
