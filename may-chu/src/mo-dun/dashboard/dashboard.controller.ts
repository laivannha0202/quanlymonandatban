import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CanQuyen } from '../../dung-chung/decorator/can-quyen.decorator';
import { JwtGuard } from '../../dung-chung/guard/jwt.guard';
import { QuyenGuard } from '../../dung-chung/guard/quyen.guard';
import { DashboardDto } from './dto/dashboard.dto';
import { DashboardService } from './dashboard.service';

@ApiTags('Quản trị - Dashboard')
@ApiBearerAuth()
@UseGuards(JwtGuard, QuyenGuard)
@Controller('quan-tri/dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}
  @Get() @CanQuyen('DASHBOARD_XEM') tongQuan(@Query() dto: DashboardDto) { return this.service.tongQuan(dto.ngay); }
}
