import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../co-so-du-lieu/prisma.service';
import { LoiNghiepVuException } from '../../dung-chung/exception/loi-nghiep-vu.exception';
import { bigintTuChuoi } from '../../dung-chung/tien-ich/id';
import { DanhSachThongBaoDto } from './dto/danh-sach-thong-bao.dto';

interface TongDong { tong: bigint | number | string }

@Injectable()
export class ThongBaoService {
  private readonly logger = new Logger(ThongBaoService.name);
  constructor(private readonly prisma: PrismaService) {}

  async taoChoDatBan(datBanId: bigint, loai: string, tieuDe: string, noiDung: string): Promise<void> {
    try {
      const datBan = await this.prisma.dat_ban.findUnique({
        where: { id: datBanId },
        select: { khach_hang_id: true, ma_dat_ban: true },
      });
      if (!datBan?.khach_hang_id) return;

      const khach = await this.prisma.khach_hang.findUnique({
        where: { id: datBan.khach_hang_id },
        select: { tai_khoan_id: true },
      });
      if (!khach?.tai_khoan_id) return;

      await this.prisma.thong_bao.create({
        data: {
          tai_khoan_id: khach.tai_khoan_id,
          dat_ban_id: datBanId,
          loai_thong_bao: loai,
          tieu_de: tieuDe,
          noi_dung: noiDung,
          duong_dan: `/tai-khoan/dat-ban/${datBanId.toString()}`,
        },
      });
    } catch (error) {
      this.logger.warn(`Không tạo được thông báo: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async danhSach(taiKhoanIdChuoi: string, dto: DanhSachThongBaoDto) {
    const taiKhoanId = BigInt(taiKhoanIdChuoi);
    const dieuKien = ['tai_khoan_id = ?'];
    const thamSo: unknown[] = [taiKhoanId];
    if (dto.daDoc !== undefined) {
      dieuKien.push('da_doc = ?');
      thamSo.push(dto.daDoc === 'true' ? 1 : 0);
    }
    const where = dieuKien.join(' AND ');
    const offset = (dto.trang - 1) * dto.kichThuoc;
    const [danhSach, tongRows] = await Promise.all([
      this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `SELECT id, tai_khoan_id, dat_ban_id, loai_thong_bao, tieu_de, noi_dung, duong_dan,
                da_doc, thoi_gian_doc, ngay_tao
         FROM thong_bao WHERE ${where}
         ORDER BY ngay_tao DESC LIMIT ? OFFSET ?`,
        ...thamSo,
        dto.kichThuoc,
        offset,
      ),
      this.prisma.$queryRawUnsafe<TongDong[]>(`SELECT COUNT(*) AS tong FROM thong_bao WHERE ${where}`, ...thamSo),
    ]);
    const tong = Number(tongRows[0]?.tong ?? 0);
    return { danhSach, phanTrang: { trang: dto.trang, kichThuoc: dto.kichThuoc, tong, tongTrang: Math.ceil(tong / dto.kichThuoc) } };
  }

  async soChuaDoc(taiKhoanIdChuoi: string) {
    const [row] = await this.prisma.$queryRawUnsafe<TongDong[]>('SELECT COUNT(*) AS tong FROM thong_bao WHERE tai_khoan_id = ? AND da_doc = 0', BigInt(taiKhoanIdChuoi));
    return { soChuaDoc: Number(row?.tong ?? 0) };
  }

  async danhDauDaDoc(taiKhoanIdChuoi: string, id: string) {
    const thongBaoId = bigintTuChuoi(id, 'ID thông báo');
    const taiKhoanId = BigInt(taiKhoanIdChuoi);
    const ketQua = await this.prisma.$executeRawUnsafe(
      'UPDATE thong_bao SET da_doc = 1, thoi_gian_doc = COALESCE(thoi_gian_doc, NOW(3)) WHERE id = ? AND tai_khoan_id = ?',
      thongBaoId,
      taiKhoanId,
    );
    if (ketQua === 0) throw new LoiNghiepVuException('THONG_BAO_001', 'Không tìm thấy thông báo.', HttpStatus.NOT_FOUND);
    return { daDoc: true };
  }

  async docTatCa(taiKhoanIdChuoi: string) {
    const soDong = await this.prisma.$executeRawUnsafe(
      'UPDATE thong_bao SET da_doc = 1, thoi_gian_doc = COALESCE(thoi_gian_doc, NOW(3)) WHERE tai_khoan_id = ? AND da_doc = 0',
      BigInt(taiKhoanIdChuoi),
    );
    return { soThongBaoDaDoc: Number(soDong) };
  }
}
