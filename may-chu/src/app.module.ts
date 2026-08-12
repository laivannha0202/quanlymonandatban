import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './co-so-du-lieu/prisma.module';
import { kiemTraBienMoiTruong } from './dung-chung/cau-hinh/kiem-tra-bien-moi-truong';
import { BoLocLoiToanCuc } from './dung-chung/filter/bo-loc-loi-toan-cuc';
import { PhanHoiInterceptor } from './dung-chung/interceptor/phan-hoi.interceptor';
import { MaYeuCauMiddleware } from './dung-chung/middleware/ma-yeu-cau.middleware';
import { BanAnModule } from './mo-dun/ban-an/ban-an.module';
import { BaoCaoModule } from './mo-dun/bao-cao/bao-cao.module';
import { CauHinhModule } from './mo-dun/cau-hinh/cau-hinh.module';
import { DanhGiaModule } from './mo-dun/danh-gia/danh-gia.module';
import { DanhMucMonModule } from './mo-dun/danh-muc-mon/danh-muc-mon.module';
import { DashboardModule } from './mo-dun/dashboard/dashboard.module';
import { DatBanModule } from './mo-dun/dat-ban/dat-ban.module';
import { GioHoatDongModule } from './mo-dun/gio-hoat-dong/gio-hoat-dong.module';
import { KhachHangModule } from './mo-dun/khach-hang/khach-hang.module';
import { KhuVucModule } from './mo-dun/khu-vuc/khu-vuc.module';
import { KhuyenMaiModule } from './mo-dun/khuyen-mai/khuyen-mai.module';
import { MonAnModule } from './mo-dun/mon-an/mon-an.module';
import { NgayDacBietModule } from './mo-dun/ngay-dac-biet/ngay-dac-biet.module';
import { NhanVienModule } from './mo-dun/nhan-vien/nhan-vien.module';
import { NhatKyModule } from './mo-dun/nhat-ky/nhat-ky.module';
import { SucKhoeModule } from './mo-dun/suc-khoe/suc-khoe.module';
import { ThongBaoModule } from './mo-dun/thong-bao/thong-bao.module';
import { TaiLenModule } from './mo-dun/tai-len/tai-len.module';
import { VaiTroModule } from './mo-dun/vai-tro/vai-tro.module';
import { XacThucModule } from './mo-dun/xac-thuc/xac-thuc.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: kiemTraBienMoiTruong }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const laE2E = configService.get<string>('E2E_MODE') === 'true';
        return [
          {
            name: 'default',
            ttl: 60_000,
            limit: laE2E ? 5_000 : 120,
          },
        ];
      },
    }),
    PrismaModule,
    XacThucModule,
    VaiTroModule,
    CauHinhModule,
    GioHoatDongModule,
    NgayDacBietModule,
    KhuVucModule,
    BanAnModule,
    DatBanModule,
    KhachHangModule,
    NhanVienModule,
    DanhMucMonModule,
    MonAnModule,
    KhuyenMaiModule,
    DanhGiaModule,
    ThongBaoModule,
    TaiLenModule,
    DashboardModule,
    BaoCaoModule,
    NhatKyModule,
    SucKhoeModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: PhanHoiInterceptor },
    { provide: APP_FILTER, useClass: BoLocLoiToanCuc },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(MaYeuCauMiddleware).forRoutes('{*splat}');
  }
}
