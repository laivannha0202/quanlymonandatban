import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../co-so-du-lieu/prisma.service';
import { LoiNghiepVuException } from '../../dung-chung/exception/loi-nghiep-vu.exception';
import {
  dateWallClockTuGio,
  dateWallClockTuNgay,
  gioThanhPhut,
  gioTuDateWallClock,
  hienTaiWallClockVietNam,
  laNgayHopLe,
  ngayTuDateWallClock,
  thuTrongTuan,
} from '../../dung-chung/tien-ich/ngay-gio';
import { bigintTuChuoi } from '../../dung-chung/tien-ich/id';
import { CapNhatNgayDacBietDto } from './dto/cap-nhat-ngay-dac-biet.dto';
import { TaoNgayDacBietDto } from './dto/tao-ngay-dac-biet.dto';

export interface NgayDacBietView {
  id: bigint;
  ngay: string;
  ten_su_kien: string;
  dong_cua_ca_ngay: number | boolean;
  gio_mo_cua: string | null;
  gio_dong_cua: string | null;
  ghi_chu: string | null;
}

@Injectable()
export class NgayDacBietService {
  constructor(private readonly prisma: PrismaService) {}

  async danhSach(tuNgay?: string, denNgay?: string): Promise<NgayDacBietView[]> {
    if (tuNgay && !laNgayHopLe(tuNgay)) {
      throw new LoiNghiepVuException('NGAY_DAC_BIET_001', 'Từ ngày không hợp lệ.');
    }
    if (denNgay && !laNgayHopLe(denNgay)) {
      throw new LoiNghiepVuException('NGAY_DAC_BIET_002', 'Đến ngày không hợp lệ.');
    }

    const ngayFilter = {
      ...(tuNgay ? { gte: dateWallClockTuNgay(tuNgay) } : {}),
      ...(denNgay ? { lte: dateWallClockTuNgay(denNgay) } : {}),
    };

    const rows = await this.prisma.ngay_nghi_dac_biet.findMany({
      where:
        tuNgay || denNgay
          ? { ngay: ngayFilter }
          : undefined,
      orderBy: {
        ngay: 'asc',
      },
    });

    return rows.map((row) => this.toView(row));
  }

  async layTheoNgay(ngay: string): Promise<NgayDacBietView | null> {
    const row = await this.prisma.ngay_nghi_dac_biet.findUnique({
      where: {
        ngay: dateWallClockTuNgay(ngay),
      },
    });
    return row ? this.toView(row) : null;
  }

  async tao(dto: TaoNgayDacBietDto) {
    this.kiemTra(dto);
    const daCo = await this.layTheoNgay(dto.ngay);
    if (daCo) {
      throw new LoiNghiepVuException(
        'NGAY_DAC_BIET_003',
        'Ngày này đã có cấu hình đặc biệt.',
        HttpStatus.CONFLICT,
      );
    }

    await this.damBaoBookingNgayVanHopLe(dto.ngay, {
      dongCuaCaNgay: dto.dongCuaCaNgay,
      gioMoCua: dto.gioMoCua,
      gioDongCua: dto.gioDongCua,
    });

    const row = await this.prisma.ngay_nghi_dac_biet.create({
      data: {
        ngay: dateWallClockTuNgay(dto.ngay),
        ten_su_kien: dto.tenSuKien,
        dong_cua_ca_ngay: dto.dongCuaCaNgay,
        gio_mo_cua: dto.dongCuaCaNgay
          ? null
          : dateWallClockTuGio(dto.gioMoCua!),
        gio_dong_cua: dto.dongCuaCaNgay
          ? null
          : dateWallClockTuGio(dto.gioDongCua!),
        ghi_chu: dto.ghiChu ?? null,
      },
    });

    return this.toView(row);
  }

  async capNhat(id: string, dto: CapNhatNgayDacBietDto) {
    const hienTai = await this.layTheoId(id);
    if (!hienTai) {
      throw new LoiNghiepVuException('NGAY_DAC_BIET_004', 'Không tìm thấy ngày đặc biệt.', HttpStatus.NOT_FOUND);
    }

    if (dto.ngay && dto.ngay !== hienTai.ngay) {
      const trungNgay = await this.layTheoNgay(dto.ngay);
      if (
        trungNgay &&
        trungNgay.id.toString() !== hienTai.id.toString()
      ) {
        throw new LoiNghiepVuException(
          'NGAY_DAC_BIET_003',
          'Ngày này đã có cấu hình đặc biệt.',
          HttpStatus.CONFLICT,
        );
      }
    }

    const duLieu: TaoNgayDacBietDto = {
      ngay: dto.ngay ?? hienTai.ngay,
      tenSuKien: dto.tenSuKien ?? hienTai.ten_su_kien,
      dongCuaCaNgay:
        dto.dongCuaCaNgay ?? Boolean(hienTai.dong_cua_ca_ngay),
      gioMoCua: dto.gioMoCua ?? hienTai.gio_mo_cua ?? undefined,
      gioDongCua: dto.gioDongCua ?? hienTai.gio_dong_cua ?? undefined,
      ghiChu: dto.ghiChu ?? hienTai.ghi_chu ?? undefined,
    };
    this.kiemTra(duLieu);

    if (duLieu.ngay !== hienTai.ngay) {
      await this.damBaoBookingNgayVanHopLe(hienTai.ngay, null);
    }
    await this.damBaoBookingNgayVanHopLe(duLieu.ngay, {
      dongCuaCaNgay: duLieu.dongCuaCaNgay,
      gioMoCua: duLieu.gioMoCua,
      gioDongCua: duLieu.gioDongCua,
    });

    const row = await this.prisma.ngay_nghi_dac_biet.update({
      where: {
        id: bigintTuChuoi(id, 'ID ngày đặc biệt'),
      },
      data: {
        ngay: dateWallClockTuNgay(duLieu.ngay),
        ten_su_kien: duLieu.tenSuKien,
        dong_cua_ca_ngay: duLieu.dongCuaCaNgay,
        gio_mo_cua: duLieu.dongCuaCaNgay
          ? null
          : dateWallClockTuGio(duLieu.gioMoCua!),
        gio_dong_cua: duLieu.dongCuaCaNgay
          ? null
          : dateWallClockTuGio(duLieu.gioDongCua!),
        ghi_chu: duLieu.ghiChu ?? null,
      },
    });

    return this.toView(row);
  }

  async xoa(id: string) {
    const hienTai = await this.layTheoId(id);
    if (!hienTai) {
      throw new LoiNghiepVuException(
        'NGAY_DAC_BIET_004',
        'Không tìm thấy ngày đặc biệt.',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.damBaoBookingNgayVanHopLe(hienTai.ngay, null);

    await this.prisma.ngay_nghi_dac_biet.delete({
      where: {
        id: bigintTuChuoi(id, 'ID ngày đặc biệt'),
      },
    });

    return { daXoa: true };
  }

  private async damBaoBookingNgayVanHopLe(
    ngay: string,
    cauHinh: {
      dongCuaCaNgay: boolean;
      gioMoCua?: string;
      gioDongCua?: string;
    } | null,
  ): Promise<void> {
    const bookings = await this.prisma.dat_ban.findMany({
      where: {
        ngay_dat: dateWallClockTuNgay(ngay),
        trang_thai: {
          in: ['CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DA_CHECK_IN'],
        },
        gio_bat_dau: {
          gt: hienTaiWallClockVietNam(),
        },
      },
      select: {
        id: true,
        gio_bat_dau: true,
        gio_ket_thuc: true,
      },
    });

    if (!bookings.length) return;

    let cacKhoang: Array<{ mo: number; dong: number }> = [];

    if (cauHinh) {
      if (!cauHinh.dongCuaCaNgay) {
        if (!cauHinh.gioMoCua || !cauHinh.gioDongCua) {
          throw new LoiNghiepVuException(
            'NGAY_DAC_BIET_006',
            'Ngày mở cửa đặc biệt phải có giờ mở và giờ đóng.',
          );
        }
        cacKhoang = [{
          mo: gioThanhPhut(cauHinh.gioMoCua),
          dong: gioThanhPhut(cauHinh.gioDongCua),
        }];
      }
    } else {
      const lichTuan = await this.prisma.gio_hoat_dong.findMany({
        where: {
          thu_trong_tuan: thuTrongTuan(ngay),
          hoat_dong: true,
        },
        orderBy: {
          ca_so: 'asc',
        },
        select: {
          gio_mo_cua: true,
          gio_dong_cua: true,
        },
      });
      cacKhoang = lichTuan.map((item) => ({
        mo: gioThanhPhut(gioTuDateWallClock(item.gio_mo_cua)),
        dong: gioThanhPhut(gioTuDateWallClock(item.gio_dong_cua)),
      }));
    }

    for (const booking of bookings) {
      const batDau = gioThanhPhut(gioTuDateWallClock(booking.gio_bat_dau));
      const ketThuc = gioThanhPhut(gioTuDateWallClock(booking.gio_ket_thuc));
      const hopLe = cacKhoang.some(
        (khoang) => batDau >= khoang.mo && ketThuc <= khoang.dong,
      );

      if (!hopLe) {
        throw new LoiNghiepVuException(
          'NGAY_DAC_BIET_008',
          `Thay đổi ngày đặc biệt sẽ làm đặt bàn ${booking.id.toString()} nằm ngoài thời gian phục vụ.`,
          HttpStatus.CONFLICT,
        );
      }
    }
  }

  private async layTheoId(id: string): Promise<NgayDacBietView | null> {
    const row = await this.prisma.ngay_nghi_dac_biet.findUnique({
      where: {
        id: bigintTuChuoi(id, 'ID ngày đặc biệt'),
      },
    });
    return row ? this.toView(row) : null;
  }

  private toView(row: {
    id: bigint;
    ngay: Date;
    ten_su_kien: string;
    dong_cua_ca_ngay: boolean;
    gio_mo_cua: Date | null;
    gio_dong_cua: Date | null;
    ghi_chu: string | null;
  }): NgayDacBietView {
    return {
      id: row.id,
      ngay: ngayTuDateWallClock(row.ngay),
      ten_su_kien: row.ten_su_kien,
      dong_cua_ca_ngay: row.dong_cua_ca_ngay,
      gio_mo_cua: row.gio_mo_cua
        ? gioTuDateWallClock(row.gio_mo_cua)
        : null,
      gio_dong_cua: row.gio_dong_cua
        ? gioTuDateWallClock(row.gio_dong_cua)
        : null,
      ghi_chu: row.ghi_chu,
    };
  }

  private kiemTra(dto: TaoNgayDacBietDto): void {
    if (!laNgayHopLe(dto.ngay)) {
      throw new LoiNghiepVuException('NGAY_DAC_BIET_005', 'Ngày không hợp lệ.');
    }

    if (!dto.dongCuaCaNgay) {
      if (!dto.gioMoCua || !dto.gioDongCua) {
        throw new LoiNghiepVuException(
          'NGAY_DAC_BIET_006',
          'Ngày mở cửa đặc biệt phải có giờ mở và giờ đóng.',
        );
      }
      if (gioThanhPhut(dto.gioDongCua) <= gioThanhPhut(dto.gioMoCua)) {
        throw new LoiNghiepVuException('NGAY_DAC_BIET_007', 'Giờ đóng cửa phải sau giờ mở cửa.');
      }
    }
  }
}
