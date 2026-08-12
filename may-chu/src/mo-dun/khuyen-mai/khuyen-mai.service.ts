import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../co-so-du-lieu/prisma.service';
import { LoiNghiepVuException } from '../../dung-chung/exception/loi-nghiep-vu.exception';
import { bigintTuChuoi } from '../../dung-chung/tien-ich/id';
import type { NguoiDungXacThuc } from '../../dung-chung/types/nguoi-dung-xac-thuc.type';
import { NhatKyService } from '../nhat-ky/nhat-ky.service';
import { CapNhatKhuyenMaiDto } from './dto/cap-nhat-khuyen-mai.dto';
import { DanhSachKhuyenMaiDto } from './dto/danh-sach-khuyen-mai.dto';
import { TaoKhuyenMaiDto } from './dto/tao-khuyen-mai.dto';

interface IdDong { id: bigint }
interface TongSoDong { tong: bigint | number | string }

@Injectable()
export class KhuyenMaiService {
  constructor(private readonly prisma: PrismaService, private readonly nhatKy: NhatKyService) {}

  dangApDung() {
    return this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT id, ma_khuyen_mai, ten_khuyen_mai, mo_ta, loai_giam,
              CAST(gia_tri AS DOUBLE) AS gia_tri,
              CAST(gia_tri_don_toi_thieu AS DOUBLE) AS gia_tri_don_toi_thieu,
              CAST(giam_toi_da AS DOUBLE) AS giam_toi_da,
              ngay_bat_dau, ngay_ket_thuc, so_luot_toi_da, so_luot_da_dung, trang_thai
       FROM khuyen_mai
       WHERE ngay_xoa IS NULL AND trang_thai = 'HOAT_DONG'
         AND ngay_bat_dau <= NOW(3) AND ngay_ket_thuc >= NOW(3)
         AND (so_luot_toi_da IS NULL OR so_luot_da_dung < so_luot_toi_da)
       ORDER BY ngay_ket_thuc, ten_khuyen_mai`,
    );
  }

  async danhSach(dto: DanhSachKhuyenMaiDto) {
    const dieuKien = ['ngay_xoa IS NULL'];
    const thamSo: unknown[] = [];
    if (dto.trangThai) { dieuKien.push('trang_thai = ?'); thamSo.push(dto.trangThai); }
    if (dto.tuKhoa?.trim()) {
      const q = `%${dto.tuKhoa.trim()}%`;
      dieuKien.push('(ma_khuyen_mai LIKE ? OR ten_khuyen_mai LIKE ?)');
      thamSo.push(q, q);
    }
    const where = dieuKien.join(' AND ');
    const offset = (dto.trang - 1) * dto.kichThuoc;
    const [danhSach, tongRows] = await Promise.all([
      this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `SELECT id, ma_khuyen_mai, ten_khuyen_mai, mo_ta, loai_giam,
                CAST(gia_tri AS DOUBLE) AS gia_tri,
                CAST(gia_tri_don_toi_thieu AS DOUBLE) AS gia_tri_don_toi_thieu,
                CAST(giam_toi_da AS DOUBLE) AS giam_toi_da,
                ngay_bat_dau, ngay_ket_thuc, so_luot_toi_da, so_luot_da_dung, trang_thai, ngay_tao, ngay_cap_nhat
         FROM khuyen_mai WHERE ${where}
         ORDER BY ngay_tao DESC LIMIT ? OFFSET ?`,
        ...thamSo, dto.kichThuoc, offset,
      ),
      this.prisma.$queryRawUnsafe<TongSoDong[]>(`SELECT COUNT(*) AS tong FROM khuyen_mai WHERE ${where}`, ...thamSo),
    ]);
    const tong = Number(tongRows[0]?.tong ?? 0);
    return { danhSach, phanTrang: { trang: dto.trang, kichThuoc: dto.kichThuoc, tong, tongTrang: Math.ceil(tong / dto.kichThuoc) } };
  }

  async chiTiet(id: string) {
    const rows = await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT id, ma_khuyen_mai, ten_khuyen_mai, mo_ta, loai_giam,
              CAST(gia_tri AS DOUBLE) AS gia_tri,
              CAST(gia_tri_don_toi_thieu AS DOUBLE) AS gia_tri_don_toi_thieu,
              CAST(giam_toi_da AS DOUBLE) AS giam_toi_da,
              ngay_bat_dau, ngay_ket_thuc, so_luot_toi_da, so_luot_da_dung, trang_thai, ngay_tao, ngay_cap_nhat
       FROM khuyen_mai WHERE id = ? AND ngay_xoa IS NULL LIMIT 1`,
      bigintTuChuoi(id, 'ID khuyến mãi'),
    );
    if (!rows[0]) throw new LoiNghiepVuException('KHUYEN_MAI_001', 'Không tìm thấy khuyến mãi.', HttpStatus.NOT_FOUND);
    return rows[0];
  }

  async tao(dto: TaoKhuyenMaiDto, nguoiDung: NguoiDungXacThuc, maYeuCau?: string | null) {
    this.kiemTra(dto.loaiGiam, dto.giaTri, dto.ngayBatDau, dto.ngayKetThuc, dto.giamToiDa);
    const trung = await this.prisma.$queryRawUnsafe<IdDong[]>('SELECT id FROM khuyen_mai WHERE ma_khuyen_mai = ? LIMIT 1', dto.maKhuyenMai);
    if (trung.length) throw new LoiNghiepVuException('KHUYEN_MAI_002', 'Mã khuyến mãi đã tồn tại.', HttpStatus.CONFLICT);
    const khuyenMaiMoiId = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `INSERT INTO khuyen_mai
         (ma_khuyen_mai, ten_khuyen_mai, mo_ta, loai_giam, gia_tri, gia_tri_don_toi_thieu, giam_toi_da, ngay_bat_dau, ngay_ket_thuc, so_luot_toi_da, trang_thai)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        dto.maKhuyenMai,
        dto.tenKhuyenMai,
        dto.moTa ?? null,
        dto.loaiGiam,
        dto.giaTri,
        dto.giaTriDonToiThieu ?? null,
        dto.loaiGiam === 'PHAN_TRAM' ? (dto.giamToiDa ?? null) : null,
        new Date(dto.ngayBatDau),
        new Date(dto.ngayKetThuc),
        dto.soLuotToiDa ?? null,
        dto.trangThai ?? 'HOAT_DONG',
      );

      const [row] = await tx.$queryRawUnsafe<IdDong[]>(
        'SELECT LAST_INSERT_ID() AS id',
      );

      return row.id;
    });

    const moi = await this.chiTiet(khuyenMaiMoiId.toString());

    await this.nhatKy.ghiNhan({
      taiKhoanId: nguoiDung.taiKhoanId,
      hanhDong: 'TAO_KHUYEN_MAI',
      doiTuong: 'KHUYEN_MAI',
      doiTuongId: khuyenMaiMoiId.toString(),
      duLieuMoi: moi,
      maYeuCau,
    });

    return moi;
  }

  async capNhat(id: string, dto: CapNhatKhuyenMaiDto, nguoiDung: NguoiDungXacThuc, maYeuCau?: string | null) {
    const cu = await this.chiTiet(id);
    const khuyenMaiId = bigintTuChuoi(id, 'ID khuyến mãi');
    const loai = dto.loaiGiam ?? String(cu.loai_giam);
    const giaTri = dto.giaTri ?? Number(cu.gia_tri);
    const batDau = dto.ngayBatDau ?? new Date(String(cu.ngay_bat_dau)).toISOString();
    const ketThuc = dto.ngayKetThuc ?? new Date(String(cu.ngay_ket_thuc)).toISOString();
    const giamToiDa = dto.giamToiDa !== undefined ? dto.giamToiDa : cu.giam_toi_da == null ? undefined : Number(cu.giam_toi_da);
    this.kiemTra(loai, giaTri, batDau, ketThuc, giamToiDa);

    if (dto.maKhuyenMai && dto.maKhuyenMai !== cu.ma_khuyen_mai) {
      const trung = await this.prisma.$queryRawUnsafe<IdDong[]>('SELECT id FROM khuyen_mai WHERE ma_khuyen_mai = ? AND id <> ? LIMIT 1', dto.maKhuyenMai, khuyenMaiId);
      if (trung.length) throw new LoiNghiepVuException('KHUYEN_MAI_002', 'Mã khuyến mãi đã tồn tại.', HttpStatus.CONFLICT);
    }

    const capNhat: Array<[string, unknown]> = [];
    if (dto.maKhuyenMai !== undefined) capNhat.push(['ma_khuyen_mai', dto.maKhuyenMai]);
    if (dto.tenKhuyenMai !== undefined) capNhat.push(['ten_khuyen_mai', dto.tenKhuyenMai]);
    if (dto.moTa !== undefined) capNhat.push(['mo_ta', dto.moTa]);
    if (dto.loaiGiam !== undefined) capNhat.push(['loai_giam', dto.loaiGiam]);
    if (dto.giaTri !== undefined) capNhat.push(['gia_tri', dto.giaTri]);
    if (dto.giaTriDonToiThieu !== undefined) capNhat.push(['gia_tri_don_toi_thieu', dto.giaTriDonToiThieu]);
    if (dto.loaiGiam === 'SO_TIEN') capNhat.push(['giam_toi_da', null]);
    else if (dto.loaiGiam === 'SO_TIEN') capNhat.push(['giam_toi_da', null]);
    else if (dto.giamToiDa !== undefined) capNhat.push(['giam_toi_da', dto.giamToiDa]);
    if (dto.ngayBatDau !== undefined) capNhat.push(['ngay_bat_dau', new Date(dto.ngayBatDau)]);
    if (dto.ngayKetThuc !== undefined) capNhat.push(['ngay_ket_thuc', new Date(dto.ngayKetThuc)]);
    if (dto.soLuotToiDa !== undefined) capNhat.push(['so_luot_toi_da', dto.soLuotToiDa]);
    if (dto.trangThai !== undefined) capNhat.push(['trang_thai', dto.trangThai]);
    if (capNhat.length) await this.prisma.$executeRawUnsafe(`UPDATE khuyen_mai SET ${capNhat.map(([c]) => `${c} = ?`).join(', ')} WHERE id = ?`, ...capNhat.map(([,v]) => v), khuyenMaiId);
    const moi = await this.chiTiet(id);
    await this.nhatKy.ghiNhan({ taiKhoanId: nguoiDung.taiKhoanId, hanhDong: 'CAP_NHAT_KHUYEN_MAI', doiTuong: 'KHUYEN_MAI', doiTuongId: id, duLieuCu: cu, duLieuMoi: moi, maYeuCau });
    return moi;
  }

  async xoa(id: string, nguoiDung: NguoiDungXacThuc, maYeuCau?: string | null) {
    const cu = await this.chiTiet(id);
    await this.prisma.$executeRawUnsafe("UPDATE khuyen_mai SET ngay_xoa = NOW(3), trang_thai = 'NGUNG_HOAT_DONG' WHERE id = ?", bigintTuChuoi(id, 'ID khuyến mãi'));
    await this.nhatKy.ghiNhan({ taiKhoanId: nguoiDung.taiKhoanId, hanhDong: 'XOA_KHUYEN_MAI', doiTuong: 'KHUYEN_MAI', doiTuongId: id, duLieuCu: cu, maYeuCau });
    return { daXoa: true };
  }

  private kiemTra(loai: string, giaTri: number, batDau: string, ketThuc: string, giamToiDa?: number) {
    const bd = new Date(batDau).getTime();
    const kt = new Date(ketThuc).getTime();
    if (!Number.isFinite(bd) || !Number.isFinite(kt) || kt <= bd) throw new LoiNghiepVuException('KHUYEN_MAI_003', 'Thời gian khuyến mãi không hợp lệ.', HttpStatus.BAD_REQUEST);
    if (loai === 'PHAN_TRAM' && (giaTri <= 0 || giaTri > 100)) throw new LoiNghiepVuException('KHUYEN_MAI_004', 'Khuyến mãi phần trăm phải lớn hơn 0 và không quá 100.', HttpStatus.BAD_REQUEST);
    if (loai === 'SO_TIEN' && giaTri <= 0) throw new LoiNghiepVuException('KHUYEN_MAI_004', 'Số tiền giảm phải lớn hơn 0.', HttpStatus.BAD_REQUEST);
    if (giamToiDa !== undefined && giamToiDa < 0) throw new LoiNghiepVuException('KHUYEN_MAI_004', 'Giảm tối đa không hợp lệ.', HttpStatus.BAD_REQUEST);
  }
}
