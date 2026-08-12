import { Module } from '@nestjs/common';
import { KhachHangLifecycleService } from './khach-hang-lifecycle.service';

@Module({
  providers: [KhachHangLifecycleService],
  exports: [KhachHangLifecycleService],
})
export class KhachHangLifecycleModule {}
