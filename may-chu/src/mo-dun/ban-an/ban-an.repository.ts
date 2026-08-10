import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../co-so-du-lieu/prisma.service';

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

    const placeholders = banIds.map(() => '?').join(', ');
    const rows = await this.prisma.$queryRawUnsafe<Array<{ ban_an_id: bigint }>>(
      `SELECT DISTINCT ctdb.ban_an_id
       FROM chi_tiet_dat_ban ctdb
       INNER JOIN dat_ban db ON db.id = ctdb.dat_ban_id
       WHERE ctdb.ban_an_id IN (${placeholders})
         AND db.trang_thai IN ('CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DA_CHECK_IN')
         AND db.gio_bat_dau < ?
         AND db.gio_ket_thuc > ?`,
      ...banIds,
      gioKetThucSql,
      gioBatDauSql,
    );

    return new Set(rows.map((row) => row.ban_an_id.toString()));
  }
}
