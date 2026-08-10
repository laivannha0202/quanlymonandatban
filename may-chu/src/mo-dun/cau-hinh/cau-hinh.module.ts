import { Module } from '@nestjs/common';
import { QuyenGuard } from '../../dung-chung/guard/quyen.guard';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';
import { CauHinhController } from './cau-hinh.controller';
import { CauHinhService } from './cau-hinh.service';

@Module({
  imports: [XacThucModule],
  controllers: [CauHinhController],
  providers: [CauHinhService, QuyenGuard],
  exports: [CauHinhService],
})
export class CauHinhModule {}
