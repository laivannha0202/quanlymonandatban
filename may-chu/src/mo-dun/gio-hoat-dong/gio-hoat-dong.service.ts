import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../co-so-du-lieu/prisma.service';
import { LoiNghiepVuException } from '../../dung-chung/exception/loi-nghiep-vu.exception';
import {
  dateWallClockTuGio,
  gioThanhPhut,
  gioTuDateWallClock,
  hienTaiWallClockVietNam,
  ngayTuDateWallClock,
  thuTrongTuan,
} from '../../dung-chung/tien-ich/ngay-gio';
import { CapNhatGioHoatDongDto } from './dto/cap-nhat-gio-hoat-dong.dto';

export interface KhoangGioHoatDong {
  id: bigint;
  thu_trong_tuan: number;
  ca_so: number;
  gio_mo_cua: string;
  gio_dong_cua: string;
  hoat_dong: number | boolean;
  ghi_chu: string | null;
}

@Injectable()
export class GioHoatDongService {
  constructor(private readonly prisma: PrismaService) {}

  async danhSach(): Promise<KhoangGioHoatDong[]> {
    const rows = await this.prisma.gio_hoat_dong.findMany({
      orderBy: [
        { thu_trong_tuan: 'asc' },
        { ca_so: 'asc' },
      ],
    });
    return rows.map((row) => this.toView(row));
  }

  async layTheoThu(thu: number): Promise<KhoangGioHoatDong[]> {
    const rows = await this.prisma.gio_hoat_dong.findMany({
      where: {
        thu_trong_tuan: thu,
        hoat_dong: true,
      },
      orderBy: {
        ca_so: 'asc',
      },
    });
    return rows.map((row) => this.toView(row));
  }

  async capNhat(dto: CapNhatGioHoatDongDto) {
    const khoa = new Set<string>();
    for (const item of dto.danhSach) {
      const key = `${item.thuTrongTuan}-${item.caSo}`;
      if (khoa.has(key)) {
        throw new LoiNghiepVuException('GIO_HOAT_DONG_001', `Trùng ca ${key}.`);
      }
      khoa.add(key);

      if (gioThanhPhut(item.gioDongCua) <= gioThanhPhut(item.gioMoCua)) {
        throw new LoiNghiepVuException(
          'GIO_HOAT_DONG_002',
          `Giờ đóng cửa phải sau giờ mở cửa ở thứ ${item.thuTrongTuan}, ca ${item.caSo}.`,
        );
      }
    }

    const hienTai = await this.danhSach();

    const banDo = new Map<
      string,
      {
        thuTrongTuan: number;
        caSo: number;
        gioMoCua: string;
        gioDongCua: string;
        hoatDong: boolean;
      }
    >();

    for (const item of hienTai) {
      const thuTrongTuan = Number(
        item.thu_trong_tuan,
      );

      const caSo = Number(item.ca_so);

      banDo.set(
        `${thuTrongTuan}-${caSo}`,
        {
          thuTrongTuan,
          caSo,
          gioMoCua: item.gio_mo_cua,
          gioDongCua: item.gio_dong_cua,
          hoatDong: Boolean(
            item.hoat_dong,
          ),
        },
      );
    }

    const cacThuThayDoi = new Set<number>();

    for (const item of dto.danhSach) {
      const key = `${item.thuTrongTuan}-${item.caSo}`;
      const cu = banDo.get(key);
      const hoatDongMoi = item.hoatDong !== false;
      if (
        !cu ||
        cu.gioMoCua !== item.gioMoCua ||
        cu.gioDongCua !== item.gioDongCua ||
        cu.hoatDong !== hoatDongMoi
      ) {
        cacThuThayDoi.add(item.thuTrongTuan);
      }

      banDo.set(
        `${item.thuTrongTuan}-${item.caSo}`,
        {
          thuTrongTuan:
            item.thuTrongTuan,

          caSo: item.caSo,

          gioMoCua:
            item.gioMoCua,

          gioDongCua:
            item.gioDongCua,

          hoatDong:
            item.hoatDong !== false,
        },
      );
    }

    for (
      let thu = 1;
      thu <= 7;
      thu += 1
    ) {
      const cacCa = [
        ...banDo.values(),
      ]
        .filter(
          (item) =>
            item.thuTrongTuan === thu &&
            item.hoatDong,
        )
        .sort(
          (a, b) =>
            gioThanhPhut(a.gioMoCua) -
            gioThanhPhut(b.gioMoCua),
        );

      for (
        let i = 1;
        i < cacCa.length;
        i += 1
      ) {
        const truoc = cacCa[i - 1];
        const sau = cacCa[i];

        if (
          gioThanhPhut(
            sau.gioMoCua,
          ) <
          gioThanhPhut(
            truoc.gioDongCua,
          )
        ) {
          throw new LoiNghiepVuException(
            'GIO_HOAT_DONG_004',
            `Các ca hoạt động thứ ${thu} bị chồng lấn: ca ${truoc.caSo} và ca ${sau.caSo}.`,
            HttpStatus.UNPROCESSABLE_ENTITY,
          );
        }
      }
    }

    await this.damBaoBookingTuongLaiVanHopLe(
      [...banDo.values()],
      cacThuThayDoi,
    );

    await this.prisma.$transaction(async (tx) => {
      for (const item of dto.danhSach) {
        const duLieu = {
          gio_mo_cua: dateWallClockTuGio(item.gioMoCua),
          gio_dong_cua: dateWallClockTuGio(item.gioDongCua),
          hoat_dong: item.hoatDong !== false,
          ghi_chu: item.ghiChu ?? null,
        };

        await tx.gio_hoat_dong.upsert({
          where: {
            thu_trong_tuan_ca_so: {
              thu_trong_tuan: item.thuTrongTuan,
              ca_so: item.caSo,
            },
          },
          create: {
            thu_trong_tuan: item.thuTrongTuan,
            ca_so: item.caSo,
            ...duLieu,
          },
          update: duLieu,
        });
      }
    });

    return this.danhSach();
  }

  private async damBaoBookingTuongLaiVanHopLe(
    lich: Array<{
      thuTrongTuan: number;
      caSo: number;
      gioMoCua: string;
      gioDongCua: string;
      hoatDong: boolean;
    }>,
    cacThuThayDoi: Set<number>,
  ): Promise<void> {
    if (!cacThuThayDoi.size) return;

    const [bookings, ngayDacBiet] = await Promise.all([
      this.prisma.dat_ban.findMany({
        where: {
          trang_thai: {
            in: ['CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DA_CHECK_IN'],
          },
          gio_bat_dau: {
            gt: hienTaiWallClockVietNam(),
          },
        },
        select: {
          id: true,
          ngay_dat: true,
          gio_bat_dau: true,
          gio_ket_thuc: true,
        },
      }),
      this.prisma.ngay_nghi_dac_biet.findMany({
        select: {
          ngay: true,
        },
      }),
    ]);

    const ngayCoCauHinhRieng = new Set(
      ngayDacBiet.map((item) => ngayTuDateWallClock(item.ngay)),
    );

    for (const booking of bookings) {
      const ngay = ngayTuDateWallClock(booking.ngay_dat);
      const thu = thuTrongTuan(ngay);

      if (
        !cacThuThayDoi.has(thu) ||
        ngayCoCauHinhRieng.has(ngay)
      ) {
        continue;
      }

      const batDau = gioThanhPhut(
        gioTuDateWallClock(booking.gio_bat_dau),
      );
      const ketThuc = gioThanhPhut(
        gioTuDateWallClock(booking.gio_ket_thuc),
      );

      const conDuocPhucVu = lich.some((item) => {
        if (!item.hoatDong || item.thuTrongTuan !== thu) return false;
        return (
          batDau >= gioThanhPhut(item.gioMoCua) &&
          ketThuc <= gioThanhPhut(item.gioDongCua)
        );
      });

      if (!conDuocPhucVu) {
        throw new LoiNghiepVuException(
          'GIO_HOAT_DONG_005',
          `Thay đổi lịch tuần sẽ làm đặt bàn ${booking.id.toString()} nằm ngoài thời gian phục vụ.`,
          HttpStatus.CONFLICT,
        );
      }
    }
  }

  private toView(row: {
    id: bigint;
    thu_trong_tuan: number;
    ca_so: number;
    gio_mo_cua: Date;
    gio_dong_cua: Date;
    hoat_dong: boolean;
    ghi_chu: string | null;
  }): KhoangGioHoatDong {
    return {
      id: row.id,
      thu_trong_tuan: row.thu_trong_tuan,
      ca_so: row.ca_so,
      gio_mo_cua: gioTuDateWallClock(row.gio_mo_cua),
      gio_dong_cua: gioTuDateWallClock(row.gio_dong_cua),
      hoat_dong: row.hoat_dong,
      ghi_chu: row.ghi_chu,
    };
  }

  async xoa(thu: number, caSo: number) {
    const hienTai = await this.danhSach();
    const tonTai = hienTai.some(
      (item) =>
        Number(item.thu_trong_tuan) === thu &&
        Number(item.ca_so) === caSo,
    );

    if (!tonTai) {
      throw new LoiNghiepVuException(
        'GIO_HOAT_DONG_003',
        'Không tìm thấy ca hoạt động.',
        HttpStatus.NOT_FOUND,
      );
    }

    const lichSauKhiXoa = hienTai
      .filter(
        (item) =>
          !(
            Number(item.thu_trong_tuan) === thu &&
            Number(item.ca_so) === caSo
          ),
      )
      .map((item) => ({
        thuTrongTuan: Number(item.thu_trong_tuan),
        caSo: Number(item.ca_so),
        gioMoCua: item.gio_mo_cua,
        gioDongCua: item.gio_dong_cua,
        hoatDong: Boolean(item.hoat_dong),
      }));

    await this.damBaoBookingTuongLaiVanHopLe(
      lichSauKhiXoa,
      new Set([thu]),
    );

    await this.prisma.gio_hoat_dong.deleteMany({
      where: {
        thu_trong_tuan: thu,
        ca_so: caSo,
      },
    });

    return { daXoa: true };
  }
}
