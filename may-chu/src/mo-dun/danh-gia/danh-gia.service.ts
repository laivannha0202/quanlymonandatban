import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../co-so-du-lieu/prisma.service';
import { LoiNghiepVuException } from '../../dung-chung/exception/loi-nghiep-vu.exception';
import { bigintTuChuoi } from '../../dung-chung/tien-ich/id';
import type { NguoiDungXacThuc } from '../../dung-chung/types/nguoi-dung-xac-thuc.type';
import { NhatKyService } from '../nhat-ky/nhat-ky.service';
import { CapNhatDanhGiaDto } from './dto/cap-nhat-danh-gia.dto';
import { CapNhatHienThiDanhGiaDto } from './dto/cap-nhat-hien-thi-danh-gia.dto';
import { DanhSachDanhGiaDto } from './dto/danh-sach-danh-gia.dto';
import { PhanHoiDanhGiaDto } from './dto/phan-hoi-danh-gia.dto';
import { TaoDanhGiaDto } from './dto/tao-danh-gia.dto';

interface IdDong { id: bigint }
interface TongDong { tong: bigint | number | string }

@Injectable()
export class DanhGiaService {
  constructor(private readonly prisma: PrismaService, private readonly nhatKy: NhatKyService) {}

  async danhSachCongKhai(dto: DanhSachDanhGiaDto) {
    return this.danhSachNoiBo(dto, true);
  }

  async danhSachQuanTri(dto: DanhSachDanhGiaDto) {
    return this.danhSachNoiBo(dto, false);
  }

  private async danhSachNoiBo(dto: DanhSachDanhGiaDto, congKhai: boolean) {
    const dieuKien = ['dg.ngay_xoa IS NULL'];
    const thamSo: unknown[] = [];
    if (congKhai) dieuKien.push('dg.hien_thi = 1');
    else if (dto.hienThi !== undefined) { dieuKien.push('dg.hien_thi = ?'); thamSo.push(dto.hienThi === 'true' ? 1 : 0); }
    if (dto.soSao) { dieuKien.push('dg.so_sao = ?'); thamSo.push(dto.soSao); }
    const where = dieuKien.join(' AND ');
    const offset = (dto.trang - 1) * dto.kichThuoc;
    const [danhSach, tongRows] = await Promise.all([
      this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `SELECT dg.id, dg.khach_hang_id, dg.dat_ban_id, kh.ho_ten, dg.so_sao, dg.noi_dung,
                dg.phan_hoi, dg.nguoi_phan_hoi_id, nv.ho_ten AS nguoi_phan_hoi,
                dg.thoi_gian_phan_hoi, dg.hien_thi, dg.ngay_tao, dg.ngay_cap_nhat
         FROM danh_gia dg
         INNER JOIN khach_hang kh ON kh.id = dg.khach_hang_id
         LEFT JOIN nhan_vien nv ON nv.id = dg.nguoi_phan_hoi_id
         WHERE ${where}
         ORDER BY dg.ngay_tao DESC LIMIT ? OFFSET ?`,
        ...thamSo, dto.kichThuoc, offset,
      ),
      this.prisma.$queryRawUnsafe<TongDong[]>(`SELECT COUNT(*) AS tong FROM danh_gia dg WHERE ${where}`, ...thamSo),
    ]);
    const tong = Number(tongRows[0]?.tong ?? 0);
    return { danhSach, phanTrang: { trang: dto.trang, kichThuoc: dto.kichThuoc, tong, tongTrang: Math.ceil(tong / dto.kichThuoc) } };
  }

  async taoCuaKhach(dto: TaoDanhGiaDto, nguoiDung: NguoiDungXacThuc) {
    const [khach] = await this.prisma.$queryRawUnsafe<Array<{ id: bigint }>>('SELECT id FROM khach_hang WHERE tai_khoan_id = ? AND ngay_xoa IS NULL LIMIT 1', BigInt(nguoiDung.taiKhoanId));
    if (!khach) throw new LoiNghiepVuException('DANH_GIA_001', 'Không tìm thấy hồ sơ khách hàng.', HttpStatus.NOT_FOUND);
    const datBanId = bigintTuChuoi(dto.datBanId, 'ID đặt bàn');
    const [datBan] = await this.prisma.$queryRawUnsafe<Array<{ id: bigint; trang_thai: string }>>('SELECT id, trang_thai FROM dat_ban WHERE id = ? AND khach_hang_id = ? LIMIT 1', datBanId, khach.id);
    if (!datBan) throw new LoiNghiepVuException('DANH_GIA_002', 'Đặt bàn không thuộc tài khoản này.', HttpStatus.NOT_FOUND);
    if (datBan.trang_thai !== 'DA_HOAN_THANH') throw new LoiNghiepVuException('DANH_GIA_003', 'Chỉ được đánh giá sau khi lượt đặt bàn đã hoàn thành.', HttpStatus.CONFLICT);
    const trung = await this.prisma.$queryRawUnsafe<IdDong[]>('SELECT id FROM danh_gia WHERE dat_ban_id = ? AND ngay_xoa IS NULL LIMIT 1', datBanId);
    if (trung.length) throw new LoiNghiepVuException('DANH_GIA_004', 'Lượt đặt bàn này đã được đánh giá.', HttpStatus.CONFLICT);
    const danhGiaMoiId = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        'INSERT INTO danh_gia (khach_hang_id, dat_ban_id, so_sao, noi_dung, hien_thi) VALUES (?, ?, ?, ?, 1)',
        khach.id,
        datBanId,
        dto.soSao,
        dto.noiDung ?? null,
      );

      const [row] = await tx.$queryRawUnsafe<IdDong[]>(
        'SELECT LAST_INSERT_ID() AS id',
      );

      return row.id;
    });

    return this.chiTiet(danhGiaMoiId.toString());
  }

  async capNhatCuaKhach(id: string, dto: CapNhatDanhGiaDto, nguoiDung: NguoiDungXacThuc) {
    const danhGiaId = bigintTuChuoi(id, 'ID đánh giá');
    const [dg] = await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT dg.* FROM danh_gia dg INNER JOIN khach_hang kh ON kh.id = dg.khach_hang_id
       WHERE dg.id = ? AND kh.tai_khoan_id = ? AND dg.ngay_xoa IS NULL LIMIT 1`,
      danhGiaId, BigInt(nguoiDung.taiKhoanId),
    );
    if (!dg) throw new LoiNghiepVuException('DANH_GIA_005', 'Không tìm thấy đánh giá của bạn.', HttpStatus.NOT_FOUND);
    const capNhat: Array<[string, unknown]> = [];
    if (dto.soSao !== undefined) capNhat.push(['so_sao', dto.soSao]);
    if (dto.noiDung !== undefined) capNhat.push(['noi_dung', dto.noiDung]);
    if (capNhat.length) await this.prisma.$executeRawUnsafe(`UPDATE danh_gia SET ${capNhat.map(([c]) => `${c} = ?`).join(', ')} WHERE id = ?`, ...capNhat.map(([,v]) => v), danhGiaId);
    return this.chiTiet(id);
  }

  async xoaCuaKhach(id: string, nguoiDung: NguoiDungXacThuc) {
    const danhGiaId = bigintTuChuoi(id, 'ID đánh giá');
    const rows = await this.prisma.$queryRawUnsafe<IdDong[]>(`SELECT dg.id FROM danh_gia dg INNER JOIN khach_hang kh ON kh.id = dg.khach_hang_id WHERE dg.id = ? AND kh.tai_khoan_id = ? AND dg.ngay_xoa IS NULL LIMIT 1`, danhGiaId, BigInt(nguoiDung.taiKhoanId));
    if (!rows.length) throw new LoiNghiepVuException('DANH_GIA_005', 'Không tìm thấy đánh giá của bạn.', HttpStatus.NOT_FOUND);
    await this.prisma.$executeRawUnsafe('UPDATE danh_gia SET ngay_xoa = NOW(3), hien_thi = 0 WHERE id = ?', danhGiaId);
    return { daXoa: true };
  }

  async chiTiet(id: string) {
    const rows = await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT dg.id, dg.khach_hang_id, dg.dat_ban_id, kh.ho_ten, dg.so_sao, dg.noi_dung,
              dg.phan_hoi, dg.nguoi_phan_hoi_id, nv.ho_ten AS nguoi_phan_hoi,
              dg.thoi_gian_phan_hoi, dg.hien_thi, dg.ngay_tao, dg.ngay_cap_nhat
       FROM danh_gia dg INNER JOIN khach_hang kh ON kh.id = dg.khach_hang_id
       LEFT JOIN nhan_vien nv ON nv.id = dg.nguoi_phan_hoi_id
       WHERE dg.id = ? AND dg.ngay_xoa IS NULL LIMIT 1`,
      bigintTuChuoi(id, 'ID đánh giá'),
    );
    if (!rows[0]) throw new LoiNghiepVuException('DANH_GIA_006', 'Không tìm thấy đánh giá.', HttpStatus.NOT_FOUND);
    return rows[0];
  }

  async phanHoi(id: string, dto: PhanHoiDanhGiaDto, nguoiDung: NguoiDungXacThuc, maYeuCau?: string | null) {
    const cu = await this.chiTiet(id);
    const [nv] = await this.prisma.$queryRawUnsafe<Array<{ id: bigint }>>('SELECT id FROM nhan_vien WHERE tai_khoan_id = ? AND ngay_xoa IS NULL LIMIT 1', BigInt(nguoiDung.taiKhoanId));
    if (!nv) throw new LoiNghiepVuException('DANH_GIA_007', 'Tài khoản hiện tại chưa gắn hồ sơ nhân viên.', HttpStatus.CONFLICT);
    await this.prisma.$executeRawUnsafe('UPDATE danh_gia SET phan_hoi = ?, nguoi_phan_hoi_id = ?, thoi_gian_phan_hoi = NOW(3) WHERE id = ?', dto.phanHoi, nv.id, bigintTuChuoi(id, 'ID đánh giá'));
    const moi = await this.chiTiet(id);
    await this.nhatKy.ghiNhan({ taiKhoanId: nguoiDung.taiKhoanId, hanhDong: 'PHAN_HOI_DANH_GIA', doiTuong: 'DANH_GIA', doiTuongId: id, duLieuCu: cu, duLieuMoi: moi, maYeuCau });
    return moi;
  }

  async capNhatHienThi(id: string, dto: CapNhatHienThiDanhGiaDto, nguoiDung: NguoiDungXacThuc, maYeuCau?: string | null) {
    const cu = await this.chiTiet(id);
    await this.prisma.$executeRawUnsafe('UPDATE danh_gia SET hien_thi = ? WHERE id = ?', dto.hienThi ? 1 : 0, bigintTuChuoi(id, 'ID đánh giá'));
    const moi = await this.chiTiet(id);
    await this.nhatKy.ghiNhan({ taiKhoanId: nguoiDung.taiKhoanId, hanhDong: 'CAP_NHAT_HIEN_THI_DANH_GIA', doiTuong: 'DANH_GIA', doiTuongId: id, duLieuCu: cu, duLieuMoi: moi, maYeuCau });
    return moi;
  }
}
