import { Module } from '@nestjs/common';
import { QuyenGuard } from '../../dung-chung/guard/quyen.guard';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';
import { TaiLenController } from './tai-len.controller';
import { TaiLenService } from './tai-len.service';

@Module({
  imports: [XacThucModule],
  controllers: [TaiLenController],
  providers: [TaiLenService, QuyenGuard],
  exports: [TaiLenService],
})
export class TaiLenModule {}
