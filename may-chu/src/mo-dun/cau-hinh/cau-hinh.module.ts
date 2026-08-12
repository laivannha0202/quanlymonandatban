import { Module } from '@nestjs/common';
import { CauHinhCongKhaiController } from './cau-hinh-cong-khai.controller';
import { CauHinhService } from './cau-hinh.service';

@Module({
  controllers: [CauHinhCongKhaiController],
  providers: [CauHinhService],
  exports: [CauHinhService],
})
export class CauHinhModule {}
