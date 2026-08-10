import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../co-so-du-lieu/prisma.service';
import { khoangNgayMacDinh } from '../../dung-chung/tien-ich/ngay-bao-cao';
import { KhoangNgayBaoCaoDto } from './dto/khoang-ngay-bao-cao.dto';

@Injectable()
export class BaoCaoService {
  constructor(private readonly prisma: PrismaService) {}

  async datBan(dto: KhoangNgayBaoCaoDto) {
    const { tuNgay, denNgay } = khoangNgayMacDinh(dto.tuNgay, dto.denNgay);
    const [tongQuan, theoNgay, theoTrangThai, theoNguon, theoKhuVuc] = await Promise.all([
      this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `SELECT COUNT(*) AS tong_dat_ban,
                SUM(so_nguoi) AS tong_luot_khach,
                SUM(CASE WHEN trang_thai = 'DA_HOAN_THANH' THEN 1 ELSE 0 END) AS da_hoan_thanh,
                SUM(CASE WHEN trang_thai = 'DA_HUY' THEN 1 ELSE 0 END) AS da_huy,
                SUM(CASE WHEN trang_thai = 'KHONG_DEN' THEN 1 ELSE 0 END) AS khong_den
         FROM dat_ban WHERE ngay_dat BETWEEN ? AND ?`,
        tuNgay, denNgay,
      ),
      this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `SELECT DATE_FORMAT(ngay_dat, '%Y-%m-%d') AS ngay, COUNT(*) AS so_dat_ban, SUM(so_nguoi) AS so_khach
         FROM dat_ban WHERE ngay_dat BETWEEN ? AND ? GROUP BY ngay_dat ORDER BY ngay_dat`,
        tuNgay, denNgay,
      ),
      this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `SELECT trang_thai, COUNT(*) AS so_luong FROM dat_ban WHERE ngay_dat BETWEEN ? AND ? GROUP BY trang_thai ORDER BY so_luong DESC`,
        tuNgay, denNgay,
      ),
      this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `SELECT nguon_dat, COUNT(*) AS so_luong FROM dat_ban WHERE ngay_dat BETWEEN ? AND ? GROUP BY nguon_dat ORDER BY so_luong DESC`,
        tuNgay, denNgay,
      ),
      this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `SELECT COALESCE(kv.ten_khu_vuc, 'Chưa xếp khu vực') AS ten_khu_vuc, COUNT(db.id) AS so_luong
         FROM dat_ban db LEFT JOIN khu_vuc kv ON kv.id = db.khu_vuc_id
         WHERE db.ngay_dat BETWEEN ? AND ? GROUP BY kv.id, kv.ten_khu_vuc ORDER BY so_luong DESC`,
        tuNgay, denNgay,
      ),
    ]);
    const tq = this.soHoa(tongQuan[0] ?? {});
    const tong = Number(tq.tong_dat_ban ?? 0);
    const hoanThanh = Number(tq.da_hoan_thanh ?? 0);
    return {
      tuNgay, denNgay,
      tongQuan: { ...tq, tyLeHoanThanh: tong ? Math.round((hoanThanh / tong) * 10_000) / 100 : 0 },
      theoNgay: theoNgay.map((x) => this.soHoa(x)),
      theoTrangThai: theoTrangThai.map((x) => this.soHoa(x)),
      theoNguon: theoNguon.map((x) => this.soHoa(x)),
      theoKhuVuc: theoKhuVuc.map((x) => this.soHoa(x)),
    };
  }

  async khachHang(dto: KhoangNgayBaoCaoDto) {
    const { tuNgay, denNgay } = khoangNgayMacDinh(dto.tuNgay, dto.denNgay);
    const [tongQuan, topKhach] = await Promise.all([
      this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `SELECT COUNT(DISTINCT db.khach_hang_id) AS khach_co_dat_ban,
                COUNT(DISTINCT CASE WHEN DATE(kh.ngay_tao) BETWEEN ? AND ? THEN kh.id END) AS khach_moi
         FROM khach_hang kh LEFT JOIN dat_ban db ON db.khach_hang_id = kh.id AND db.ngay_dat BETWEEN ? AND ?
         WHERE kh.ngay_xoa IS NULL`,
        tuNgay, denNgay, tuNgay, denNgay,
      ),
      this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `SELECT kh.id, kh.ma_khach_hang, kh.ho_ten, kh.so_dien_thoai, kh.email,
                COUNT(db.id) AS tong_dat_ban,
                SUM(CASE WHEN db.trang_thai = 'DA_HOAN_THANH' THEN 1 ELSE 0 END) AS tong_hoan_thanh,
                SUM(db.so_nguoi) AS tong_luot_khach
         FROM khach_hang kh INNER JOIN dat_ban db ON db.khach_hang_id = kh.id
         WHERE kh.ngay_xoa IS NULL AND db.ngay_dat BETWEEN ? AND ?
         GROUP BY kh.id ORDER BY tong_hoan_thanh DESC, tong_dat_ban DESC LIMIT 20`,
        tuNgay, denNgay,
      ),
    ]);
    return { tuNgay, denNgay, tongQuan: this.soHoa(tongQuan[0] ?? {}), topKhachHang: topKhach.map((x) => this.soHoa(x)) };
  }

  async danhGia(dto: KhoangNgayBaoCaoDto) {
    const { tuNgay, denNgay } = khoangNgayMacDinh(dto.tuNgay, dto.denNgay);
    const [tongQuan, theoSao] = await Promise.all([
      this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `SELECT COUNT(*) AS tong_danh_gia, COALESCE(AVG(so_sao),0) AS diem_trung_binh,
                SUM(CASE WHEN phan_hoi IS NOT NULL THEN 1 ELSE 0 END) AS da_phan_hoi
         FROM danh_gia WHERE ngay_xoa IS NULL AND DATE(ngay_tao) BETWEEN ? AND ?`, tuNgay, denNgay,
      ),
      this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `SELECT so_sao, COUNT(*) AS so_luong FROM danh_gia WHERE ngay_xoa IS NULL AND DATE(ngay_tao) BETWEEN ? AND ? GROUP BY so_sao ORDER BY so_sao DESC`, tuNgay, denNgay,
      ),
    ]);
    return { tuNgay, denNgay, tongQuan: this.soHoa(tongQuan[0] ?? {}), theoSoSao: theoSao.map((x) => this.soHoa(x)) };
  }

  private soHoa(row: Record<string, unknown>) {
    const ketQua = { ...row };
    for (const [k, v] of Object.entries(ketQua)) {
      if (['so_luong','so_dat_ban','so_khach','tong_dat_ban','tong_luot_khach','da_hoan_thanh','da_huy','khong_den','khach_co_dat_ban','khach_moi','tong_hoan_thanh','tong_danh_gia','da_phan_hoi','tong_luot_khach'].includes(k)) ketQua[k] = Number(v ?? 0);
      if (k === 'diem_trung_binh') ketQua[k] = Math.round(Number(v ?? 0) * 100) / 100;
    }
    return ketQua;
  }
}
