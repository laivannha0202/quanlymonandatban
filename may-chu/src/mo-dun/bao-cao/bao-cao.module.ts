import { Module } from '@nestjs/common';
import { QuyenGuard } from '../../dung-chung/guard/quyen.guard';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';
import { BaoCaoController } from './bao-cao.controller';
import { BaoCaoService } from './bao-cao.service';
@Module({ imports: [XacThucModule], controllers: [BaoCaoController], providers: [BaoCaoService, QuyenGuard] })
export class BaoCaoModule {}
