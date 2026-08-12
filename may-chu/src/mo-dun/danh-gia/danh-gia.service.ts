import { HttpStatus, Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client';
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

const KEM_THONG_TIN_DANH_GIA = {
  khach_hang: {
    select: {
      ho_ten: true,
    },
  },
  nhan_vien: {
    select: {
      ho_ten: true,
    },
  },
} satisfies Prisma.danh_giaInclude;

type DanhGiaViewRow = Prisma.danh_giaGetPayload<{
  include: typeof KEM_THONG_TIN_DANH_GIA;
}>;

@Injectable()
export class DanhGiaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly nhatKy: NhatKyService,
  ) {}

  async danhSachCongKhai(
    dto: DanhSachDanhGiaDto,
  ) {
    return this.danhSachNoiBo(dto, true);
  }

  async danhSachQuanTri(
    dto: DanhSachDanhGiaDto,
  ) {
    return this.danhSachNoiBo(dto, false);
  }

  async danhSachCuaKhach(
    dto: DanhSachDanhGiaDto,
    nguoiDung: NguoiDungXacThuc,
  ) {
    const taiKhoanId = bigintTuChuoi(
      nguoiDung.taiKhoanId,
      'ID tài khoản',
    );

    const where: Prisma.danh_giaWhereInput = {
      ngay_xoa: null,
      khach_hang: {
        tai_khoan_id: taiKhoanId,
        ngay_xoa: null,
      },
      ...(dto.soSao !== undefined
        ? { so_sao: dto.soSao }
        : {}),
    };

    const skip = (dto.trang - 1) * dto.kichThuoc;

    const [rows, tong] = await Promise.all([
      this.prisma.danh_gia.findMany({
        where,
        orderBy: {
          ngay_tao: 'desc',
        },
        skip,
        take: dto.kichThuoc,
        include: KEM_THONG_TIN_DANH_GIA,
      }),
      this.prisma.danh_gia.count({ where }),
    ]);

    return {
      danhSach: rows.map((row) =>
        this.toView(row),
      ),
      phanTrang: {
        trang: dto.trang,
        kichThuoc: dto.kichThuoc,
        tong,
        tongTrang: Math.ceil(
          tong / dto.kichThuoc,
        ),
      },
    };
  }

  private async danhSachNoiBo(
    dto: DanhSachDanhGiaDto,
    congKhai: boolean,
  ) {
    const where: Prisma.danh_giaWhereInput = {
      ngay_xoa: null,
      ...(congKhai
        ? { hien_thi: true }
        : dto.hienThi !== undefined
          ? { hien_thi: dto.hienThi === 'true' }
          : {}),
      ...(dto.soSao !== undefined
        ? { so_sao: dto.soSao }
        : {}),
    };

    const skip = (dto.trang - 1) * dto.kichThuoc;

    const [rows, tong] = await Promise.all([
      this.prisma.danh_gia.findMany({
        where,
        orderBy: {
          ngay_tao: 'desc',
        },
        skip,
        take: dto.kichThuoc,
        include: KEM_THONG_TIN_DANH_GIA,
      }),
      this.prisma.danh_gia.count({ where }),
    ]);

    return {
      danhSach: rows.map((row) =>
        this.toView(row),
      ),
      phanTrang: {
        trang: dto.trang,
        kichThuoc: dto.kichThuoc,
        tong,
        tongTrang: Math.ceil(
          tong / dto.kichThuoc,
        ),
      },
    };
  }

  async taoCuaKhach(
    dto: TaoDanhGiaDto,
    nguoiDung: NguoiDungXacThuc,
  ) {
    const taiKhoanId = bigintTuChuoi(
      nguoiDung.taiKhoanId,
      'ID tài khoản',
    );

    const khach = await this.prisma.khach_hang.findFirst({
      where: {
        tai_khoan_id: taiKhoanId,
        ngay_xoa: null,
        trang_thai: 'HOAT_DONG',
      },
      select: {
        id: true,
      },
    });

    if (!khach) {
      throw new LoiNghiepVuException(
        'DANH_GIA_001',
        'Không tìm thấy hồ sơ khách hàng đang hoạt động.',
        HttpStatus.NOT_FOUND,
      );
    }

    const datBanId = bigintTuChuoi(
      dto.datBanId,
      'ID đặt bàn',
    );

    const datBan = await this.prisma.dat_ban.findFirst({
      where: {
        id: datBanId,
        khach_hang_id: khach.id,
      },
      select: {
        id: true,
        trang_thai: true,
      },
    });

    if (!datBan) {
      throw new LoiNghiepVuException(
        'DANH_GIA_002',
        'Đặt bàn không thuộc tài khoản này.',
        HttpStatus.NOT_FOUND,
      );
    }

    if (datBan.trang_thai !== 'DA_HOAN_THANH') {
      throw new LoiNghiepVuException(
        'DANH_GIA_003',
        'Chỉ được đánh giá sau khi lượt đặt bàn đã hoàn thành.',
        HttpStatus.CONFLICT,
      );
    }

    const noiDung = this.noiDungDanhGia(
      dto.noiDung,
    );

    const hienTai =
      await this.prisma.danh_gia.findUnique({
        where: {
          dat_ban_id: datBanId,
        },
        select: {
          id: true,
          ngay_xoa: true,
        },
      });

    if (hienTai && hienTai.ngay_xoa === null) {
      throw new LoiNghiepVuException(
        'DANH_GIA_004',
        'Lượt đặt bàn này đã được đánh giá.',
        HttpStatus.CONFLICT,
      );
    }

    try {
      const row = hienTai
        ? await this.prisma.danh_gia.update({
            where: {
              id: hienTai.id,
            },
            data: {
              khach_hang_id: khach.id,
              so_sao: dto.soSao,
              noi_dung: noiDung,
              phan_hoi: null,
              nguoi_phan_hoi_id: null,
              thoi_gian_phan_hoi: null,
              hien_thi: true,
              ngay_xoa: null,
            },
            select: {
              id: true,
            },
          })
        : await this.prisma.danh_gia.create({
            data: {
              khach_hang_id: khach.id,
              dat_ban_id: datBanId,
              so_sao: dto.soSao,
              noi_dung: noiDung,
              hien_thi: true,
            },
            select: {
              id: true,
            },
          });

      return this.chiTiet(
        row.id.toString(),
      );
    } catch (error: unknown) {
      if (this.laLoiTrungDuyNhat(error)) {
        throw new LoiNghiepVuException(
          'DANH_GIA_004',
          'Lượt đặt bàn này đã được đánh giá.',
          HttpStatus.CONFLICT,
        );
      }

      throw error;
    }
  }

  async capNhatCuaKhach(
    id: string,
    dto: CapNhatDanhGiaDto,
    nguoiDung: NguoiDungXacThuc,
  ) {
    const danhGiaId = bigintTuChuoi(
      id,
      'ID đánh giá',
    );
    const taiKhoanId = bigintTuChuoi(
      nguoiDung.taiKhoanId,
      'ID tài khoản',
    );

    const danhGia =
      await this.prisma.danh_gia.findFirst({
        where: {
          id: danhGiaId,
          ngay_xoa: null,
          khach_hang: {
            tai_khoan_id: taiKhoanId,
            ngay_xoa: null,
          },
        },
        select: {
          id: true,
        },
      });

    if (!danhGia) {
      throw new LoiNghiepVuException(
        'DANH_GIA_005',
        'Không tìm thấy đánh giá của bạn.',
        HttpStatus.NOT_FOUND,
      );
    }

    if (
      dto.soSao !== undefined ||
      dto.noiDung !== undefined
    ) {
      await this.prisma.danh_gia.update({
        where: {
          id: danhGiaId,
        },
        data: {
          ...(dto.soSao !== undefined
            ? { so_sao: dto.soSao }
            : {}),
          ...(dto.noiDung !== undefined
            ? {
                noi_dung: this.noiDungDanhGia(
                  dto.noiDung,
                ),
              }
            : {}),
        },
      });
    }

    return this.chiTiet(id);
  }

  async xoaCuaKhach(
    id: string,
    nguoiDung: NguoiDungXacThuc,
  ) {
    const danhGiaId = bigintTuChuoi(
      id,
      'ID đánh giá',
    );
    const taiKhoanId = bigintTuChuoi(
      nguoiDung.taiKhoanId,
      'ID tài khoản',
    );

    const danhGia =
      await this.prisma.danh_gia.findFirst({
        where: {
          id: danhGiaId,
          ngay_xoa: null,
          khach_hang: {
            tai_khoan_id: taiKhoanId,
            ngay_xoa: null,
          },
        },
        select: {
          id: true,
        },
      });

    if (!danhGia) {
      throw new LoiNghiepVuException(
        'DANH_GIA_005',
        'Không tìm thấy đánh giá của bạn.',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.prisma.danh_gia.update({
      where: {
        id: danhGiaId,
      },
      data: {
        ngay_xoa: new Date(),
        hien_thi: false,
      },
    });

    return {
      daXoa: true,
    };
  }

  async chiTiet(id: string) {
    const row = await this.prisma.danh_gia.findFirst({
      where: {
        id: bigintTuChuoi(
          id,
          'ID đánh giá',
        ),
        ngay_xoa: null,
      },
      include: KEM_THONG_TIN_DANH_GIA,
    });

    if (!row) {
      throw new LoiNghiepVuException(
        'DANH_GIA_006',
        'Không tìm thấy đánh giá.',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.toView(row);
  }

  async phanHoi(
    id: string,
    dto: PhanHoiDanhGiaDto,
    nguoiDung: NguoiDungXacThuc,
    maYeuCau?: string | null,
  ) {
    const cu = await this.chiTiet(id);
    const taiKhoanId = bigintTuChuoi(
      nguoiDung.taiKhoanId,
      'ID tài khoản',
    );

    const nhanVien =
      await this.prisma.nhan_vien.findFirst({
        where: {
          tai_khoan_id: taiKhoanId,
          ngay_xoa: null,
          trang_thai: 'HOAT_DONG',
        },
        select: {
          id: true,
        },
      });

    if (!nhanVien) {
      throw new LoiNghiepVuException(
        'DANH_GIA_007',
        'Tài khoản hiện tại chưa gắn hồ sơ nhân viên đang hoạt động.',
        HttpStatus.CONFLICT,
      );
    }

    await this.prisma.danh_gia.update({
      where: {
        id: bigintTuChuoi(
          id,
          'ID đánh giá',
        ),
      },
      data: {
        phan_hoi: dto.phanHoi.trim(),
        nguoi_phan_hoi_id: nhanVien.id,
        thoi_gian_phan_hoi: new Date(),
      },
    });

    const moi = await this.chiTiet(id);

    await this.nhatKy.ghiNhan({
      taiKhoanId: nguoiDung.taiKhoanId,
      hanhDong: 'PHAN_HOI_DANH_GIA',
      doiTuong: 'DANH_GIA',
      doiTuongId: id,
      duLieuCu: cu,
      duLieuMoi: moi,
      maYeuCau,
    });

    return moi;
  }

  async capNhatHienThi(
    id: string,
    dto: CapNhatHienThiDanhGiaDto,
    nguoiDung: NguoiDungXacThuc,
    maYeuCau?: string | null,
  ) {
    const cu = await this.chiTiet(id);

    await this.prisma.danh_gia.update({
      where: {
        id: bigintTuChuoi(
          id,
          'ID đánh giá',
        ),
      },
      data: {
        hien_thi: dto.hienThi,
      },
    });

    const moi = await this.chiTiet(id);

    await this.nhatKy.ghiNhan({
      taiKhoanId: nguoiDung.taiKhoanId,
      hanhDong:
        'CAP_NHAT_HIEN_THI_DANH_GIA',
      doiTuong: 'DANH_GIA',
      doiTuongId: id,
      duLieuCu: cu,
      duLieuMoi: moi,
      maYeuCau,
    });

    return moi;
  }

  private noiDungDanhGia(
    value?: string | null,
  ): string | null {
    const noiDung = value?.trim();
    return noiDung || null;
  }

  private laLoiTrungDuyNhat(
    error: unknown,
  ): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code ===
        'P2002'
    );
  }

  private toView(
    row: DanhGiaViewRow,
  ) {
    const {
      khach_hang: khachHang,
      nhan_vien: nhanVien,
      ...danhGia
    } = row;

    return {
      ...danhGia,
      ho_ten: khachHang.ho_ten,
      nguoi_phan_hoi:
        nhanVien?.ho_ten ?? null,
    };
  }
}
