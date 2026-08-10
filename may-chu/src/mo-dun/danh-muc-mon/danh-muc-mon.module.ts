import { Module } from '@nestjs/common';
import { QuyenGuard } from '../../dung-chung/guard/quyen.guard';
import { NhatKyModule } from '../nhat-ky/nhat-ky.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';
import { DanhMucMonCongKhaiController, DanhMucMonQuanTriController } from './danh-muc-mon.controller';
import { DanhMucMonService } from './danh-muc-mon.service';

@Module({ imports: [XacThucModule, NhatKyModule], controllers: [DanhMucMonCongKhaiController, DanhMucMonQuanTriController], providers: [DanhMucMonService, QuyenGuard], exports: [DanhMucMonService] })
export class DanhMucMonModule {}
