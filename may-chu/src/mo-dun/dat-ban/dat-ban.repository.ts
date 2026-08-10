import { HttpStatus, Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client';
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
    const ids = [...new Map(banIds.map((id) => [id.toString(), id])).values()].sort((a, b) => (a < b ? -1 : 1));
    if (!ids.length || ids.length > 2) {
      throw new LoiNghiepVuException('DAT_BAN_012', 'Mỗi lượt đặt hiện hỗ trợ từ 1 đến 2 bàn.', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const placeholders = ids.map(() => '?').join(', ');
    const banRaw = await tx.$queryRawUnsafe<
      Array<{
        id: bigint;
        ma_ban: string;
        ten_ban: string;
        khu_vuc_id: bigint;
        suc_chua: number | bigint;
        suc_chua_toi_da: number | bigint;
        trang_thai: string;
      }>
    >(
      `SELECT ba.id, ba.ma_ban, ba.ten_ban, ba.khu_vuc_id, ba.suc_chua, ba.suc_chua_toi_da, ba.trang_thai
       FROM ban_an ba
       INNER JOIN khu_vuc kv ON kv.id = ba.khu_vuc_id
       WHERE ba.id IN (${placeholders})
         AND ba.ngay_xoa IS NULL
         AND kv.ngay_xoa IS NULL
         AND kv.trang_thai = 'HOAT_DONG'
       ORDER BY ba.id
       FOR UPDATE`,
      ...ids,
    );

    const ban: BanBiKhoa[] = banRaw.map((item) => ({
      ...item,
      suc_chua: Number(item.suc_chua),
      suc_chua_toi_da: Number(item.suc_chua_toi_da),
    }));

    if (ban.length !== ids.length) {
      throw new LoiNghiepVuException('BAN_AN_001', 'Một hoặc nhiều bàn không tồn tại hoặc khu vực đã ngừng hoạt động.', HttpStatus.NOT_FOUND);
    }
    if (ban.some((item) => ['BAO_TRI', 'NGUNG_SU_DUNG'].includes(item.trang_thai))) {
      throw new LoiNghiepVuException('BAN_AN_002', 'Một hoặc nhiều bàn đang bảo trì hoặc ngừng sử dụng.', HttpStatus.CONFLICT);
    }

    if (ban.length === 2) {
      if (ban[0].khu_vuc_id !== ban[1].khu_vuc_id) {
        throw new LoiNghiepVuException('DAT_BAN_013', 'Hai bàn ghép phải cùng khu vực.', HttpStatus.UNPROCESSABLE_ENTITY);
      }
      const lienKet = await tx.lien_ket_ban.findFirst({
        where: {
          OR: [
            { ban_1_id: ban[0].id, ban_2_id: ban[1].id },
            { ban_1_id: ban[1].id, ban_2_id: ban[0].id },
          ],
          co_the_ghep: true,
        },
        select: { id: true },
      });
      if (!lienKet) {
        throw new LoiNghiepVuException('DAT_BAN_014', 'Hai bàn đã chọn không được cấu hình để ghép với nhau.', HttpStatus.UNPROCESSABLE_ENTITY);
      }
    }

    const tongToiDa = ban.reduce((tong, item) => tong + item.suc_chua_toi_da, 0);
    if (tongToiDa < soNguoi) {
      throw new LoiNghiepVuException('DAT_BAN_009', 'Bàn đã chọn không đủ sức chứa.', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const loaiTru = loaiTruDatBanId ? 'AND db.id <> ?' : '';
    const thamSoLoaiTru = loaiTruDatBanId ? [loaiTruDatBanId] : [];
    const trung = await tx.$queryRawUnsafe<Array<{ id: bigint; ma_dat_ban: string; ban_an_id: bigint }>>(
      `SELECT db.id, db.ma_dat_ban, ctdb.ban_an_id
       FROM chi_tiet_dat_ban ctdb
       INNER JOIN dat_ban db ON db.id = ctdb.dat_ban_id
       WHERE ctdb.ban_an_id IN (${placeholders})
         AND db.trang_thai IN ('CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DA_CHECK_IN')
         AND db.gio_bat_dau < ?
         AND db.gio_ket_thuc > ?
         ${loaiTru}
       LIMIT 1 FOR UPDATE`,
      ...ids,
      gioKetThucSql,
      gioBatDauSql,
      ...thamSoLoaiTru,
    );

    if (trung.length) {
      throw new LoiNghiepVuException(
        'DAT_BAN_002',
        'Một hoặc nhiều bàn vừa được khách khác đặt trong khung giờ này.',
        HttpStatus.CONFLICT,
        { maDatBanTrung: trung[0].ma_dat_ban, banAnId: trung[0].ban_an_id.toString() },
      );
    }

    return ban;
  }


  async khoaDatBan(tx: Prisma.TransactionClient, id: bigint): Promise<DatBanCoBan | null> {
    const rows = await tx.$queryRawUnsafe<DatBanCoBan[]>(
      `SELECT db.id, db.ma_dat_ban, db.khach_hang_id, db.khu_vuc_id, db.ho_ten, db.so_dien_thoai, db.email,
              DATE_FORMAT(db.ngay_dat, '%Y-%m-%d') AS ngay_dat,
              DATE_FORMAT(db.gio_bat_dau, '%Y-%m-%d %H:%i:%s') AS gio_bat_dau,
              DATE_FORMAT(db.gio_ket_thuc, '%Y-%m-%d %H:%i:%s') AS gio_ket_thuc,
              db.so_nguoi, db.trang_thai, db.nguon_dat, db.kieu_xep_ban, db.ghi_chu_khach, db.ghi_chu_noi_bo
       FROM dat_ban db WHERE db.id = ? LIMIT 1 FOR UPDATE`,
      id,
    );
    return rows[0] ?? null;
  }

  async layChiTietTheoId(id: bigint): Promise<DatBanCoBan | null> {
    const rows = await this.prisma.$queryRawUnsafe<DatBanCoBan[]>(
      `SELECT db.id, db.ma_dat_ban, db.khach_hang_id, db.khu_vuc_id, db.ho_ten, db.so_dien_thoai, db.email,
              DATE_FORMAT(db.ngay_dat, '%Y-%m-%d') AS ngay_dat,
              DATE_FORMAT(db.gio_bat_dau, '%Y-%m-%d %H:%i:%s') AS gio_bat_dau,
              DATE_FORMAT(db.gio_ket_thuc, '%Y-%m-%d %H:%i:%s') AS gio_ket_thuc,
              db.so_nguoi, db.trang_thai, db.nguon_dat, db.kieu_xep_ban, db.ghi_chu_khach, db.ghi_chu_noi_bo
       FROM dat_ban db WHERE db.id = ? LIMIT 1`,
      id,
    );
    return rows[0] ?? null;
  }

  async layChiTietDayDu(id: bigint) {
    const datBan = await this.layChiTietTheoId(id);
    if (!datBan) return null;

    const [banAns, lichSu] = await Promise.all([
      this.prisma.$queryRawUnsafe<Array<{ id: bigint; ma_ban: string; ten_ban: string; ten_khu_vuc: string; suc_chua: number; suc_chua_toi_da: number }>>(
        `SELECT ba.id, ba.ma_ban, ba.ten_ban, kv.ten_khu_vuc, ba.suc_chua, ba.suc_chua_toi_da
         FROM chi_tiet_dat_ban ctdb
         INNER JOIN ban_an ba ON ba.id = ctdb.ban_an_id
         INNER JOIN khu_vuc kv ON kv.id = ba.khu_vuc_id
         WHERE ctdb.dat_ban_id = ? ORDER BY ba.ma_ban`, id,
      ),
      this.prisma.$queryRawUnsafe<Array<{ id: bigint; trang_thai_cu: string | null; trang_thai_moi: string; hanh_dong: string; ghi_chu: string | null; thoi_gian: Date; nguoi_thuc_hien_id: bigint | null }>>(
        `SELECT id, trang_thai_cu, trang_thai_moi, hanh_dong, ghi_chu, thoi_gian, nguoi_thuc_hien_id
         FROM lich_su_dat_ban WHERE dat_ban_id = ? ORDER BY thoi_gian ASC, id ASC`, id,
      ),
    ]);
    return { ...datBan, banAns, lichSu };
  }

  async traCuu(maDatBan: string, soDienThoai: string) {
    const rows = await this.prisma.$queryRawUnsafe<Array<{ id: bigint }>>(
      `SELECT id FROM dat_ban WHERE ma_dat_ban = ? AND so_dien_thoai = ? LIMIT 1`, maDatBan, soDienThoai,
    );
    return rows[0] ? this.layChiTietDayDu(rows[0].id) : null;
  }

  async danhSachQuanTri(dto: DanhSachDatBanDto) {
    const where: string[] = ['1=1'];
    const params: unknown[] = [];
    if (dto.tuKhoa) {
      where.push('(db.ma_dat_ban LIKE ? OR db.ho_ten LIKE ? OR db.so_dien_thoai LIKE ? OR db.email LIKE ?)');
      const q = `%${dto.tuKhoa}%`; params.push(q, q, q, q);
    }
    if (dto.trangThai) { where.push('db.trang_thai = ?'); params.push(dto.trangThai); }
    if (dto.ngay) { where.push('db.ngay_dat = ?'); params.push(dto.ngay); }
    if (dto.khuVucId) { where.push('db.khu_vuc_id = ?'); params.push(bigintTuChuoi(dto.khuVucId)); }
    if (dto.nguonDat) { where.push('db.nguon_dat = ?'); params.push(dto.nguonDat); }

    const [{ tong }] = await this.prisma.$queryRawUnsafe<Array<{ tong: bigint }>>(
      `SELECT COUNT(*) AS tong FROM dat_ban db WHERE ${where.join(' AND ')}`, ...params,
    );
    const offset = (dto.trang - 1) * dto.kichThuoc;
    const duLieu = await this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT db.id, db.ma_dat_ban, db.ho_ten, db.so_dien_thoai, db.email,
              DATE_FORMAT(db.ngay_dat, '%Y-%m-%d') AS ngay_dat,
              DATE_FORMAT(db.gio_bat_dau, '%H:%i') AS gio_bat_dau,
              DATE_FORMAT(db.gio_ket_thuc, '%H:%i') AS gio_ket_thuc,
              db.so_nguoi, db.trang_thai, db.nguon_dat, kv.ten_khu_vuc,
              GROUP_CONCAT(ba.ma_ban ORDER BY ba.ma_ban SEPARATOR ', ') AS danh_sach_ma_ban
       FROM dat_ban db
       LEFT JOIN khu_vuc kv ON kv.id = db.khu_vuc_id
       LEFT JOIN chi_tiet_dat_ban ctdb ON ctdb.dat_ban_id = db.id
       LEFT JOIN ban_an ba ON ba.id = ctdb.ban_an_id
       WHERE ${where.join(' AND ')}
       GROUP BY db.id, db.ma_dat_ban, db.ho_ten, db.so_dien_thoai, db.email, db.ngay_dat, db.gio_bat_dau,
                db.gio_ket_thuc, db.so_nguoi, db.trang_thai, db.nguon_dat, kv.ten_khu_vuc
       ORDER BY db.gio_bat_dau DESC
       LIMIT ${dto.kichThuoc} OFFSET ${offset}`,
      ...params,
    );
    const tongSo = Number(tong);
    return { danhSach: duLieu, phanTrang: { trang: dto.trang, kichThuoc: dto.kichThuoc, tong: tongSo, tongTrang: Math.ceil(tongSo / dto.kichThuoc) } };
  }

  async danhSachCuaKhach(taiKhoanId: bigint, trang: number, kichThuoc: number) {
    const khach = await this.prisma.khach_hang.findUnique({ where: { tai_khoan_id: taiKhoanId }, select: { id: true } });
    if (!khach) return { danhSach: [], phanTrang: { trang, kichThuoc, tong: 0, tongTrang: 0 } };
    const [{ tong }] = await this.prisma.$queryRawUnsafe<Array<{ tong: bigint }>>('SELECT COUNT(*) AS tong FROM dat_ban WHERE khach_hang_id = ?', khach.id);
    const offset = (trang - 1) * kichThuoc;
    const duLieu = await this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT db.id, db.ma_dat_ban, DATE_FORMAT(db.ngay_dat, '%Y-%m-%d') AS ngay_dat,
              DATE_FORMAT(db.gio_bat_dau, '%H:%i') AS gio_bat_dau, DATE_FORMAT(db.gio_ket_thuc, '%H:%i') AS gio_ket_thuc,
              db.so_nguoi, db.trang_thai, GROUP_CONCAT(ba.ma_ban ORDER BY ba.ma_ban SEPARATOR ', ') AS danh_sach_ma_ban
       FROM dat_ban db
       LEFT JOIN chi_tiet_dat_ban ctdb ON ctdb.dat_ban_id = db.id
       LEFT JOIN ban_an ba ON ba.id = ctdb.ban_an_id
       WHERE db.khach_hang_id = ?
       GROUP BY db.id, db.ma_dat_ban, db.ngay_dat, db.gio_bat_dau, db.gio_ket_thuc, db.so_nguoi, db.trang_thai
       ORDER BY db.gio_bat_dau DESC LIMIT ${kichThuoc} OFFSET ${offset}`,
      khach.id,
    );
    const tongSo = Number(tong);
    return { danhSach: duLieu, phanTrang: { trang, kichThuoc, tong: tongSo, tongTrang: Math.ceil(tongSo / kichThuoc) } };
  }

  async khachSoHuuDatBan(taiKhoanId: bigint, datBanId: bigint): Promise<boolean> {
    const rows = await this.prisma.$queryRawUnsafe<Array<{ id: bigint }>>(
      `SELECT db.id FROM dat_ban db INNER JOIN khach_hang kh ON kh.id = db.khach_hang_id
       WHERE db.id = ? AND kh.tai_khoan_id = ? LIMIT 1`, datBanId, taiKhoanId,
    );
    return rows.length > 0;
  }
}
