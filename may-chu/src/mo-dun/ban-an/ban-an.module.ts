import { Module } from '@nestjs/common';
import { QuyenGuard } from '../../dung-chung/guard/quyen.guard';
import { CauHinhModule } from '../cau-hinh/cau-hinh.module';
import { GioHoatDongModule } from '../gio-hoat-dong/gio-hoat-dong.module';
import { NgayDacBietModule } from '../ngay-dac-biet/ngay-dac-biet.module';
import { ThanhToanModule } from '../thanh-toan/thanh-toan.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';
import { BanAnController } from './ban-an.controller';
import { BanAnQuanTriController } from './ban-an-quan-tri.controller';
import { BanAnRepository } from './ban-an.repository';
import { BanAnService } from './ban-an.service';
import { LichPhucVuService } from './lich-phuc-vu.service';
import { LienKetBanService } from './lien-ket-ban.service';
import { TimBanTrongService } from './tim-ban-trong.service';

@Module({
  imports: [XacThucModule, CauHinhModule, GioHoatDongModule, NgayDacBietModule, ThanhToanModule],
  controllers: [BanAnController, BanAnQuanTriController],
  providers: [
    BanAnService,
    BanAnRepository,
    LichPhucVuService,
    LienKetBanService,
    TimBanTrongService,
    QuyenGuard,
  ],
  exports: [BanAnService, BanAnRepository, LichPhucVuService, TimBanTrongService],
})
export class BanAnModule {}
