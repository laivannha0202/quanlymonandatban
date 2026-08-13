import { Module } from '@nestjs/common';
import { QuyenGuard } from '../../dung-chung/guard/quyen.guard';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';
import { CauHinhCongKhaiController } from './cau-hinh-cong-khai.controller';
import { CauHinhDatBanQuanTriController } from './cau-hinh-dat-ban-quan-tri.controller';
import { CauHinhService } from './cau-hinh.service';

@Module({
  imports: [XacThucModule],
  controllers: [CauHinhCongKhaiController, CauHinhDatBanQuanTriController],
  providers: [CauHinhService, QuyenGuard],
  exports: [CauHinhService],
})
export class CauHinhModule {}
