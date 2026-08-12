import { Module } from '@nestjs/common';
import { NhatKyService } from './nhat-ky.service';

@Module({
  providers: [NhatKyService],
  exports: [NhatKyService],
})
export class NhatKyModule {}
