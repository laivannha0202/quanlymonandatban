import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../co-so-du-lieu/prisma.service';
import { LoiNghiepVuException } from '../../dung-chung/exception/loi-nghiep-vu.exception';
import { taoDuongDan } from '../../dung-chung/tien-ich/duong-dan';
import { bigintTuChuoi } from '../../dung-chung/tien-ich/id';
import type { NguoiDungXacThuc } from '../../dung-chung/types/nguoi-dung-xac-thuc.type';
import { NhatKyService } from '../nhat-ky/nhat-ky.service';
import { CapNhatDanhMucMonDto } from './dto/cap-nhat-danh-muc-mon.dto';
import { TaoDanhMucMonDto } from './dto/tao-danh-muc-mon.dto';

@Injectable()
export class DanhMucMonService {
  constructor(private readonly prisma: PrismaService, private readonly nhatKy: NhatKyService) {}

  async danhSachCongKhai() {
    const rows = await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT dm.id, dm.ma_danh_muc, dm.ten_danh_muc, dm.duong_dan, dm.mo_ta, dm.hinh_anh, dm.thu_tu,
              COUNT(ma.id) AS so_mon
       FROM danh_muc_mon dm
       LEFT JOIN mon_an ma ON ma.danh_muc_id = dm.id AND ma.ngay_xoa IS NULL AND ma.trang_thai = 'HOAT_DONG'
       WHERE dm.ngay_xoa IS NULL AND dm.trang_thai = 'HOAT_DONG'
       GROUP BY dm.id
       ORDER BY dm.thu_tu, dm.ten_danh_muc`,
    );
    return rows.map((row) => ({ ...row, so_mon: Number(row.so_mon ?? 0) }));
  }

  async danhSachQuanTri() {
    const rows = await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT dm.*, COUNT(ma.id) AS so_mon
       FROM danh_muc_mon dm
       LEFT JOIN mon_an ma ON ma.danh_muc_id = dm.id AND ma.ngay_xoa IS NULL
       WHERE dm.ngay_xoa IS NULL
       GROUP BY dm.id
       ORDER BY dm.thu_tu, dm.ten_danh_muc`,
    );
    return rows.map((row) => ({ ...row, so_mon: Number(row.so_mon ?? 0) }));
  }

  async chiTiet(id: string) {
    const rows = await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      'SELECT * FROM danh_muc_mon WHERE id = ? AND ngay_xoa IS NULL LIMIT 1',
      bigintTuChuoi(id, 'ID danh mục món'),
    );
    if (!rows[0]) throw new LoiNghiepVuException('DANH_MUC_MON_001', 'Không tìm thấy danh mục món.', HttpStatus.NOT_FOUND);
    return rows[0];
  }

  async tao(dto: TaoDanhMucMonDto, nguoiDung: NguoiDungXacThuc, maYeuCau?: string | null) {
    const duongDan = dto.duongDan?.trim() || taoDuongDan(dto.tenDanhMuc);
    const trung = await this.prisma.$queryRawUnsafe<Array<{ id: bigint }>>(
      'SELECT id FROM danh_muc_mon WHERE (ma_danh_muc = ? OR duong_dan = ?) LIMIT 1',
      dto.maDanhMuc,
      duongDan,
    );
    if (trung.length) throw new LoiNghiepVuException('DANH_MUC_MON_002', 'Mã hoặc đường dẫn danh mục đã tồn tại.', HttpStatus.CONFLICT);

    const danhMucMoiId = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `INSERT INTO danh_muc_mon (ma_danh_muc, ten_danh_muc, duong_dan, mo_ta, hinh_anh, thu_tu, trang_thai)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        dto.maDanhMuc,
        dto.tenDanhMuc,
        duongDan,
        dto.moTa ?? null,
        dto.hinhAnh ?? null,
        dto.thuTu ?? 0,
        dto.trangThai ?? 'HOAT_DONG',
      );

      const [row] = await tx.$queryRawUnsafe<Array<{ id: bigint }>>(
        'SELECT LAST_INSERT_ID() AS id',
      );

      return row.id;
    });

    const moi = await this.chiTiet(danhMucMoiId.toString());

    await this.nhatKy.ghiNhan({
      taiKhoanId: nguoiDung.taiKhoanId,
      hanhDong: 'TAO_DANH_MUC_MON',
      doiTuong: 'DANH_MUC_MON',
      doiTuongId: danhMucMoiId.toString(),
      duLieuMoi: moi,
      maYeuCau,
    });

    return moi;
  }

  async capNhat(id: string, dto: CapNhatDanhMucMonDto, nguoiDung: NguoiDungXacThuc, maYeuCau?: string | null) {
    const cu = await this.chiTiet(id);
    const danhMucId = bigintTuChuoi(id, 'ID danh mục món');
    const duongDanMoi = dto.duongDan !== undefined
      ? (dto.duongDan.trim() || taoDuongDan(dto.tenDanhMuc ?? String(cu.ten_danh_muc)))
      : undefined;

    if (dto.maDanhMuc !== undefined || duongDanMoi !== undefined) {
      const trung = await this.prisma.$queryRawUnsafe<Array<{ id: bigint }>>(
        `SELECT id FROM danh_muc_mon
         WHERE id <> ? AND (ma_danh_muc = ? OR duong_dan = ?) LIMIT 1`,
        danhMucId,
        dto.maDanhMuc ?? '__KHONG_DOI__',
        duongDanMoi ?? '__KHONG_DOI__',
      );
      if (trung.length) throw new LoiNghiepVuException('DANH_MUC_MON_002', 'Mã hoặc đường dẫn danh mục đã tồn tại.', HttpStatus.CONFLICT);
    }

    const capNhat: Array<[string, unknown]> = [];
    if (dto.maDanhMuc !== undefined) capNhat.push(['ma_danh_muc', dto.maDanhMuc]);
    if (dto.tenDanhMuc !== undefined) capNhat.push(['ten_danh_muc', dto.tenDanhMuc]);
    if (duongDanMoi !== undefined) capNhat.push(['duong_dan', duongDanMoi]);
    if (dto.moTa !== undefined) capNhat.push(['mo_ta', dto.moTa]);
    if (dto.hinhAnh !== undefined) capNhat.push(['hinh_anh', dto.hinhAnh]);
    if (dto.thuTu !== undefined) capNhat.push(['thu_tu', dto.thuTu]);
    if (dto.trangThai !== undefined) capNhat.push(['trang_thai', dto.trangThai]);
    if (capNhat.length) await this.prisma.$executeRawUnsafe(`UPDATE danh_muc_mon SET ${capNhat.map(([c]) => `${c} = ?`).join(', ')} WHERE id = ?`, ...capNhat.map(([,v]) => v), danhMucId);

    const moi = await this.chiTiet(id);
    await this.nhatKy.ghiNhan({ taiKhoanId: nguoiDung.taiKhoanId, hanhDong: 'CAP_NHAT_DANH_MUC_MON', doiTuong: 'DANH_MUC_MON', doiTuongId: id, duLieuCu: cu, duLieuMoi: moi, maYeuCau });
    return moi;
  }

  async xoa(id: string, nguoiDung: NguoiDungXacThuc, maYeuCau?: string | null) {
    const cu = await this.chiTiet(id);
    const danhMucId = bigintTuChuoi(id, 'ID danh mục món');
    const [dem] = await this.prisma.$queryRawUnsafe<Array<{ tong: bigint | number }>>('SELECT COUNT(*) AS tong FROM mon_an WHERE danh_muc_id = ? AND ngay_xoa IS NULL', danhMucId);
    if (Number(dem?.tong ?? 0) > 0) throw new LoiNghiepVuException('DANH_MUC_MON_003', 'Danh mục vẫn còn món ăn. Hãy chuyển hoặc xóa món trước.', HttpStatus.CONFLICT);
    await this.prisma.$executeRawUnsafe("UPDATE danh_muc_mon SET ngay_xoa = NOW(3), trang_thai = 'NGUNG_HOAT_DONG' WHERE id = ?", danhMucId);
    await this.nhatKy.ghiNhan({ taiKhoanId: nguoiDung.taiKhoanId, hanhDong: 'XOA_DANH_MUC_MON', doiTuong: 'DANH_MUC_MON', doiTuongId: id, duLieuCu: cu, maYeuCau });
    return { daXoa: true };
  }
}
