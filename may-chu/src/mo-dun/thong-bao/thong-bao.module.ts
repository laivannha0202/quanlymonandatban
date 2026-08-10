import { Module } from '@nestjs/common';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';
import { ThongBaoController } from './thong-bao.controller';
import { ThongBaoService } from './thong-bao.service';

@Module({ imports: [XacThucModule], controllers: [ThongBaoController], providers: [ThongBaoService], exports: [ThongBaoService] })
export class ThongBaoModule {}
