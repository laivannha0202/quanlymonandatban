import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { KhachHangLifecycleModule } from '../khach-hang/khach-hang-lifecycle.module';
import { XacThucController } from './xac-thuc.controller';
import { XacThucService } from './xac-thuc.service';
import { JwtGuard } from '../../dung-chung/guard/jwt.guard';
import { PhienCookieService } from './phien-cookie.service';

@Module({
  imports: [JwtModule.register({}), KhachHangLifecycleModule],
  controllers: [XacThucController],
  providers: [XacThucService, JwtGuard, PhienCookieService],
  exports: [JwtModule, JwtGuard, XacThucService],
})
export class XacThucModule {}
