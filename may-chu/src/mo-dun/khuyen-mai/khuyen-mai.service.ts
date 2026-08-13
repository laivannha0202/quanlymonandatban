import { HttpStatus, Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../co-so-du-lieu/prisma.service';
import { LoiNghiepVuException } from '../../dung-chung/exception/loi-nghiep-vu.exception';
import { bigintTuChuoi } from '../../dung-chung/tien-ich/id';
import type { NguoiDungXacThuc } from '../../dung-chung/types/nguoi-dung-xac-thuc.type';
import { NhatKyService } from '../nhat-ky/nhat-ky.service';
import { CapNhatKhuyenMaiDto } from './dto/cap-nhat-khuyen-mai.dto';
import { DanhSachKhuyenMaiDto } from './dto/danh-sach-khuyen-mai.dto';
import { TaoKhuyenMaiDto } from './dto/tao-khuyen-mai.dto';

type GiaTriSo = number | string | { toString(): string };

type KhuyenMaiRow = {
  id: bigint;
  ma_khuyen_mai: string;
  ten_khuyen_mai: string;
  mo_ta: string | null;
  loai_giam: string;
  gia_tri: GiaTriSo;
  gia_tri_don_toi_thieu: GiaTriSo | null;
  giam_toi_da: GiaTriSo | null;
  so_luot_toi_da: number | null;
  so_luot_moi_khach: number | null;
  ngay_bat_dau: Date;
  ngay_ket_thuc: Date;
  trang_thai: string;
  ngay_tao: Date;
  ngay_cap_nhat: Date;
  ngay_xoa: Date | null;
};

@Injectable()
export class KhuyenMaiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly nhatKy: NhatKyService,
  ) {}

  async dangApDung() {
    const hienTai = new Date();

    const rows = await this.prisma.khuyen_mai.findMany({
      where: {
        ngay_xoa: null,
        trang_thai: 'HOAT_DONG',
        ngay_bat_dau: { lte: hienTai },
        ngay_ket_thuc: { gte: hienTai },
      },
      orderBy: [
        { ngay_ket_thuc: 'asc' },
        { ten_khuyen_mai: 'asc' },
      ],
    });

    const danhSach =
      await this.toViewsWithQuota(
        rows as KhuyenMaiRow[],
      );

    return danhSach.filter(
      (item) =>
        item.so_luot_con_lai == null ||
        item.so_luot_con_lai > 0,
    );
  }

  async danhSach(dto: DanhSachKhuyenMaiDto) {
    const tuKhoa = dto.tuKhoa?.trim();

    const where: Prisma.khuyen_maiWhereInput = {
      ngay_xoa: null,
      ...(dto.trangThai
        ? { trang_thai: dto.trangThai }
        : {}),
      ...(tuKhoa
        ? {
            OR: [
              { ma_khuyen_mai: { contains: tuKhoa } },
              { ten_khuyen_mai: { contains: tuKhoa } },
            ],
          }
        : {}),
    };

    const skip = (dto.trang - 1) * dto.kichThuoc;

    const [rows, tong] = await Promise.all([
      this.prisma.khuyen_mai.findMany({
        where,
        orderBy: { ngay_tao: 'desc' },
        skip,
        take: dto.kichThuoc,
      }),
      this.prisma.khuyen_mai.count({ where }),
    ]);

    const danhSach =
      await this.toViewsWithQuota(
        rows as KhuyenMaiRow[],
      );

    return {
      danhSach,
      phanTrang: {
        trang: dto.trang,
        kichThuoc: dto.kichThuoc,
        tong,
        tongTrang: Math.ceil(tong / dto.kichThuoc),
      },
    };
  }

  async chiTiet(id: string) {
    const row = await this.prisma.khuyen_mai.findFirst({
      where: {
        id: bigintTuChuoi(id, 'ID khuyến mãi'),
        ngay_xoa: null,
      },
    });

    if (!row) {
      throw new LoiNghiepVuException(
        'KHUYEN_MAI_001',
        'Không tìm thấy khuyến mãi.',
        HttpStatus.NOT_FOUND,
      );
    }

    const [view] =
      await this.toViewsWithQuota([
        row as KhuyenMaiRow,
      ]);

    return view;
  }

  async tao(
    dto: TaoKhuyenMaiDto,
    nguoiDung: NguoiDungXacThuc,
    maYeuCau?: string | null,
  ) {
    this.kiemTra(
      dto.loaiGiam,
      dto.giaTri,
      dto.ngayBatDau,
      dto.ngayKetThuc,
      dto.giamToiDa ?? null,
    );

    this.kiemTraQuota(
      dto.soLuotToiDa ?? null,
      dto.soLuotMoiKhach ?? null,
    );

    await this.damBaoMaKhongTrung(dto.maKhuyenMai);

    const row = await this.prisma.khuyen_mai.create({
      data: {
        ma_khuyen_mai: dto.maKhuyenMai,
        ten_khuyen_mai: dto.tenKhuyenMai,
        mo_ta: dto.moTa ?? null,
        loai_giam: dto.loaiGiam,
        gia_tri: dto.giaTri,
        gia_tri_don_toi_thieu:
          dto.giaTriDonToiThieu ?? null,
        giam_toi_da:
          dto.loaiGiam === 'PHAN_TRAM'
            ? dto.giamToiDa ?? null
            : null,
        so_luot_toi_da:
          dto.soLuotToiDa ?? null,
        so_luot_moi_khach:
          dto.soLuotMoiKhach ?? null,
        ngay_bat_dau: new Date(dto.ngayBatDau),
        ngay_ket_thuc: new Date(dto.ngayKetThuc),
        trang_thai: dto.trangThai ?? 'HOAT_DONG',
      },
    });

    const [moi] =
      await this.toViewsWithQuota([
        row as KhuyenMaiRow,
      ]);

    await this.nhatKy.ghiNhan({
      taiKhoanId: nguoiDung.taiKhoanId,
      hanhDong: 'TAO_KHUYEN_MAI',
      doiTuong: 'KHUYEN_MAI',
      doiTuongId: row.id.toString(),
      duLieuMoi: moi,
      maYeuCau,
    });

    return moi;
  }

  async capNhat(
    id: string,
    dto: CapNhatKhuyenMaiDto,
    nguoiDung: NguoiDungXacThuc,
    maYeuCau?: string | null,
  ) {
    const cu = await this.chiTiet(id);
    const khuyenMaiId = bigintTuChuoi(
      id,
      'ID khuyến mãi',
    );

    if (
      dto.maKhuyenMai !== undefined &&
      dto.maKhuyenMai !== cu.ma_khuyen_mai
    ) {
      throw new LoiNghiepVuException(
        'KHUYEN_MAI_005',
        'Mã khuyến mãi được cố định sau khi tạo và không thể thay đổi.',
        HttpStatus.CONFLICT,
      );
    }

    const loaiMoi = dto.loaiGiam ?? cu.loai_giam;
    const giaTriMoi = dto.giaTri ?? cu.gia_tri;
    const ngayBatDauMoi =
      dto.ngayBatDau ?? cu.ngay_bat_dau.toISOString();
    const ngayKetThucMoi =
      dto.ngayKetThuc ?? cu.ngay_ket_thuc.toISOString();

    if (
      loaiMoi === 'SO_TIEN' &&
      dto.giamToiDa != null
    ) {
      throw new LoiNghiepVuException(
        'KHUYEN_MAI_004',
        'Khuyến mãi giảm số tiền không sử dụng trường giảm tối đa.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const giamToiDaMoi =
      loaiMoi === 'SO_TIEN'
        ? null
        : dto.giamToiDa !== undefined
          ? dto.giamToiDa
          : cu.giam_toi_da;

    const soLuotToiDaMoi =
      dto.soLuotToiDa !== undefined
        ? dto.soLuotToiDa
        : cu.so_luot_toi_da;

    const soLuotMoiKhachMoi =
      dto.soLuotMoiKhach !== undefined
        ? dto.soLuotMoiKhach
        : cu.so_luot_moi_khach;

    this.kiemTraQuota(
      soLuotToiDaMoi,
      soLuotMoiKhachMoi,
    );

    this.kiemTra(
      loaiMoi,
      giaTriMoi,
      ngayBatDauMoi,
      ngayKetThucMoi,
      giamToiDaMoi,
    );

    const row =
      await this.prisma.$transaction(
        async (tx) => {
          const [khuyenMaiDaKhoa] =
            await tx.$queryRaw<
              Array<{
                id: bigint;
                so_luot_toi_da: number | null;
                so_luot_moi_khach: number | null;
              }>
            >`
              SELECT
                id,
                so_luot_toi_da,
                so_luot_moi_khach
              FROM khuyen_mai
              WHERE id = ${khuyenMaiId}
                AND ngay_xoa IS NULL
              FOR UPDATE
            `;

          if (!khuyenMaiDaKhoa) {
            throw new LoiNghiepVuException(
              'KHUYEN_MAI_001',
              'Không tìm thấy khuyến mãi.',
              HttpStatus.NOT_FOUND,
            );
          }

          const tongMoiTrongTx =
            dto.soLuotToiDa !== undefined
              ? dto.soLuotToiDa
              : khuyenMaiDaKhoa.so_luot_toi_da;

          const moiKhachMoiTrongTx =
            dto.soLuotMoiKhach !== undefined
              ? dto.soLuotMoiKhach
              : khuyenMaiDaKhoa.so_luot_moi_khach;

          const tongDangChiem =
            await tx.su_dung_khuyen_mai.count({
              where: {
                khuyen_mai_id: khuyenMaiId,
                trang_thai: {
                  in: ['DA_GIU', 'DA_DUNG'],
                },
              },
            });

          if (
            tongMoiTrongTx != null &&
            tongMoiTrongTx < tongDangChiem
          ) {
            throw new LoiNghiepVuException(
              'KHUYEN_MAI_012',
              `Tổng lượt không thể thấp hơn ${tongDangChiem} lượt đang giữ hoặc đã dùng.`,
              HttpStatus.CONFLICT,
            );
          }

          if (moiKhachMoiTrongTx != null) {
            const [thongKeLonNhat] =
              await tx.$queryRaw<
                Array<{
                  so_luot_lon_nhat:
                    bigint | number | null;
                }>
              >`
                SELECT
                  MAX(thong_ke.so_luot) AS so_luot_lon_nhat
                FROM (
                  SELECT
                    so_dien_thoai_chuan,
                    COUNT(*) AS so_luot
                  FROM su_dung_khuyen_mai
                  WHERE khuyen_mai_id = ${khuyenMaiId}
                    AND trang_thai IN ('DA_GIU', 'DA_DUNG')
                  GROUP BY so_dien_thoai_chuan
                ) AS thong_ke
              `;

            const lonNhatMoiKhach =
              thongKeLonNhat?.so_luot_lon_nhat == null
                ? 0
                : Number(
                    thongKeLonNhat.so_luot_lon_nhat,
                  );

            if (
              moiKhachMoiTrongTx <
              lonNhatMoiKhach
            ) {
              throw new LoiNghiepVuException(
                'KHUYEN_MAI_013',
                `Lượt tối đa mỗi khách không thể thấp hơn ${lonNhatMoiKhach} lượt đang giữ hoặc đã dùng của một khách.`,
                HttpStatus.CONFLICT,
              );
            }
          }

          return tx.khuyen_mai.update({
            where: { id: khuyenMaiId },
            data: {
              ...(dto.tenKhuyenMai !== undefined
                ? {
                    ten_khuyen_mai:
                      dto.tenKhuyenMai,
                  }
                : {}),
              ...(dto.moTa !== undefined
                ? { mo_ta: dto.moTa }
                : {}),
              ...(dto.loaiGiam !== undefined
                ? { loai_giam: dto.loaiGiam }
                : {}),
              ...(dto.giaTri !== undefined
                ? { gia_tri: dto.giaTri }
                : {}),
              ...(dto.giaTriDonToiThieu !==
              undefined
                ? {
                    gia_tri_don_toi_thieu:
                      dto.giaTriDonToiThieu,
                  }
                : {}),
              ...(dto.loaiGiam === 'SO_TIEN'
                ? { giam_toi_da: null }
                : dto.giamToiDa !== undefined
                  ? {
                      giam_toi_da:
                        dto.giamToiDa,
                    }
                  : {}),
              ...(dto.soLuotToiDa !== undefined
                ? {
                    so_luot_toi_da:
                      dto.soLuotToiDa,
                  }
                : {}),
              ...(dto.soLuotMoiKhach !==
              undefined
                ? {
                    so_luot_moi_khach:
                      dto.soLuotMoiKhach,
                  }
                : {}),
              ...(dto.ngayBatDau !== undefined
                ? {
                    ngay_bat_dau:
                      new Date(
                        dto.ngayBatDau,
                      ),
                  }
                : {}),
              ...(dto.ngayKetThuc !== undefined
                ? {
                    ngay_ket_thuc:
                      new Date(
                        dto.ngayKetThuc,
                      ),
                  }
                : {}),
              ...(dto.trangThai !== undefined
                ? {
                    trang_thai:
                      dto.trangThai,
                  }
                : {}),
            },
          });
        },
      );

    const [moi] =
      await this.toViewsWithQuota([
        row as KhuyenMaiRow,
      ]);

    await this.nhatKy.ghiNhan({
      taiKhoanId: nguoiDung.taiKhoanId,
      hanhDong: 'CAP_NHAT_KHUYEN_MAI',
      doiTuong: 'KHUYEN_MAI',
      doiTuongId: id,
      duLieuCu: cu,
      duLieuMoi: moi,
      maYeuCau,
    });

    return moi;
  }

  async xoa(
    id: string,
    nguoiDung: NguoiDungXacThuc,
    maYeuCau?: string | null,
  ) {
    const cu = await this.chiTiet(id);
    const khuyenMaiId = bigintTuChuoi(
      id,
      'ID khuyến mãi',
    );

    await this.prisma.khuyen_mai.update({
      where: { id: khuyenMaiId },
      data: {
        ngay_xoa: new Date(),
        trang_thai: 'NGUNG_HOAT_DONG',
      },
    });

    await this.nhatKy.ghiNhan({
      taiKhoanId: nguoiDung.taiKhoanId,
      hanhDong: 'XOA_KHUYEN_MAI',
      doiTuong: 'KHUYEN_MAI',
      doiTuongId: id,
      duLieuCu: cu,
      maYeuCau,
    });

    return { daXoa: true };
  }

  private async damBaoMaKhongTrung(
    maKhuyenMai: string,
  ): Promise<void> {
    const trung = await this.prisma.khuyen_mai.findUnique({
      where: {
        ma_khuyen_mai: maKhuyenMai,
      },
      select: {
        id: true,
      },
    });

    if (trung) {
      throw new LoiNghiepVuException(
        'KHUYEN_MAI_002',
        'Mã khuyến mãi đã tồn tại.',
        HttpStatus.CONFLICT,
      );
    }
  }

  private kiemTra(
    loai: string,
    giaTri: number,
    batDau: string,
    ketThuc: string,
    giamToiDa?: number | null,
  ): void {
    const bd = new Date(batDau).getTime();
    const kt = new Date(ketThuc).getTime();

    if (
      !Number.isFinite(bd) ||
      !Number.isFinite(kt) ||
      kt <= bd
    ) {
      throw new LoiNghiepVuException(
        'KHUYEN_MAI_003',
        'Thời gian khuyến mãi không hợp lệ.',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      loai === 'PHAN_TRAM' &&
      (giaTri <= 0 || giaTri > 100)
    ) {
      throw new LoiNghiepVuException(
        'KHUYEN_MAI_004',
        'Khuyến mãi phần trăm phải lớn hơn 0 và không quá 100.',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      loai === 'SO_TIEN' &&
      giaTri <= 0
    ) {
      throw new LoiNghiepVuException(
        'KHUYEN_MAI_004',
        'Số tiền giảm phải lớn hơn 0.',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      loai === 'SO_TIEN' &&
      giamToiDa != null
    ) {
      throw new LoiNghiepVuException(
        'KHUYEN_MAI_004',
        'Khuyến mãi giảm số tiền không sử dụng trường giảm tối đa.',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      loai === 'PHAN_TRAM' &&
      giamToiDa != null &&
      giamToiDa <= 0
    ) {
      throw new LoiNghiepVuException(
        'KHUYEN_MAI_004',
        'Giảm tối đa phải lớn hơn 0 khi được khai báo.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }


  private async toViewsWithQuota(
    rows: KhuyenMaiRow[],
  ) {
    if (!rows.length) return [];

    const thongKe =
      await this.prisma.su_dung_khuyen_mai.groupBy({
        by: ['khuyen_mai_id', 'trang_thai'],
        where: {
          khuyen_mai_id: {
            in: rows.map((row) => row.id),
          },
          trang_thai: {
            in: ['DA_GIU', 'DA_DUNG'],
          },
        },
        _count: {
          _all: true,
        },
      });

    const map = new Map<
      string,
      { daGiu: number; daDung: number }
    >();

    for (const item of thongKe) {
      const key = item.khuyen_mai_id.toString();
      const hienTai =
        map.get(key) ?? {
          daGiu: 0,
          daDung: 0,
        };

      if (item.trang_thai === 'DA_GIU') {
        hienTai.daGiu += item._count._all;
      } else if (item.trang_thai === 'DA_DUNG') {
        hienTai.daDung += item._count._all;
      }

      map.set(key, hienTai);
    }

    return rows.map((row) =>
      this.toView(
        row,
        map.get(row.id.toString()),
      ),
    );
  }

  private kiemTraQuota(
    soLuotToiDa: number | null,
    soLuotMoiKhach: number | null,
  ): void {
    for (const [ten, value] of [
      ['Tổng lượt sử dụng', soLuotToiDa],
      ['Lượt tối đa mỗi khách', soLuotMoiKhach],
    ] as const) {
      if (
        value != null &&
        (!Number.isInteger(value) || value < 1)
      ) {
        throw new LoiNghiepVuException(
          'KHUYEN_MAI_011',
          `${ten} phải là số nguyên từ 1 trở lên hoặc để trống.`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }

  private toView(
    row: KhuyenMaiRow,
    thongKe: { daGiu: number; daDung: number } = {
      daGiu: 0,
      daDung: 0,
    },
  ) {
    const {
      ngay_xoa: _ngayXoa,
      ...duLieu
    } = row;

    return {
      ...duLieu,
      gia_tri: Number(row.gia_tri),
      gia_tri_don_toi_thieu:
        row.gia_tri_don_toi_thieu == null
          ? null
          : Number(row.gia_tri_don_toi_thieu),
      giam_toi_da:
        row.giam_toi_da == null
          ? null
          : Number(row.giam_toi_da),
      so_luot_toi_da:
        row.so_luot_toi_da,
      so_luot_moi_khach:
        row.so_luot_moi_khach,
      so_luot_da_giu:
        thongKe.daGiu,
      so_luot_da_dung:
        thongKe.daDung,
      so_luot_con_lai:
        row.so_luot_toi_da == null
          ? null
          : Math.max(
              0,
              row.so_luot_toi_da -
                thongKe.daGiu -
                thongKe.daDung,
            ),
    };
  }
}
