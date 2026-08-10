import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { XacThucController } from './xac-thuc.controller';
import { XacThucService } from './xac-thuc.service';
import { JwtGuard } from '../../dung-chung/guard/jwt.guard';

@Module({
  imports: [JwtModule.register({})],
  controllers: [XacThucController],
  providers: [XacThucService, JwtGuard],
  exports: [JwtModule, JwtGuard, XacThucService],
})
export class XacThucModule {}
