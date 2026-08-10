import { Module } from '@nestjs/common';
import { QuyenGuard } from '../../dung-chung/guard/quyen.guard';
import { NhatKyModule } from '../nhat-ky/nhat-ky.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';
import { QuyenController } from './quyen.controller';
import { VaiTroController } from './vai-tro.controller';
import { VaiTroService } from './vai-tro.service';

@Module({
  imports: [XacThucModule, NhatKyModule],
  controllers: [VaiTroController, QuyenController],
  providers: [VaiTroService, QuyenGuard],
})
export class VaiTroModule {}
