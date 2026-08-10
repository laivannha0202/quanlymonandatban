import { Module } from '@nestjs/common';
import { QuyenGuard } from '../../dung-chung/guard/quyen.guard';
import { BanAnModule } from '../ban-an/ban-an.module';
import { CauHinhModule } from '../cau-hinh/cau-hinh.module';
import { NhatKyModule } from '../nhat-ky/nhat-ky.module';
import { ThongBaoModule } from '../thong-bao/thong-bao.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';
import { DatBanKhachHangController } from './dat-ban-khach-hang.controller';
import { DatBanQuanTriController } from './dat-ban-quan-tri.controller';
import { DatBanController } from './dat-ban.controller';
import { DatBanRepository } from './dat-ban.repository';
import { DatBanService } from './dat-ban.service';
import { DatBanWorkflowService } from './dat-ban-workflow.service';

@Module({
  imports: [XacThucModule, BanAnModule, CauHinhModule, NhatKyModule, ThongBaoModule],
  controllers: [DatBanController, DatBanKhachHangController, DatBanQuanTriController],
  providers: [DatBanRepository, DatBanService, DatBanWorkflowService, QuyenGuard],
  exports: [DatBanService, DatBanWorkflowService],
})
export class DatBanModule {}
