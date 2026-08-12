import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../co-so-du-lieu/prisma.service';
import { LoiNghiepVuException } from '../../dung-chung/exception/loi-nghiep-vu.exception';
import { bigintTuChuoi } from '../../dung-chung/tien-ich/id';
import { DanhSachDatBanDto } from './dto/danh-sach-dat-ban.dto';

export interface BanBiKhoa {
  id: bigint;
  ma_ban: string;
  ten_ban: string;
  khu_vuc_id: bigint;
  suc_chua: number;
  suc_chua_toi_da: number;
  trang_thai: string;
}

export interface DatBanCoBan {
  id: bigint;
  ma_dat_ban: string;
  khach_hang_id: bigint | null;
  khu_vuc_id: bigint | null;
  ho_ten: string;
  so_dien_thoai: string;
  email: string | null;
  ngay_dat: string;
  gio_bat_dau: string;
  gio_ket_thuc: string;
  so_nguoi: number;
  trang_thai: string;
  nguon_dat: string;
  kieu_xep_ban: string;
  ghi_chu_khach: string | null;
  ghi_chu_noi_bo: string | null;
}

interface DatBanPrismaCoBan {
  id: bigint;
  ma_dat_ban: string;
  khach_hang_id: bigint | null;
  khu_vuc_id: bigint | null;
  ho_ten: string;
  so_dien_thoai: string;
  email: string | null;
  ngay_dat: Date;
  gio_bat_dau: Date;
  gio_ket_thuc: Date;
  so_nguoi: number;
  trang_thai: string;
  nguon_dat: string;
  kieu_xep_ban: string;
  ghi_chu_khach: string | null;
  ghi_chu_noi_bo: string | null;
}

@Injectable()
export class DatBanRepository {
  constructor(private readonly prisma: PrismaService) {}

  async khoaVaKiemTraBan(
    tx: Prisma.TransactionClient,
    banIds: bigint[],
    gioBatDauSql: string,
    gioKetThucSql: string,
    soNguoi: number,
    loaiTruDatBanId?: bigint,
  ): Promise<BanBiKhoa[]> {
    const ids = [
      ...new Map(
        banIds.map((id) => [id.toString(), id]),
      ).values(),
    ].sort((a, b) => (a < b ? -1 : 1));

    if (!ids.length || ids.length > 2) {
      throw new LoiNghiepVuException(
        'DAT_BAN_012',
        'Mỗi lượt đặt hiện hỗ trợ từ 1 đến 2 bàn.',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    // Raw SQL có chủ đích: cần khóa chính các hàng bàn
    // trong transaction để chống hai request giữ cùng bàn.
    // Prisma.sql/Prisma.join bind toàn bộ ID, không nối giá trị
    // người dùng trực tiếp vào chuỗi SQL.
    const banRaw = await tx.$queryRaw<
      Array<{
        id: bigint;
        ma_ban: string;
        ten_ban: string;
        khu_vuc_id: bigint;
        suc_chua: number | bigint;
        suc_chua_toi_da: number | bigint;
        trang_thai: string;
      }>
    >(Prisma.sql`
      SELECT ba.id, ba.ma_ban, ba.ten_ban, ba.khu_vuc_id,
             ba.suc_chua, ba.suc_chua_toi_da, ba.trang_thai
      FROM ban_an ba
      INNER JOIN khu_vuc kv ON kv.id = ba.khu_vuc_id
      WHERE ba.id IN (${Prisma.join(ids)})
        AND ba.ngay_xoa IS NULL
        AND kv.ngay_xoa IS NULL
        AND kv.trang_thai = 'HOAT_DONG'
      ORDER BY ba.id
      FOR UPDATE
    `);

    const ban: BanBiKhoa[] = banRaw.map(
      (item) => ({
        ...item,
        suc_chua: Number(item.suc_chua),
        suc_chua_toi_da:
          Number(item.suc_chua_toi_da),
      }),
    );

    if (ban.length !== ids.length) {
      throw new LoiNghiepVuException(
        'BAN_AN_001',
        'Một hoặc nhiều bàn không tồn tại hoặc khu vực đã ngừng hoạt động.',
        HttpStatus.NOT_FOUND,
      );
    }

    if (
      ban.some((item) =>
        ['BAO_TRI', 'NGUNG_SU_DUNG'].includes(
          item.trang_thai,
        ),
      )
    ) {
      throw new LoiNghiepVuException(
        'BAN_AN_002',
        'Một hoặc nhiều bàn đang bảo trì hoặc ngừng sử dụng.',
        HttpStatus.CONFLICT,
      );
    }

    if (ban.length === 2) {
      if (ban[0].khu_vuc_id !== ban[1].khu_vuc_id) {
        throw new LoiNghiepVuException(
          'DAT_BAN_013',
          'Hai bàn ghép phải cùng khu vực.',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }

      const lienKet =
        await tx.lien_ket_ban.findFirst({
          where: {
            OR: [
              {
                ban_1_id: ban[0].id,
                ban_2_id: ban[1].id,
              },
              {
                ban_1_id: ban[1].id,
                ban_2_id: ban[0].id,
              },
            ],
            co_the_ghep: true,
          },
          select: { id: true },
        });

      if (!lienKet) {
        throw new LoiNghiepVuException(
          'DAT_BAN_014',
          'Hai bàn đã chọn không được cấu hình để ghép với nhau.',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
    }

    const tongToiDa = ban.reduce(
      (tong, item) =>
        tong + item.suc_chua_toi_da,
      0,
    );

    if (tongToiDa < soNguoi) {
      throw new LoiNghiepVuException(
        'DAT_BAN_009',
        'Bàn đã chọn không đủ sức chứa.',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const dieuKienLoaiTru =
      loaiTruDatBanId
        ? Prisma.sql`AND db.id <> ${loaiTruDatBanId}`
        : Prisma.sql``;

    // Raw SQL có chủ đích: kiểm tra overlap và khóa
    // booking cạnh tranh trong cùng transaction.
    const trung = await tx.$queryRaw<
      Array<{
        id: bigint;
        ma_dat_ban: string;
        ban_an_id: bigint;
      }>
    >(Prisma.sql`
      SELECT db.id, db.ma_dat_ban, ctdb.ban_an_id
      FROM chi_tiet_dat_ban ctdb
      INNER JOIN dat_ban db
        ON db.id = ctdb.dat_ban_id
      WHERE ctdb.ban_an_id IN (${Prisma.join(ids)})
        AND db.trang_thai IN (
          'CHO_XAC_NHAN',
          'DA_XAC_NHAN',
          'DA_CHECK_IN'
        )
        AND db.gio_bat_dau < ${gioKetThucSql}
        AND db.gio_ket_thuc > ${gioBatDauSql}
        ${dieuKienLoaiTru}
      LIMIT 1 FOR UPDATE
    `);

    if (trung.length) {
      throw new LoiNghiepVuException(
        'DAT_BAN_002',
        'Một hoặc nhiều bàn vừa được khách khác đặt trong khung giờ này.',
        HttpStatus.CONFLICT,
        {
          maDatBanTrung:
            trung[0].ma_dat_ban,
          banAnId:
            trung[0].ban_an_id.toString(),
        },
      );
    }

    return ban;
  }

  async khoaDatBan(
    tx: Prisma.TransactionClient,
    id: bigint,
  ): Promise<DatBanCoBan | null> {
    // Raw SQL có chủ đích: workflow trạng thái cần row lock.
    const rows =
      await tx.$queryRaw<DatBanCoBan[]>(
        Prisma.sql`
          SELECT db.id, db.ma_dat_ban, db.khach_hang_id,
                 db.khu_vuc_id, db.ho_ten, db.so_dien_thoai,
                 db.email,
                 DATE_FORMAT(
                   db.ngay_dat, '%Y-%m-%d'
                 ) AS ngay_dat,
                 DATE_FORMAT(
                   db.gio_bat_dau,
                   '%Y-%m-%d %H:%i:%s'
                 ) AS gio_bat_dau,
                 DATE_FORMAT(
                   db.gio_ket_thuc,
                   '%Y-%m-%d %H:%i:%s'
                 ) AS gio_ket_thuc,
                 db.so_nguoi, db.trang_thai, db.nguon_dat,
                 db.kieu_xep_ban, db.ghi_chu_khach,
                 db.ghi_chu_noi_bo
          FROM dat_ban db
          WHERE db.id = ${id}
          LIMIT 1
          FOR UPDATE
        `,
      );

    return rows[0] ?? null;
  }

  async layChiTietTheoId(
    id: bigint,
  ): Promise<DatBanCoBan | null> {
    const row =
      await this.prisma.dat_ban.findUnique({
        where: { id },
        select: {
          id: true,
          ma_dat_ban: true,
          khach_hang_id: true,
          khu_vuc_id: true,
          ho_ten: true,
          so_dien_thoai: true,
          email: true,
          ngay_dat: true,
          gio_bat_dau: true,
          gio_ket_thuc: true,
          so_nguoi: true,
          trang_thai: true,
          nguon_dat: true,
          kieu_xep_ban: true,
          ghi_chu_khach: true,
          ghi_chu_noi_bo: true,
        },
      });

    return row
      ? this.chuanHoaDatBanCoBan(row)
      : null;
  }

  async layChiTietDayDu(id: bigint) {
    const datBan =
      await this.layChiTietTheoId(id);

    if (!datBan) return null;

    const [chiTietBan, lichSu] =
      await Promise.all([
        this.prisma.chi_tiet_dat_ban.findMany({
          where: {
            dat_ban_id: id,
          },
          select: {
            ban_an: {
              select: {
                id: true,
                ma_ban: true,
                ten_ban: true,
                suc_chua: true,
                suc_chua_toi_da: true,
                khu_vuc: {
                  select: {
                    ten_khu_vuc: true,
                  },
                },
              },
            },
          },
        }),
        this.prisma.lich_su_dat_ban.findMany({
          where: {
            dat_ban_id: id,
          },
          orderBy: [
            { thoi_gian: 'asc' },
            { id: 'asc' },
          ],
          select: {
            id: true,
            trang_thai_cu: true,
            trang_thai_moi: true,
            hanh_dong: true,
            ghi_chu: true,
            thoi_gian: true,
            nguoi_thuc_hien_id: true,
          },
        }),
      ]);

    const banAns = chiTietBan
      .map((item) => ({
        id: item.ban_an.id,
        ma_ban: item.ban_an.ma_ban,
        ten_ban: item.ban_an.ten_ban,
        ten_khu_vuc:
          item.ban_an.khu_vuc.ten_khu_vuc,
        suc_chua: item.ban_an.suc_chua,
        suc_chua_toi_da:
          item.ban_an.suc_chua_toi_da,
      }))
      .sort((a, b) =>
        a.ma_ban.localeCompare(b.ma_ban),
      );

    return {
      ...datBan,
      banAns,
      lichSu,
    };
  }

  async traCuu(
    maDatBan: string,
    soDienThoai: string,
  ) {
    const row =
      await this.prisma.dat_ban.findFirst({
        where: {
          ma_dat_ban: maDatBan,
          so_dien_thoai: soDienThoai,
        },
        select: { id: true },
      });

    return row
      ? this.layChiTietDayDu(row.id)
      : null;
  }

  async danhSachQuanTri(
    dto: DanhSachDatBanDto,
  ) {
    const where =
      this.taoDieuKienQuanTri(dto);

    const [rows, tong] =
      await Promise.all([
        this.prisma.dat_ban.findMany({
          where,
          orderBy: {
            gio_bat_dau: 'desc',
          },
          skip:
            (dto.trang - 1) *
            dto.kichThuoc,
          take: dto.kichThuoc,
          select: {
            id: true,
            ma_dat_ban: true,
            ho_ten: true,
            so_dien_thoai: true,
            email: true,
            ngay_dat: true,
            gio_bat_dau: true,
            gio_ket_thuc: true,
            so_nguoi: true,
            trang_thai: true,
            nguon_dat: true,
            khu_vuc: {
              select: {
                ten_khu_vuc: true,
              },
            },
            chi_tiet_dat_ban: {
              select: {
                ban_an: {
                  select: {
                    ma_ban: true,
                  },
                },
              },
            },
          },
        }),
        this.prisma.dat_ban.count({
          where,
        }),
      ]);

    return {
      danhSach: rows.map((row) => ({
        id: row.id,
        ma_dat_ban: row.ma_dat_ban,
        ho_ten: row.ho_ten,
        so_dien_thoai:
          row.so_dien_thoai,
        email: row.email,
        ngay_dat:
          this.dinhDangNgay(row.ngay_dat),
        gio_bat_dau:
          this.dinhDangGio(
            row.gio_bat_dau,
          ),
        gio_ket_thuc:
          this.dinhDangGio(
            row.gio_ket_thuc,
          ),
        so_nguoi: row.so_nguoi,
        trang_thai: row.trang_thai,
        nguon_dat: row.nguon_dat,
        ten_khu_vuc:
          row.khu_vuc?.ten_khu_vuc ??
          null,
        danh_sach_ma_ban:
          this.ghepMaBan(
            row.chi_tiet_dat_ban,
          ),
      })),
      phanTrang: {
        trang: dto.trang,
        kichThuoc: dto.kichThuoc,
        tong,
        tongTrang:
          Math.ceil(
            tong / dto.kichThuoc,
          ),
      },
    };
  }

  async danhSachCuaKhach(
    taiKhoanId: bigint,
    trang: number,
    kichThuoc: number,
  ) {
    const khach =
      await this.prisma.khach_hang.findUnique({
        where: {
          tai_khoan_id: taiKhoanId,
        },
        select: { id: true },
      });

    if (!khach) {
      return {
        danhSach: [],
        phanTrang: {
          trang,
          kichThuoc,
          tong: 0,
          tongTrang: 0,
        },
      };
    }

    const where: Prisma.dat_banWhereInput = {
      khach_hang_id: khach.id,
    };

    const [rows, tong] =
      await Promise.all([
        this.prisma.dat_ban.findMany({
          where,
          orderBy: {
            gio_bat_dau: 'desc',
          },
          skip:
            (trang - 1) *
            kichThuoc,
          take: kichThuoc,
          select: {
            id: true,
            ma_dat_ban: true,
            ngay_dat: true,
            gio_bat_dau: true,
            gio_ket_thuc: true,
            so_nguoi: true,
            trang_thai: true,
            chi_tiet_dat_ban: {
              select: {
                ban_an: {
                  select: {
                    ma_ban: true,
                  },
                },
              },
            },
          },
        }),
        this.prisma.dat_ban.count({
          where,
        }),
      ]);

    return {
      danhSach: rows.map((row) => ({
        id: row.id,
        ma_dat_ban: row.ma_dat_ban,
        ngay_dat:
          this.dinhDangNgay(row.ngay_dat),
        gio_bat_dau:
          this.dinhDangGio(
            row.gio_bat_dau,
          ),
        gio_ket_thuc:
          this.dinhDangGio(
            row.gio_ket_thuc,
          ),
        so_nguoi: row.so_nguoi,
        trang_thai: row.trang_thai,
        danh_sach_ma_ban:
          this.ghepMaBan(
            row.chi_tiet_dat_ban,
          ),
      })),
      phanTrang: {
        trang,
        kichThuoc,
        tong,
        tongTrang:
          Math.ceil(tong / kichThuoc),
      },
    };
  }

  async khachSoHuuDatBan(
    taiKhoanId: bigint,
    datBanId: bigint,
  ): Promise<boolean> {
    const khach =
      await this.prisma.khach_hang.findUnique({
        where: {
          tai_khoan_id: taiKhoanId,
        },
        select: { id: true },
      });

    if (!khach) return false;

    const booking =
      await this.prisma.dat_ban.findFirst({
        where: {
          id: datBanId,
          khach_hang_id: khach.id,
        },
        select: { id: true },
      });

    return Boolean(booking);
  }

  private taoDieuKienQuanTri(
    dto: DanhSachDatBanDto,
  ): Prisma.dat_banWhereInput {
    const tuKhoa = dto.tuKhoa?.trim();

    return {
      ...(tuKhoa
        ? {
            OR: [
              {
                ma_dat_ban: {
                  contains: tuKhoa,
                },
              },
              {
                ho_ten: {
                  contains: tuKhoa,
                },
              },
              {
                so_dien_thoai: {
                  contains: tuKhoa,
                },
              },
              {
                email: {
                  contains: tuKhoa,
                },
              },
            ],
          }
        : {}),
      ...(dto.trangThai
        ? {
            trang_thai:
              dto.trangThai,
          }
        : {}),
      ...(dto.ngay
        ? {
            ngay_dat:
              new Date(
                `${dto.ngay}T00:00:00.000Z`,
              ),
          }
        : {}),
      ...(dto.khuVucId
        ? {
            khu_vuc_id:
              bigintTuChuoi(
                dto.khuVucId,
                'ID khu vực',
              ),
          }
        : {}),
      ...(dto.nguonDat
        ? {
            nguon_dat:
              dto.nguonDat,
          }
        : {}),
    };
  }

  private chuanHoaDatBanCoBan(
    row: DatBanPrismaCoBan,
  ): DatBanCoBan {
    return {
      id: row.id,
      ma_dat_ban: row.ma_dat_ban,
      khach_hang_id:
        row.khach_hang_id,
      khu_vuc_id: row.khu_vuc_id,
      ho_ten: row.ho_ten,
      so_dien_thoai:
        row.so_dien_thoai,
      email: row.email,
      ngay_dat:
        this.dinhDangNgay(row.ngay_dat),
      gio_bat_dau:
        this.dinhDangNgayGio(
          row.gio_bat_dau,
        ),
      gio_ket_thuc:
        this.dinhDangNgayGio(
          row.gio_ket_thuc,
        ),
      so_nguoi: row.so_nguoi,
      trang_thai: row.trang_thai,
      nguon_dat: row.nguon_dat,
      kieu_xep_ban:
        row.kieu_xep_ban,
      ghi_chu_khach:
        row.ghi_chu_khach,
      ghi_chu_noi_bo:
        row.ghi_chu_noi_bo,
    };
  }

  private ghepMaBan(
    items: Array<{
      ban_an: {
        ma_ban: string;
      };
    }>,
  ) {
    return items
      .map((item) => item.ban_an.ma_ban)
      .sort((a, b) =>
        a.localeCompare(b),
      )
      .join(', ');
  }

  private dinhDangNgay(value: Date) {
    return value
      .toISOString()
      .slice(0, 10);
  }

  private dinhDangGio(value: Date) {
    return value
      .toISOString()
      .slice(11, 16);
  }

  private dinhDangNgayGio(value: Date) {
    return value
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');
  }
}
