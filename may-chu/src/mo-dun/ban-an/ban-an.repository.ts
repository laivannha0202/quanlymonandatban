import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../co-so-du-lieu/prisma.service';
import { dateWallClockTuNgayGioSql } from '../../dung-chung/tien-ich/ngay-gio';

export interface BanKhaDung {
  id: bigint;
  ma_ban: string;
  ten_ban: string;
  khu_vuc_id: bigint;
  suc_chua: number;
  suc_chua_toi_da: number;
  trang_thai: string;
}

@Injectable()
export class BanAnRepository {
  constructor(private readonly prisma: PrismaService) {}

  async layTatCaBanCoTheDat(khuVucId?: bigint): Promise<BanKhaDung[]> {
    const khuVucHoatDong = await this.prisma.khu_vuc.findMany({
      where: {
        ngay_xoa: null,
        trang_thai: 'HOAT_DONG',
        ...(khuVucId ? { id: khuVucId } : {}),
      },
      select: { id: true },
    });

    const khuVucIds = khuVucHoatDong.map((item) => item.id);
    if (!khuVucIds.length) return [];

    return this.prisma.ban_an.findMany({
      where: {
        ngay_xoa: null,
        khu_vuc_id: { in: khuVucIds },
        trang_thai: { notIn: ['BAO_TRI', 'NGUNG_SU_DUNG'] },
      },
      select: {
        id: true,
        ma_ban: true,
        ten_ban: true,
        khu_vuc_id: true,
        suc_chua: true,
        suc_chua_toi_da: true,
        trang_thai: true,
      },
      orderBy: [{ suc_chua_toi_da: 'asc' }, { ma_ban: 'asc' }],
    });
  }

  async layIdBanDangBiChiem(
    banIds: bigint[],
    gioBatDauSql: string,
    gioKetThucSql: string,
  ): Promise<Set<string>> {
    if (!banIds.length) return new Set();

    const rows = await this.prisma.chi_tiet_dat_ban.findMany({
      where: {
        ban_an_id: {
          in: banIds,
        },
        dat_ban: {
          trang_thai: {
            in: ['CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DA_CHECK_IN'],
          },
          gio_bat_dau: {
            lt: dateWallClockTuNgayGioSql(gioKetThucSql),
          },
          gio_ket_thuc: {
            gt: dateWallClockTuNgayGioSql(gioBatDauSql),
          },
        },
      },
      distinct: ['ban_an_id'],
      select: {
        ban_an_id: true,
      },
    });

    return new Set(rows.map((row) => row.ban_an_id.toString()));
  }
}
