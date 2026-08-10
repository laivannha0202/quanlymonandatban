import { Module } from '@nestjs/common';
import { QuyenGuard } from '../../dung-chung/guard/quyen.guard';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';
import { KhuVucController } from './khu-vuc.controller';
import { KhuVucQuanTriController } from './khu-vuc-quan-tri.controller';
import { KhuVucService } from './khu-vuc.service';

@Module({
  imports: [XacThucModule],
  controllers: [KhuVucController, KhuVucQuanTriController],
  providers: [KhuVucService, QuyenGuard],
  exports: [KhuVucService],
})
export class KhuVucModule {}
