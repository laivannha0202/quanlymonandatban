import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../co-so-du-lieu/prisma.service';
import { LoiNghiepVuException } from '../../dung-chung/exception/loi-nghiep-vu.exception';
import { taoDuongDan } from '../../dung-chung/tien-ich/duong-dan';
import { bigintTuChuoi } from '../../dung-chung/tien-ich/id';
import type { NguoiDungXacThuc } from '../../dung-chung/types/nguoi-dung-xac-thuc.type';
import { NhatKyService } from '../nhat-ky/nhat-ky.service';
import { CapNhatHinhAnhMonDto } from './dto/cap-nhat-hinh-anh-mon.dto';
import { CapNhatMonAnDto } from './dto/cap-nhat-mon-an.dto';
import { DanhSachMonAnDto } from './dto/danh-sach-mon-an.dto';
import { TaoHinhAnhMonDto } from './dto/tao-hinh-anh-mon.dto';
import { TaoMonAnDto } from './dto/tao-mon-an.dto';

interface TongSoDong { tong: bigint | number | string }
interface IdDong { id: bigint }

export interface MonAnChiTietRaw extends Record<string, unknown> {
  id: bigint | number | string;
  ma_mon: string;
  ten_mon: string;
  duong_dan: string;
  gia: number | string;
  gia_khuyen_mai: number | string | null;
}

export interface MonAnChiTiet extends MonAnChiTietRaw {
  hinhAnh: Record<string, unknown>[];
}

@Injectable()
export class MonAnService {
  constructor(private readonly prisma: PrismaService, private readonly nhatKy: NhatKyService) {}

  async danhSachCongKhai(dto: DanhSachMonAnDto) {
    return this.danhSachNoiBo(dto, true);
  }

  async danhSachQuanTri(dto: DanhSachMonAnDto) {
    return this.danhSachNoiBo(dto, false);
  }

  private async danhSachNoiBo(dto: DanhSachMonAnDto, congKhai: boolean) {
    const dieuKien = ['ma.ngay_xoa IS NULL', 'dm.ngay_xoa IS NULL'];
    const thamSo: unknown[] = [];
    if (congKhai) {
      dieuKien.push("ma.trang_thai = 'HOAT_DONG'", "dm.trang_thai = 'HOAT_DONG'");
    } else if (dto.trangThai) {
      dieuKien.push('ma.trang_thai = ?');
      thamSo.push(dto.trangThai);
    }
    if (dto.danhMucId) {
      dieuKien.push('ma.danh_muc_id = ?');
      thamSo.push(bigintTuChuoi(dto.danhMucId, 'ID danh mục món'));
    }
    if (dto.conMon !== undefined) {
      dieuKien.push('ma.con_mon = ?');
      thamSo.push(dto.conMon === 'true' ? 1 : 0);
    }
    if (dto.noiBat !== undefined) {
      dieuKien.push('ma.la_mon_noi_bat = ?');
      thamSo.push(dto.noiBat === 'true' ? 1 : 0);
    }
    if (dto.tuKhoa?.trim()) {
      const q = `%${dto.tuKhoa.trim()}%`;
      dieuKien.push('(ma.ten_mon LIKE ? OR ma.ma_mon LIKE ? OR ma.mo_ta LIKE ?)');
      thamSo.push(q, q, q);
    }
    const where = dieuKien.join(' AND ');
    const offset = (dto.trang - 1) * dto.kichThuoc;

    const [danhSach, tongRows] = await Promise.all([
      this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `SELECT ma.id, ma.ma_mon, ma.danh_muc_id, dm.ten_danh_muc, dm.duong_dan AS duong_dan_danh_muc,
                ma.ten_mon, ma.duong_dan, ma.mo_ta,
                CAST(ma.gia AS DOUBLE) AS gia,
                CAST(ma.gia_khuyen_mai AS DOUBLE) AS gia_khuyen_mai,
                ma.hinh_anh_chinh, ma.la_mon_noi_bat, ma.con_mon, ma.trang_thai,
                ma.ngay_tao, ma.ngay_cap_nhat
         FROM mon_an ma
         INNER JOIN danh_muc_mon dm ON dm.id = ma.danh_muc_id
         WHERE ${where}
         ORDER BY ma.la_mon_noi_bat DESC, ma.ten_mon
         LIMIT ? OFFSET ?`,
        ...thamSo,
        dto.kichThuoc,
        offset,
      ),
      this.prisma.$queryRawUnsafe<TongSoDong[]>(
        `SELECT COUNT(*) AS tong FROM mon_an ma INNER JOIN danh_muc_mon dm ON dm.id = ma.danh_muc_id WHERE ${where}`,
        ...thamSo,
      ),
    ]);
    const tong = Number(tongRows[0]?.tong ?? 0);
    return { danhSach, phanTrang: { trang: dto.trang, kichThuoc: dto.kichThuoc, tong, tongTrang: Math.ceil(tong / dto.kichThuoc) } };
  }

  async chiTietQuanTri(id: string) {
    return this.chiTietTheoDieuKien('ma.id = ?', [bigintTuChuoi(id, 'ID món ăn')], false);
  }

  async chiTietCongKhai(duongDan: string) {
    return this.chiTietTheoDieuKien('ma.duong_dan = ?', [duongDan], true);
  }

  private async chiTietTheoDieuKien(
    dieuKien: string,
    thamSo: unknown[],
    congKhai: boolean,
  ): Promise<MonAnChiTiet> {
    const rows = await this.prisma.$queryRawUnsafe<MonAnChiTietRaw[]>(
      `SELECT ma.id, ma.ma_mon, ma.danh_muc_id, dm.ten_danh_muc, dm.duong_dan AS duong_dan_danh_muc,
              ma.ten_mon, ma.duong_dan, ma.mo_ta,
              CAST(ma.gia AS DOUBLE) AS gia,
              CAST(ma.gia_khuyen_mai AS DOUBLE) AS gia_khuyen_mai,
              ma.hinh_anh_chinh, ma.la_mon_noi_bat, ma.con_mon, ma.trang_thai,
              ma.ngay_tao, ma.ngay_cap_nhat
       FROM mon_an ma
       INNER JOIN danh_muc_mon dm ON dm.id = ma.danh_muc_id
       WHERE ${dieuKien} AND ma.ngay_xoa IS NULL AND dm.ngay_xoa IS NULL
         ${congKhai ? "AND ma.trang_thai = 'HOAT_DONG' AND dm.trang_thai = 'HOAT_DONG'" : ''}
       LIMIT 1`,
      ...thamSo,
    );
    if (!rows[0]) throw new LoiNghiepVuException('MON_AN_001', 'Không tìm thấy món ăn.', HttpStatus.NOT_FOUND);
    const hinhAnh = await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      'SELECT id, mon_an_id, duong_dan_anh, alt_text, thu_tu, la_anh_chinh, ngay_tao FROM hinh_anh_mon WHERE mon_an_id = ? ORDER BY la_anh_chinh DESC, thu_tu, id',
      BigInt(String(rows[0].id)),
    );
    return { ...rows[0], hinhAnh };
  }

  async tao(dto: TaoMonAnDto, nguoiDung: NguoiDungXacThuc, maYeuCau?: string | null) {
    const danhMucId = bigintTuChuoi(dto.danhMucId, 'ID danh mục món');
    await this.damBaoDanhMuc(danhMucId);
    this.kiemTraGia(dto.gia, dto.giaKhuyenMai);
    const duongDan = dto.duongDan?.trim() || taoDuongDan(dto.tenMon);
    await this.damBaoKhongTrung(dto.maMon, duongDan);

    const monAnId = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `INSERT INTO mon_an
         (ma_mon, danh_muc_id, ten_mon, duong_dan, mo_ta, gia, gia_khuyen_mai, hinh_anh_chinh, la_mon_noi_bat, con_mon, trang_thai)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        dto.maMon,
        danhMucId,
        dto.tenMon,
        duongDan,
        dto.moTa ?? null,
        dto.gia,
        dto.giaKhuyenMai ?? null,
        dto.hinhAnhChinh ?? null,
        dto.laMonNoiBat ? 1 : 0,
        dto.conMon === false ? 0 : 1,
        dto.trangThai ?? 'HOAT_DONG',
      );

      const [row] = await tx.$queryRawUnsafe<IdDong[]>(
        'SELECT LAST_INSERT_ID() AS id',
      );

      return row.id;
    });

    const moi = await this.chiTietQuanTri(monAnId.toString());

    await this.nhatKy.ghiNhan({
      taiKhoanId: nguoiDung.taiKhoanId,
      hanhDong: 'TAO_MON_AN',
      doiTuong: 'MON_AN',
      doiTuongId: monAnId.toString(),
      duLieuMoi: moi,
      maYeuCau,
    });

    return moi;
  }

  async capNhat(id: string, dto: CapNhatMonAnDto, nguoiDung: NguoiDungXacThuc, maYeuCau?: string | null) {
    const cu = await this.chiTietQuanTri(id);
    const monAnId = bigintTuChuoi(id, 'ID món ăn');
    if (dto.danhMucId !== undefined) await this.damBaoDanhMuc(bigintTuChuoi(dto.danhMucId, 'ID danh mục món'));

    const giaMoi = dto.gia ?? Number(cu.gia);
    const giaKhuyenMaiMoi = dto.giaKhuyenMai !== undefined ? dto.giaKhuyenMai : cu.gia_khuyen_mai == null ? undefined : Number(cu.gia_khuyen_mai);
    this.kiemTraGia(giaMoi, giaKhuyenMaiMoi);

    const duongDanMoi = dto.duongDan !== undefined
      ? (dto.duongDan.trim() || taoDuongDan(dto.tenMon ?? String(cu.ten_mon)))
      : undefined;

    if (dto.maMon !== undefined || duongDanMoi !== undefined) {
      const maMon = dto.maMon ?? String(cu.ma_mon);
      const duongDan = duongDanMoi ?? String(cu.duong_dan);
      const trung = await this.prisma.$queryRawUnsafe<IdDong[]>(
        'SELECT id FROM mon_an WHERE id <> ? AND (ma_mon = ? OR duong_dan = ?) LIMIT 1',
        monAnId,
        maMon,
        duongDan,
      );
      if (trung.length) throw new LoiNghiepVuException('MON_AN_002', 'Mã món hoặc đường dẫn đã tồn tại.', HttpStatus.CONFLICT);
    }

    const capNhat: Array<[string, unknown]> = [];
    if (dto.maMon !== undefined) capNhat.push(['ma_mon', dto.maMon]);
    if (dto.danhMucId !== undefined) capNhat.push(['danh_muc_id', bigintTuChuoi(dto.danhMucId, 'ID danh mục món')]);
    if (dto.tenMon !== undefined) capNhat.push(['ten_mon', dto.tenMon]);
    if (duongDanMoi !== undefined) capNhat.push(['duong_dan', duongDanMoi]);
    if (dto.moTa !== undefined) capNhat.push(['mo_ta', dto.moTa]);
    if (dto.gia !== undefined) capNhat.push(['gia', dto.gia]);
    if (dto.giaKhuyenMai !== undefined) capNhat.push(['gia_khuyen_mai', dto.giaKhuyenMai]);
    if (dto.hinhAnhChinh !== undefined) capNhat.push(['hinh_anh_chinh', dto.hinhAnhChinh]);
    if (dto.laMonNoiBat !== undefined) capNhat.push(['la_mon_noi_bat', dto.laMonNoiBat ? 1 : 0]);
    if (dto.conMon !== undefined) capNhat.push(['con_mon', dto.conMon ? 1 : 0]);
    if (dto.trangThai !== undefined) capNhat.push(['trang_thai', dto.trangThai]);
    if (capNhat.length) await this.prisma.$executeRawUnsafe(`UPDATE mon_an SET ${capNhat.map(([c]) => `${c} = ?`).join(', ')} WHERE id = ? AND ngay_xoa IS NULL`, ...capNhat.map(([,v]) => v), monAnId);

    const moi = await this.chiTietQuanTri(id);
    await this.nhatKy.ghiNhan({ taiKhoanId: nguoiDung.taiKhoanId, hanhDong: 'CAP_NHAT_MON_AN', doiTuong: 'MON_AN', doiTuongId: id, duLieuCu: cu, duLieuMoi: moi, maYeuCau });
    return moi;
  }

  async xoa(id: string, nguoiDung: NguoiDungXacThuc, maYeuCau?: string | null) {
    const cu = await this.chiTietQuanTri(id);
    await this.prisma.$executeRawUnsafe("UPDATE mon_an SET ngay_xoa = NOW(3), trang_thai = 'NGUNG_HOAT_DONG', con_mon = 0 WHERE id = ?", bigintTuChuoi(id, 'ID món ăn'));
    await this.nhatKy.ghiNhan({ taiKhoanId: nguoiDung.taiKhoanId, hanhDong: 'XOA_MON_AN', doiTuong: 'MON_AN', doiTuongId: id, duLieuCu: cu, maYeuCau });
    return { daXoa: true };
  }

  async themHinhAnh(monAnIdChuoi: string, dto: TaoHinhAnhMonDto, nguoiDung: NguoiDungXacThuc, maYeuCau?: string | null) {
    await this.chiTietQuanTri(monAnIdChuoi);
    const monAnId = bigintTuChuoi(monAnIdChuoi, 'ID món ăn');
    let hinhId = 0n;
    await this.prisma.$transaction(async (tx) => {
      if (dto.laAnhChinh) await tx.$executeRawUnsafe('UPDATE hinh_anh_mon SET la_anh_chinh = 0 WHERE mon_an_id = ?', monAnId);
      await tx.$executeRawUnsafe(
        'INSERT INTO hinh_anh_mon (mon_an_id, duong_dan_anh, alt_text, thu_tu, la_anh_chinh) VALUES (?, ?, ?, ?, ?)',
        monAnId,
        dto.duongDanAnh,
        dto.altText ?? null,
        dto.thuTu ?? 0,
        dto.laAnhChinh ? 1 : 0,
      );
      const [row] = await tx.$queryRawUnsafe<IdDong[]>('SELECT LAST_INSERT_ID() AS id');
      hinhId = row.id;
      if (dto.laAnhChinh) await tx.$executeRawUnsafe('UPDATE mon_an SET hinh_anh_chinh = ? WHERE id = ?', dto.duongDanAnh, monAnId);
    });
    await this.nhatKy.ghiNhan({ taiKhoanId: nguoiDung.taiKhoanId, hanhDong: 'THEM_HINH_ANH_MON', doiTuong: 'HINH_ANH_MON', doiTuongId: hinhId.toString(), duLieuMoi: dto, maYeuCau });
    return this.chiTietQuanTri(monAnIdChuoi);
  }

  async capNhatHinhAnh(monAnIdChuoi: string, hinhIdChuoi: string, dto: CapNhatHinhAnhMonDto, nguoiDung: NguoiDungXacThuc, maYeuCau?: string | null) {
    const monAnId = bigintTuChuoi(monAnIdChuoi, 'ID món ăn');
    const hinhId = bigintTuChuoi(hinhIdChuoi, 'ID hình ảnh');
    await this.chiTietQuanTri(monAnIdChuoi);
    const [hienTai] = await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>('SELECT * FROM hinh_anh_mon WHERE id = ? AND mon_an_id = ? LIMIT 1', hinhId, monAnId);
    if (!hienTai) throw new LoiNghiepVuException('MON_AN_003', 'Không tìm thấy hình ảnh món.', HttpStatus.NOT_FOUND);

    await this.prisma.$transaction(async (tx) => {
      if (dto.laAnhChinh) await tx.$executeRawUnsafe('UPDATE hinh_anh_mon SET la_anh_chinh = 0 WHERE mon_an_id = ?', monAnId);
      const capNhat: Array<[string, unknown]> = [];
      if (dto.duongDanAnh !== undefined) capNhat.push(['duong_dan_anh', dto.duongDanAnh]);
      if (dto.altText !== undefined) capNhat.push(['alt_text', dto.altText]);
      if (dto.thuTu !== undefined) capNhat.push(['thu_tu', dto.thuTu]);
      if (dto.laAnhChinh !== undefined) capNhat.push(['la_anh_chinh', dto.laAnhChinh ? 1 : 0]);
      if (capNhat.length) await tx.$executeRawUnsafe(`UPDATE hinh_anh_mon SET ${capNhat.map(([c]) => `${c} = ?`).join(', ')} WHERE id = ? AND mon_an_id = ?`, ...capNhat.map(([,v]) => v), hinhId, monAnId);
      if (dto.laAnhChinh) await tx.$executeRawUnsafe('UPDATE mon_an SET hinh_anh_chinh = ? WHERE id = ?', dto.duongDanAnh ?? String(hienTai.duong_dan_anh), monAnId);
    });
    await this.nhatKy.ghiNhan({ taiKhoanId: nguoiDung.taiKhoanId, hanhDong: 'CAP_NHAT_HINH_ANH_MON', doiTuong: 'HINH_ANH_MON', doiTuongId: hinhIdChuoi, duLieuCu: hienTai, duLieuMoi: dto, maYeuCau });
    return this.chiTietQuanTri(monAnIdChuoi);
  }

  async xoaHinhAnh(monAnIdChuoi: string, hinhIdChuoi: string, nguoiDung: NguoiDungXacThuc, maYeuCau?: string | null) {
    const monAnId = bigintTuChuoi(monAnIdChuoi, 'ID món ăn');
    const hinhId = bigintTuChuoi(hinhIdChuoi, 'ID hình ảnh');
    const [hinh] = await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>('SELECT * FROM hinh_anh_mon WHERE id = ? AND mon_an_id = ? LIMIT 1', hinhId, monAnId);
    if (!hinh) throw new LoiNghiepVuException('MON_AN_003', 'Không tìm thấy hình ảnh món.', HttpStatus.NOT_FOUND);
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe('DELETE FROM hinh_anh_mon WHERE id = ? AND mon_an_id = ?', hinhId, monAnId);
      if (Boolean(hinh.la_anh_chinh)) {
        const [anhMoi] = await tx.$queryRawUnsafe<Array<{ duong_dan_anh: string; id: bigint }>>('SELECT id, duong_dan_anh FROM hinh_anh_mon WHERE mon_an_id = ? ORDER BY thu_tu, id LIMIT 1', monAnId);
        if (anhMoi) {
          await tx.$executeRawUnsafe('UPDATE hinh_anh_mon SET la_anh_chinh = 1 WHERE id = ?', anhMoi.id);
          await tx.$executeRawUnsafe('UPDATE mon_an SET hinh_anh_chinh = ? WHERE id = ?', anhMoi.duong_dan_anh, monAnId);
        } else {
          await tx.$executeRawUnsafe('UPDATE mon_an SET hinh_anh_chinh = NULL WHERE id = ?', monAnId);
        }
      }
    });
    await this.nhatKy.ghiNhan({ taiKhoanId: nguoiDung.taiKhoanId, hanhDong: 'XOA_HINH_ANH_MON', doiTuong: 'HINH_ANH_MON', doiTuongId: hinhIdChuoi, duLieuCu: hinh, maYeuCau });
    return this.chiTietQuanTri(monAnIdChuoi);
  }

  private async damBaoDanhMuc(id: bigint) {
    const row = await this.prisma.$queryRawUnsafe<IdDong[]>('SELECT id FROM danh_muc_mon WHERE id = ? AND ngay_xoa IS NULL LIMIT 1', id);
    if (!row.length) throw new LoiNghiepVuException('DANH_MUC_MON_001', 'Danh mục món không tồn tại.', HttpStatus.BAD_REQUEST);
  }

  private async damBaoKhongTrung(maMon: string, duongDan: string) {
    const trung = await this.prisma.$queryRawUnsafe<IdDong[]>('SELECT id FROM mon_an WHERE (ma_mon = ? OR duong_dan = ?) LIMIT 1', maMon, duongDan);
    if (trung.length) throw new LoiNghiepVuException('MON_AN_002', 'Mã món hoặc đường dẫn đã tồn tại.', HttpStatus.CONFLICT);
  }

  private kiemTraGia(gia: number, giaKhuyenMai?: number) {
    if (giaKhuyenMai !== undefined && giaKhuyenMai > gia) throw new LoiNghiepVuException('MON_AN_004', 'Giá khuyến mãi không được lớn hơn giá gốc.', HttpStatus.BAD_REQUEST);
  }
}
