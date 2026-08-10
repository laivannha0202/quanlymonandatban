import { Module } from '@nestjs/common';
import { QuyenGuard } from '../../dung-chung/guard/quyen.guard';
import { NhatKyModule } from '../nhat-ky/nhat-ky.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';
import { NhanVienController } from './nhan-vien.controller';
import { NhanVienService } from './nhan-vien.service';

@Module({
  imports: [XacThucModule, NhatKyModule],
  controllers: [NhanVienController],
  providers: [NhanVienService, QuyenGuard],
})
export class NhanVienModule {}
