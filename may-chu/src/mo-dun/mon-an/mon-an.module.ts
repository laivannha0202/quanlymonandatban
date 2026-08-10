import { Module } from '@nestjs/common';
import { QuyenGuard } from '../../dung-chung/guard/quyen.guard';
import { NhatKyModule } from '../nhat-ky/nhat-ky.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';
import { MonAnCongKhaiController, MonAnQuanTriController } from './mon-an.controller';
import { MonAnService } from './mon-an.service';

@Module({ imports: [XacThucModule, NhatKyModule], controllers: [MonAnCongKhaiController, MonAnQuanTriController], providers: [MonAnService, QuyenGuard] })
export class MonAnModule {}
