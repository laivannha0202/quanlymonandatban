import { Module } from '@nestjs/common';
import { QuyenGuard } from '../../dung-chung/guard/quyen.guard';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';
import { CauHinhModule } from '../cau-hinh/cau-hinh.module';
import { ThongBaoModule } from '../thong-bao/thong-bao.module';
import { ThanhToanController, ThanhToanQuanTriController } from './thanh-toan.controller';
import { ThanhToanService } from './thanh-toan.service';

@Module({
  imports: [ThongBaoModule, XacThucModule, CauHinhModule],
  controllers: [ThanhToanController, ThanhToanQuanTriController],
  providers: [ThanhToanService, QuyenGuard],
  exports: [ThanhToanService],
})
export class ThanhToanModule {}
