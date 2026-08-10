import { Module } from '@nestjs/common';
import { QuyenGuard } from '../../dung-chung/guard/quyen.guard';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';
import { NgayDacBietController } from './ngay-dac-biet.controller';
import { NgayDacBietService } from './ngay-dac-biet.service';

@Module({
  imports: [XacThucModule],
  controllers: [NgayDacBietController],
  providers: [NgayDacBietService, QuyenGuard],
  exports: [NgayDacBietService],
})
export class NgayDacBietModule {}
