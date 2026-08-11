import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../co-so-du-lieu/prisma.service';
import { LoiNghiepVuException } from '../../dung-chung/exception/loi-nghiep-vu.exception';
import { gioThanhPhut } from '../../dung-chung/tien-ich/ngay-gio';
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
    return this.prisma.$queryRawUnsafe<KhoangGioHoatDong[]>(`
      SELECT
        id,
        thu_trong_tuan,
        ca_so,
        TIME_FORMAT(gio_mo_cua, '%H:%i') AS gio_mo_cua,
        TIME_FORMAT(gio_dong_cua, '%H:%i') AS gio_dong_cua,
        hoat_dong,
        ghi_chu
      FROM gio_hoat_dong
      ORDER BY thu_trong_tuan ASC, ca_so ASC
    `);
  }

  async layTheoThu(thu: number): Promise<KhoangGioHoatDong[]> {
    return this.prisma.$queryRawUnsafe<KhoangGioHoatDong[]>(`
      SELECT
        id,
        thu_trong_tuan,
        ca_so,
        TIME_FORMAT(gio_mo_cua, '%H:%i') AS gio_mo_cua,
        TIME_FORMAT(gio_dong_cua, '%H:%i') AS gio_dong_cua,
        hoat_dong,
        ghi_chu
      FROM gio_hoat_dong
      WHERE thu_trong_tuan = ? AND hoat_dong = 1
      ORDER BY ca_so ASC
    `, thu);
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

    for (const item of dto.danhSach) {
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

    await this.prisma.$transaction(async (tx) => {
      for (const item of dto.danhSach) {
        await tx.$executeRawUnsafe(
          `INSERT INTO gio_hoat_dong
            (thu_trong_tuan, ca_so, gio_mo_cua, gio_dong_cua, hoat_dong, ghi_chu)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             gio_mo_cua = VALUES(gio_mo_cua),
             gio_dong_cua = VALUES(gio_dong_cua),
             hoat_dong = VALUES(hoat_dong),
             ghi_chu = VALUES(ghi_chu)`,
          item.thuTrongTuan,
          item.caSo,
          `${item.gioMoCua}:00`,
          `${item.gioDongCua}:00`,
          item.hoatDong === false ? 0 : 1,
          item.ghiChu ?? null,
        );
      }
    });

    return this.danhSach();
  }

  async xoa(thu: number, caSo: number) {
    const ketQua = await this.prisma.gio_hoat_dong.deleteMany({
      where: { thu_trong_tuan: thu, ca_so: caSo },
    });
    if (!ketQua.count) {
      throw new LoiNghiepVuException(
        'GIO_HOAT_DONG_003',
        'Không tìm thấy ca hoạt động.',
        HttpStatus.NOT_FOUND,
      );
    }
    return { daXoa: true };
  }
}
