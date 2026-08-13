import {
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../co-so-du-lieu/prisma.service';
import { LoiNghiepVuException } from '../../dung-chung/exception/loi-nghiep-vu.exception';
import { laNgayHopLe } from '../../dung-chung/tien-ich/ngay-gio';
import { ngayHienTaiVietNam } from '../../dung-chung/tien-ich/ngay-bao-cao';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async tongQuan(ngay?: string) {
    const ngayChon =
      ngay || ngayHienTaiVietNam();

    if (!laNgayHopLe(ngayChon)) {
      throw new LoiNghiepVuException(
        'DASHBOARD_001',
        'Ngày dashboard không hợp lệ.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const [
      datBanRows,
      banRows,
      khachRows,
      ganToi,
      danhGiaRows,
      thanhToanRows,
      hoanTienRows,
    ] = await Promise.all([
      this.prisma.$queryRaw<
        Record<string, unknown>[]
      >`
        SELECT
          COUNT(*) AS tong_dat_ban,
          SUM(
            CASE
              WHEN trang_thai =
                'CHO_XAC_NHAN'
              THEN 1
              ELSE 0
            END
          ) AS cho_xac_nhan,
          SUM(
            CASE
              WHEN trang_thai =
                'DA_XAC_NHAN'
              THEN 1
              ELSE 0
            END
          ) AS da_xac_nhan,
          SUM(
            CASE
              WHEN trang_thai =
                'DA_CHECK_IN'
              THEN 1
              ELSE 0
            END
          ) AS da_check_in,
          SUM(
            CASE
              WHEN trang_thai =
                'DA_HOAN_THANH'
              THEN 1
              ELSE 0
            END
          ) AS da_hoan_thanh,
          SUM(
            CASE
              WHEN trang_thai =
                'DA_HUY'
              THEN 1
              ELSE 0
            END
          ) AS da_huy,
          SUM(
            CASE
              WHEN trang_thai =
                'KHONG_DEN'
              THEN 1
              ELSE 0
            END
          ) AS khong_den,
          SUM(
            CASE
              WHEN trang_thai NOT IN (
                'DA_HUY',
                'KHONG_DEN'
              )
              THEN so_nguoi
              ELSE 0
            END
          ) AS tong_khach
        FROM dat_ban
        WHERE ngay_dat = ${ngayChon}
      `,
      this.prisma.$queryRaw<
        Record<string, unknown>[]
      >`
        SELECT
          COUNT(*) AS tong_ban,
          SUM(
            CASE
              WHEN trang_thai = 'TRONG'
              THEN 1
              ELSE 0
            END
          ) AS trong,
          SUM(
            CASE
              WHEN trang_thai =
                'DANG_SU_DUNG'
              THEN 1
              ELSE 0
            END
          ) AS dang_su_dung,
          SUM(
            CASE
              WHEN trang_thai = 'BAO_TRI'
              THEN 1
              ELSE 0
            END
          ) AS bao_tri,
          SUM(
            CASE
              WHEN trang_thai =
                'NGUNG_SU_DUNG'
              THEN 1
              ELSE 0
            END
          ) AS ngung_su_dung
        FROM ban_an
        WHERE ngay_xoa IS NULL
      `,
      this.prisma.$queryRaw<
        Record<string, unknown>[]
      >`
        SELECT
          COUNT(*) AS tong_khach_hang,
          SUM(
            CASE
              WHEN DATE(ngay_tao) =
                ${ngayChon}
              THEN 1
              ELSE 0
            END
          ) AS khach_moi_hom_nay
        FROM khach_hang
        WHERE ngay_xoa IS NULL
      `,
      this.prisma.$queryRaw<
        Record<string, unknown>[]
      >`
        SELECT
          db.id,
          db.ma_dat_ban,
          db.ho_ten,
          db.so_dien_thoai,
          db.gio_bat_dau,
          db.gio_ket_thuc,
          db.so_nguoi,
          db.trang_thai,
          kv.ten_khu_vuc,
          GROUP_CONCAT(
            ba.ma_ban
            ORDER BY ba.ma_ban
            SEPARATOR ', '
          ) AS danh_sach_ma_ban
        FROM dat_ban db
        LEFT JOIN khu_vuc kv
          ON kv.id = db.khu_vuc_id
        LEFT JOIN chi_tiet_dat_ban ctdb
          ON ctdb.dat_ban_id = db.id
        LEFT JOIN ban_an ba
          ON ba.id = ctdb.ban_an_id
        WHERE db.ngay_dat = ${ngayChon}
          AND db.trang_thai IN (
            'CHO_XAC_NHAN',
            'DA_XAC_NHAN',
            'DA_CHECK_IN'
          )
        GROUP BY db.id
        ORDER BY db.gio_bat_dau
        LIMIT 10
      `,
      this.prisma.$queryRaw<
        Record<string, unknown>[]
      >`
        SELECT
          COUNT(*) AS tong_danh_gia,
          COALESCE(
            AVG(so_sao),
            0
          ) AS diem_trung_binh
        FROM danh_gia
        WHERE ngay_xoa IS NULL
          AND hien_thi = 1
      `,
      this.prisma.$queryRaw<
        Record<string, unknown>[]
      >`
        SELECT
          COALESCE(
            SUM(
              CASE
                WHEN trang_thai IN (
                  'DA_THANH_TOAN',
                  'HOAN_MOT_PHAN',
                  'DA_HOAN_TIEN'
                )
                AND DATE(DATE_ADD(thoi_gian_thanh_toan, INTERVAL 7 HOUR)) =
                  ${ngayChon}
                THEN so_tien
                ELSE 0
              END
            ),
            0
          ) AS da_thu_hom_nay,
          SUM(
            CASE
              WHEN trang_thai = 'CHO_THANH_TOAN'
              THEN 1
              ELSE 0
            END
          ) AS cho_thanh_toan
        FROM thanh_toan
      `,
      this.prisma.$queryRaw<
        Record<string, unknown>[]
      >`
        SELECT
          COALESCE(
            SUM(
              CASE
                WHEN trang_thai = 'DA_HOAN'
                AND DATE(DATE_ADD(thoi_gian_hoan, INTERVAL 7 HOUR)) =
                  ${ngayChon}
                THEN so_tien
                ELSE 0
              END
            ),
            0
          ) AS da_hoan_hom_nay,
          SUM(
            CASE
              WHEN trang_thai IN (
                'CHO_HOAN',
                'DANG_XU_LY'
              )
              THEN 1
              ELSE 0
            END
          ) AS cho_hoan_tien
        FROM hoan_tien
      `,
    ]);

    return {
      ngay: ngayChon,
      datBan: this.chuanHoaSo(
        datBanRows[0] ?? {},
      ),
      banAn: this.chuanHoaSo(
        banRows[0] ?? {},
      ),
      khachHang: this.chuanHoaSo(
        khachRows[0] ?? {},
      ),
      danhGia: this.chuanHoaSo(
        danhGiaRows[0] ?? {},
      ),
      taiChinh: {
        ...this.chuanHoaSo(
          thanhToanRows[0] ?? {},
        ),
        ...this.chuanHoaSo(
          hoanTienRows[0] ?? {},
        ),
        thucThuHomNay:
          Number(
            thanhToanRows[0]?.da_thu_hom_nay ?? 0,
          ) -
          Number(
            hoanTienRows[0]?.da_hoan_hom_nay ?? 0,
          ),
      },
      datBanGanToi: ganToi,
    };
  }

  private chuanHoaSo(
    row: Record<string, unknown>,
  ) {
    const ketQua: Record<string, unknown> = {};

    for (const [khoa, giaTri] of Object.entries(
      row,
    )) {
      ketQua[khoa] =
        giaTri == null
          ? 0
          : Number(giaTri);
    }

    return ketQua;
  }
}
