import { Module } from '@nestjs/common';
import { QuyenGuard } from '../../dung-chung/guard/quyen.guard';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
@Module({ imports: [XacThucModule], controllers: [DashboardController], providers: [DashboardService, QuyenGuard] })
export class DashboardModule {}
