import { HttpStatus, Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../../co-so-du-lieu/prisma.service';
import { LoiNghiepVuException } from '../../dung-chung/exception/loi-nghiep-vu.exception';
import { bigintTuChuoi } from '../../dung-chung/tien-ich/id';
import type { NguoiDungXacThuc } from '../../dung-chung/types/nguoi-dung-xac-thuc.type';
import { NhatKyService } from '../nhat-ky/nhat-ky.service';
import { CapNhatNhanVienDto } from './dto/cap-nhat-nhan-vien.dto';
import { CapNhatTrangThaiNhanVienDto } from './dto/cap-nhat-trang-thai-nhan-vien.dto';
import { DanhSachNhanVienDto } from './dto/danh-sach-nhan-vien.dto';
import { TaoNhanVienDto } from './dto/tao-nhan-vien.dto';

interface TongSoDong { tong: bigint | number | string }
interface IdDong { id: bigint }

@Injectable()
export class NhanVienService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly nhatKy: NhatKyService,
  ) {}

  async danhSach(dto: DanhSachNhanVienDto) {
    const dieuKien = ['nv.ngay_xoa IS NULL', 'tk.ngay_xoa IS NULL'];
    const thamSo: unknown[] = [];
    if (dto.trangThai) {
      dieuKien.push('nv.trang_thai = ?');
      thamSo.push(dto.trangThai);
    }
    if (dto.maVaiTro) {
      dieuKien.push('vt.ma_vai_tro = ?');
      thamSo.push(dto.maVaiTro);
    }
    if (dto.tuKhoa?.trim()) {
      const q = `%${dto.tuKhoa.trim()}%`;
      dieuKien.push('(nv.ma_nhan_vien LIKE ? OR nv.ho_ten LIKE ? OR nv.so_dien_thoai LIKE ? OR tk.email LIKE ?)');
      thamSo.push(q, q, q, q);
    }
    const where = dieuKien.join(' AND ');
    const offset = (dto.trang - 1) * dto.kichThuoc;

    const [danhSach, tongRows] = await Promise.all([
      this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `SELECT nv.id, nv.tai_khoan_id, nv.ma_nhan_vien, nv.ho_ten, nv.so_dien_thoai,
                nv.email, DATE_FORMAT(nv.ngay_vao_lam, '%Y-%m-%d') AS ngay_vao_lam,
                nv.ghi_chu, nv.trang_thai, nv.ngay_tao, nv.ngay_cap_nhat,
                tk.ten_dang_nhap, tk.email AS email_tai_khoan, tk.trang_thai AS trang_thai_tai_khoan,
                tk.bat_buoc_doi_mat_khau, tk.lan_dang_nhap_cuoi,
                vt.id AS vai_tro_id, vt.ma_vai_tro, vt.ten_vai_tro
         FROM nhan_vien nv
         INNER JOIN tai_khoan tk ON tk.id = nv.tai_khoan_id
         INNER JOIN vai_tro vt ON vt.id = tk.vai_tro_id
         WHERE ${where}
         ORDER BY nv.ngay_tao DESC
         LIMIT ? OFFSET ?`,
        ...thamSo,
        dto.kichThuoc,
        offset,
      ),
      this.prisma.$queryRawUnsafe<TongSoDong[]>(
        `SELECT COUNT(*) AS tong
         FROM nhan_vien nv
         INNER JOIN tai_khoan tk ON tk.id = nv.tai_khoan_id
         INNER JOIN vai_tro vt ON vt.id = tk.vai_tro_id
         WHERE ${where}`,
        ...thamSo,
      ),
    ]);
    const tong = Number(tongRows[0]?.tong ?? 0);
    return { danhSach, phanTrang: { trang: dto.trang, kichThuoc: dto.kichThuoc, tong, tongTrang: Math.ceil(tong / dto.kichThuoc) } };
  }

  async chiTiet(id: string) {
    const nhanVienId = bigintTuChuoi(id, 'ID nhân viên');
    const rows = await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT nv.id, nv.tai_khoan_id, nv.ma_nhan_vien, nv.ho_ten, nv.so_dien_thoai,
              nv.email, DATE_FORMAT(nv.ngay_vao_lam, '%Y-%m-%d') AS ngay_vao_lam,
              nv.ghi_chu, nv.trang_thai, nv.ngay_tao, nv.ngay_cap_nhat,
              tk.ten_dang_nhap, tk.email AS email_tai_khoan, tk.trang_thai AS trang_thai_tai_khoan,
              tk.bat_buoc_doi_mat_khau, tk.lan_dang_nhap_cuoi,
              vt.id AS vai_tro_id, vt.ma_vai_tro, vt.ten_vai_tro
       FROM nhan_vien nv
       INNER JOIN tai_khoan tk ON tk.id = nv.tai_khoan_id
       INNER JOIN vai_tro vt ON vt.id = tk.vai_tro_id
       WHERE nv.id = ? AND nv.ngay_xoa IS NULL AND tk.ngay_xoa IS NULL
       LIMIT 1`,
      nhanVienId,
    );
    if (!rows[0]) throw new LoiNghiepVuException('NHAN_VIEN_001', 'Không tìm thấy nhân viên.', HttpStatus.NOT_FOUND);
    return rows[0];
  }

  async tao(dto: TaoNhanVienDto, nguoiDung: NguoiDungXacThuc, maYeuCau?: string | null) {
    const maVaiTro = dto.maVaiTro?.trim() || 'NHAN_VIEN';
    const [vaiTro] = await this.prisma.$queryRawUnsafe<Array<{ id: bigint; ma_vai_tro: string }>>(
      "SELECT id, ma_vai_tro FROM vai_tro WHERE ma_vai_tro = ? AND trang_thai = 'HOAT_DONG' LIMIT 1",
      maVaiTro,
    );
    if (!vaiTro) throw new LoiNghiepVuException('NHAN_VIEN_002', 'Vai trò không tồn tại hoặc đã ngừng hoạt động.', HttpStatus.BAD_REQUEST);
    if (maVaiTro === 'KHACH_HANG') throw new LoiNghiepVuException('NHAN_VIEN_002', 'Không thể gán vai trò KHACH_HANG cho nhân viên.', HttpStatus.BAD_REQUEST);

    const tenDangNhap = dto.tenDangNhap?.trim() || dto.email;
    const [trungMa, trungEmail, trungTenDangNhap] = await Promise.all([
      this.prisma.$queryRawUnsafe<IdDong[]>('SELECT id FROM nhan_vien WHERE ma_nhan_vien = ? LIMIT 1', dto.maNhanVien),
      this.prisma.$queryRawUnsafe<IdDong[]>('SELECT id FROM tai_khoan WHERE email = ? AND ngay_xoa IS NULL LIMIT 1', dto.email),
      this.prisma.$queryRawUnsafe<IdDong[]>('SELECT id FROM tai_khoan WHERE ten_dang_nhap = ? AND ngay_xoa IS NULL LIMIT 1', tenDangNhap),
    ]);
    if (trungMa.length || trungEmail.length || trungTenDangNhap.length) throw new LoiNghiepVuException('NHAN_VIEN_003', 'Mã nhân viên, email hoặc tên đăng nhập đã tồn tại.', HttpStatus.CONFLICT);

    const matKhauHash = await argon2.hash(dto.matKhau);
    let nhanVienId = 0n;
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `INSERT INTO tai_khoan
         (ten_dang_nhap, email, mat_khau, vai_tro_id, trang_thai, bat_buoc_doi_mat_khau)
         VALUES (?, ?, ?, ?, ?, 1)`,
        tenDangNhap,
        dto.email,
        matKhauHash,
        vaiTro.id,
        !dto.trangThai || dto.trangThai === 'HOAT_DONG' ? 'HOAT_DONG' : dto.trangThai === 'TAM_NGHI' ? 'BI_KHOA' : 'NGUNG_HOAT_DONG',
      );
      const [tk] = await tx.$queryRawUnsafe<IdDong[]>('SELECT LAST_INSERT_ID() AS id');
      if (!tk) throw new Error('Không lấy được ID tài khoản vừa tạo.');
      await tx.$executeRawUnsafe(
        `INSERT INTO nhan_vien
         (tai_khoan_id, ma_nhan_vien, ho_ten, so_dien_thoai, email, ngay_vao_lam, ghi_chu, trang_thai)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        tk.id,
        dto.maNhanVien,
        dto.hoTen,
        dto.soDienThoai ?? null,
        dto.email,
        dto.ngayVaoLam ?? null,
        dto.ghiChu ?? null,
        dto.trangThai ?? 'HOAT_DONG',
      );
      const [nv] = await tx.$queryRawUnsafe<IdDong[]>('SELECT LAST_INSERT_ID() AS id');
      if (!nv) throw new Error('Không lấy được ID nhân viên vừa tạo.');
      nhanVienId = nv.id;
    });

    const moi = await this.chiTiet(nhanVienId.toString());
    await this.nhatKy.ghiNhan({ taiKhoanId: nguoiDung.taiKhoanId, hanhDong: 'TAO_NHAN_VIEN', doiTuong: 'NHAN_VIEN', doiTuongId: nhanVienId.toString(), duLieuMoi: moi, maYeuCau });
    return moi;
  }

  async capNhat(id: string, dto: CapNhatNhanVienDto, nguoiDung: NguoiDungXacThuc, maYeuCau?: string | null) {
    const cu = await this.chiTiet(id);
    const nhanVienId = bigintTuChuoi(id, 'ID nhân viên');
    const taiKhoanId = BigInt(String(cu.tai_khoan_id));

    let vaiTroId: bigint | undefined;
    if (dto.maVaiTro) {
      const [vaiTro] = await this.prisma.$queryRawUnsafe<Array<{ id: bigint; ma_vai_tro: string }>>(
        "SELECT id, ma_vai_tro FROM vai_tro WHERE ma_vai_tro = ? AND trang_thai = 'HOAT_DONG' LIMIT 1",
        dto.maVaiTro,
      );
      if (!vaiTro || vaiTro.ma_vai_tro === 'KHACH_HANG') throw new LoiNghiepVuException('NHAN_VIEN_002', 'Vai trò nhân viên không hợp lệ.', HttpStatus.BAD_REQUEST);
      vaiTroId = vaiTro.id;
    }

    if (dto.email && dto.email !== cu.email_tai_khoan) {
      const trung = await this.prisma.$queryRawUnsafe<IdDong[]>(
        'SELECT id FROM tai_khoan WHERE email = ? AND id <> ? AND ngay_xoa IS NULL LIMIT 1',
        dto.email,
        taiKhoanId,
      );
      if (trung.length) throw new LoiNghiepVuException('NHAN_VIEN_003', 'Email đã được tài khoản khác sử dụng.', HttpStatus.CONFLICT);
    }

    const matKhauHash = dto.matKhauMoi ? await argon2.hash(dto.matKhauMoi) : undefined;
    await this.prisma.$transaction(async (tx) => {
      const nv: Array<[string, unknown]> = [];
      if (dto.hoTen !== undefined) nv.push(['ho_ten', dto.hoTen]);
      if (dto.soDienThoai !== undefined) nv.push(['so_dien_thoai', dto.soDienThoai]);
      if (dto.email !== undefined) nv.push(['email', dto.email]);
      if (dto.ngayVaoLam !== undefined) nv.push(['ngay_vao_lam', dto.ngayVaoLam]);
      if (dto.ghiChu !== undefined) nv.push(['ghi_chu', dto.ghiChu]);
      if (nv.length) {
        await tx.$executeRawUnsafe(
          `UPDATE nhan_vien SET ${nv.map(([cot]) => `${cot} = ?`).join(', ')} WHERE id = ? AND ngay_xoa IS NULL`,
          ...nv.map(([, v]) => v),
          nhanVienId,
        );
      }

      const tk: Array<[string, unknown]> = [];
      if (dto.email !== undefined) tk.push(['email', dto.email]);
      if (vaiTroId !== undefined) tk.push(['vai_tro_id', vaiTroId]);
      if (matKhauHash !== undefined) {
        tk.push(['mat_khau', matKhauHash]);
        tk.push(['bat_buoc_doi_mat_khau', 1]);
        tk.push(['refresh_token_hash', null]);
      }
      if (tk.length) {
        await tx.$executeRawUnsafe(
          `UPDATE tai_khoan SET ${tk.map(([cot]) => `${cot} = ?`).join(', ')} WHERE id = ? AND ngay_xoa IS NULL`,
          ...tk.map(([, v]) => v),
          taiKhoanId,
        );
      }
    });

    const moi = await this.chiTiet(id);
    await this.nhatKy.ghiNhan({ taiKhoanId: nguoiDung.taiKhoanId, hanhDong: 'CAP_NHAT_NHAN_VIEN', doiTuong: 'NHAN_VIEN', doiTuongId: id, duLieuCu: cu, duLieuMoi: moi, maYeuCau });
    return moi;
  }

  async capNhatTrangThai(id: string, dto: CapNhatTrangThaiNhanVienDto, nguoiDung: NguoiDungXacThuc, maYeuCau?: string | null) {
    const cu = await this.chiTiet(id);
    if (String(cu.tai_khoan_id) === nguoiDung.taiKhoanId && dto.trangThai !== 'HOAT_DONG') {
      throw new LoiNghiepVuException('NHAN_VIEN_004', 'Không thể tự khóa hoặc cho chính tài khoản đang đăng nhập nghỉ việc.', HttpStatus.CONFLICT);
    }
    const nhanVienId = bigintTuChuoi(id, 'ID nhân viên');
    const taiKhoanId = BigInt(String(cu.tai_khoan_id));
    const trangThaiTaiKhoan = dto.trangThai === 'HOAT_DONG' ? 'HOAT_DONG' : dto.trangThai === 'TAM_NGHI' ? 'BI_KHOA' : 'NGUNG_HOAT_DONG';
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe('UPDATE nhan_vien SET trang_thai = ? WHERE id = ?', dto.trangThai, nhanVienId);
      await tx.$executeRawUnsafe('UPDATE tai_khoan SET trang_thai = ?, refresh_token_hash = NULL WHERE id = ?', trangThaiTaiKhoan, taiKhoanId);
    });
    const moi = await this.chiTiet(id);
    await this.nhatKy.ghiNhan({ taiKhoanId: nguoiDung.taiKhoanId, hanhDong: 'CAP_NHAT_TRANG_THAI_NHAN_VIEN', doiTuong: 'NHAN_VIEN', doiTuongId: id, duLieuCu: cu, duLieuMoi: moi, maYeuCau });
    return moi;
  }
}
