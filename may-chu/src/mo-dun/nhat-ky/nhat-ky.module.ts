import { Module } from '@nestjs/common';
import { QuyenGuard } from '../../dung-chung/guard/quyen.guard';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';
import { NhatKyController } from './nhat-ky.controller';
import { NhatKyService } from './nhat-ky.service';

@Module({ imports: [XacThucModule], controllers: [NhatKyController], providers: [NhatKyService, QuyenGuard], exports: [NhatKyService] })
export class NhatKyModule {}
