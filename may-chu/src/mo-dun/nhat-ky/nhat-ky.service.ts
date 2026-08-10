import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../co-so-du-lieu/prisma.service';
import { chuyenBigIntThanhChuoi } from '../../dung-chung/tien-ich/chuyen-bigint';
import { bigintTuChuoi } from '../../dung-chung/tien-ich/id';
import { DanhSachNhatKyDto } from './dto/danh-sach-nhat-ky.dto';

export interface GhiNhatKyInput {
  taiKhoanId?: string | null;
  hanhDong: string;
  doiTuong: string;
  doiTuongId?: string | null;
  duLieuCu?: unknown;
  duLieuMoi?: unknown;
  diaChiIp?: string | null;
  userAgent?: string | null;
  maYeuCau?: string | null;
}

interface TongDong { tong: bigint | number | string }

@Injectable()
export class NhatKyService {
  private readonly logger = new Logger(NhatKyService.name);
  constructor(private readonly prisma: PrismaService) {}

  async ghiNhan(input: GhiNhatKyInput): Promise<void> {
    try {
      await this.prisma.nhat_ky_hoat_dong.create({
        data: {
          tai_khoan_id: input.taiKhoanId ? BigInt(input.taiKhoanId) : null,
          hanh_dong: input.hanhDong,
          doi_tuong: input.doiTuong,
          doi_tuong_id: input.doiTuongId ?? null,
          du_lieu_cu: input.duLieuCu == null ? undefined : (chuyenBigIntThanhChuoi(input.duLieuCu) as any),
          du_lieu_moi: input.duLieuMoi == null ? undefined : (chuyenBigIntThanhChuoi(input.duLieuMoi) as any),
          dia_chi_ip: input.diaChiIp ?? null,
          user_agent: input.userAgent ?? null,
          ma_yeu_cau: input.maYeuCau ?? null,
        },
      });
    } catch (error) {
      this.logger.warn(`Không ghi được audit log: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async danhSach(dto: DanhSachNhatKyDto) {
    const dieuKien = ['1=1'];
    const thamSo: unknown[] = [];
    if (dto.hanhDong) { dieuKien.push('nk.hanh_dong = ?'); thamSo.push(dto.hanhDong); }
    if (dto.doiTuong) { dieuKien.push('nk.doi_tuong = ?'); thamSo.push(dto.doiTuong); }
    if (dto.taiKhoanId) { dieuKien.push('nk.tai_khoan_id = ?'); thamSo.push(bigintTuChuoi(dto.taiKhoanId, 'ID tài khoản')); }
    if (dto.maYeuCau) { dieuKien.push('nk.ma_yeu_cau = ?'); thamSo.push(dto.maYeuCau); }
    const where = dieuKien.join(' AND ');
    const offset = (dto.trang - 1) * dto.kichThuoc;
    const [danhSach, tongRows] = await Promise.all([
      this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `SELECT nk.id, nk.tai_khoan_id, tk.email AS email_tai_khoan, nk.hanh_dong, nk.doi_tuong,
                nk.doi_tuong_id, nk.du_lieu_cu, nk.du_lieu_moi, nk.dia_chi_ip, nk.user_agent,
                nk.ma_yeu_cau, nk.thoi_gian
         FROM nhat_ky_hoat_dong nk
         LEFT JOIN tai_khoan tk ON tk.id = nk.tai_khoan_id
         WHERE ${where}
         ORDER BY nk.thoi_gian DESC LIMIT ? OFFSET ?`,
        ...thamSo,
        dto.kichThuoc,
        offset,
      ),
      this.prisma.$queryRawUnsafe<TongDong[]>(`SELECT COUNT(*) AS tong FROM nhat_ky_hoat_dong nk WHERE ${where}`, ...thamSo),
    ]);
    const tong = Number(tongRows[0]?.tong ?? 0);
    return { danhSach, phanTrang: { trang: dto.trang, kichThuoc: dto.kichThuoc, tong, tongTrang: Math.ceil(tong / dto.kichThuoc) } };
  }
}
