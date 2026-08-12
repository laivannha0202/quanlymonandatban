import { HttpStatus, Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../co-so-du-lieu/prisma.service';
import { LoiNghiepVuException } from '../../dung-chung/exception/loi-nghiep-vu.exception';
import { bigintTuChuoi } from '../../dung-chung/tien-ich/id';
import {
  dateWallClockTuNgay,
  laNgayHopLe,
  ngayTuDateWallClock,
} from '../../dung-chung/tien-ich/ngay-gio';
import type { NguoiDungXacThuc } from '../../dung-chung/types/nguoi-dung-xac-thuc.type';
import { NhatKyService } from '../nhat-ky/nhat-ky.service';
import { CapNhatNhanVienDto } from './dto/cap-nhat-nhan-vien.dto';
import { CapNhatTrangThaiNhanVienDto } from './dto/cap-nhat-trang-thai-nhan-vien.dto';
import { DanhSachNhanVienDto } from './dto/danh-sach-nhan-vien.dto';
import { TaoNhanVienDto } from './dto/tao-nhan-vien.dto';

type NhanVienViewRow = {
  id: bigint;
  tai_khoan_id: bigint;
  ma_nhan_vien: string;
  ho_ten: string;
  so_dien_thoai: string | null;
  email: string | null;
  ngay_vao_lam: Date | null;
  ghi_chu: string | null;
  trang_thai: string;
  ngay_tao: Date;
  ngay_cap_nhat: Date;
  tai_khoan: {
    ten_dang_nhap: string | null;
    email: string;
    trang_thai: string;
    bat_buoc_doi_mat_khau: boolean;
    lan_dang_nhap_cuoi: Date | null;
    vai_tro: {
      id: bigint;
      ma_vai_tro: string;
      ten_vai_tro: string;
    };
  };
};

const CHON_NHAN_VIEN = {
  id: true,
  tai_khoan_id: true,
  ma_nhan_vien: true,
  ho_ten: true,
  so_dien_thoai: true,
  email: true,
  ngay_vao_lam: true,
  ghi_chu: true,
  trang_thai: true,
  ngay_tao: true,
  ngay_cap_nhat: true,
  tai_khoan: {
    select: {
      ten_dang_nhap: true,
      email: true,
      trang_thai: true,
      bat_buoc_doi_mat_khau: true,
      lan_dang_nhap_cuoi: true,
      vai_tro: {
        select: {
          id: true,
          ma_vai_tro: true,
          ten_vai_tro: true,
        },
      },
    },
  },
} satisfies Prisma.nhan_vienSelect;

@Injectable()
export class NhanVienService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly nhatKy: NhatKyService,
  ) {}

  async danhSach(dto: DanhSachNhanVienDto) {
    const tuKhoa = dto.tuKhoa?.trim();

    const where: Prisma.nhan_vienWhereInput = {
      ngay_xoa: null,
      trang_thai: dto.trangThai ?? undefined,
      tai_khoan: {
        ngay_xoa: null,
        vai_tro: {
          ...(dto.maVaiTro
            ? { ma_vai_tro: dto.maVaiTro }
            : {}),
        },
      },
      ...(tuKhoa
        ? {
            OR: [
              { ma_nhan_vien: { contains: tuKhoa } },
              { ho_ten: { contains: tuKhoa } },
              { so_dien_thoai: { contains: tuKhoa } },
              {
                tai_khoan: {
                  email: { contains: tuKhoa },
                },
              },
            ],
          }
        : {}),
    };

    const skip = (dto.trang - 1) * dto.kichThuoc;

    const [rows, tong] = await Promise.all([
      this.prisma.nhan_vien.findMany({
        where,
        orderBy: {
          ngay_tao: 'desc',
        },
        skip,
        take: dto.kichThuoc,
        select: CHON_NHAN_VIEN,
      }),
      this.prisma.nhan_vien.count({ where }),
    ]);

    return {
      danhSach: rows.map((row) =>
        this.toView(row as NhanVienViewRow),
      ),
      phanTrang: {
        trang: dto.trang,
        kichThuoc: dto.kichThuoc,
        tong,
        tongTrang: Math.ceil(tong / dto.kichThuoc),
      },
    };
  }

  async chiTiet(id: string) {
    const row = await this.prisma.nhan_vien.findFirst({
      where: {
        id: bigintTuChuoi(id, 'ID nhân viên'),
        ngay_xoa: null,
        tai_khoan: {
          ngay_xoa: null,
        },
      },
      select: CHON_NHAN_VIEN,
    });

    if (!row) {
      throw new LoiNghiepVuException(
        'NHAN_VIEN_001',
        'Không tìm thấy nhân viên.',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.toView(row as NhanVienViewRow);
  }

  async tao(
    dto: TaoNhanVienDto,
    nguoiDung: NguoiDungXacThuc,
    maYeuCau?: string | null,
  ) {
    const maVaiTro = dto.maVaiTro?.trim() || 'NHAN_VIEN';
    const vaiTro = await this.damBaoVaiTroNhanVien(maVaiTro);

    const tenDangNhap =
      dto.tenDangNhap?.trim() || dto.email;

    await this.damBaoKhongTrungKhiTao(
      dto.maNhanVien,
      dto.email,
      tenDangNhap,
    );

    const ngayVaoLam =
      dto.ngayVaoLam !== undefined
        ? this.ngayVaoLam(dto.ngayVaoLam)
        : null;

    const matKhauHash = await argon2.hash(dto.matKhau);
    const trangThaiNhanVien =
      dto.trangThai ?? 'HOAT_DONG';

    const nhanVien = await this.prisma.$transaction(
      async (tx) => {
        const taiKhoan = await tx.tai_khoan.create({
          data: {
            ten_dang_nhap: tenDangNhap,
            email: dto.email,
            mat_khau: matKhauHash,
            vai_tro_id: vaiTro.id,
            trang_thai:
              this.trangThaiTaiKhoan(trangThaiNhanVien),
            bat_buoc_doi_mat_khau: true,
          },
          select: {
            id: true,
          },
        });

        return tx.nhan_vien.create({
          data: {
            tai_khoan_id: taiKhoan.id,
            ma_nhan_vien: dto.maNhanVien,
            ho_ten: dto.hoTen,
            so_dien_thoai: dto.soDienThoai ?? null,
            email: dto.email,
            ngay_vao_lam: ngayVaoLam,
            ghi_chu: dto.ghiChu ?? null,
            trang_thai: trangThaiNhanVien,
          },
          select: {
            id: true,
          },
        });
      },
    );

    const moi = await this.chiTiet(
      nhanVien.id.toString(),
    );

    await this.nhatKy.ghiNhan({
      taiKhoanId: nguoiDung.taiKhoanId,
      hanhDong: 'TAO_NHAN_VIEN',
      doiTuong: 'NHAN_VIEN',
      doiTuongId: nhanVien.id.toString(),
      duLieuMoi: moi,
      maYeuCau,
    });

    return moi;
  }

  async capNhat(
    id: string,
    dto: CapNhatNhanVienDto,
    nguoiDung: NguoiDungXacThuc,
    maYeuCau?: string | null,
  ) {
    const cu = await this.chiTiet(id);
    const nhanVienId = bigintTuChuoi(
      id,
      'ID nhân viên',
    );
    const taiKhoanId = cu.tai_khoan_id;

    if (
      dto.maVaiTro &&
      taiKhoanId.toString() === nguoiDung.taiKhoanId &&
      dto.maVaiTro !== cu.ma_vai_tro
    ) {
      throw new LoiNghiepVuException(
        'NHAN_VIEN_005',
        'Không thể tự thay đổi vai trò của chính tài khoản đang đăng nhập.',
        HttpStatus.CONFLICT,
      );
    }

    let vaiTroId: bigint | undefined;
    if (
      dto.maVaiTro !== undefined &&
      dto.maVaiTro !== cu.ma_vai_tro
    ) {
      const vaiTro =
        await this.damBaoVaiTroNhanVien(
          dto.maVaiTro,
        );
      vaiTroId = vaiTro.id;
    }

    if (
      dto.email !== undefined &&
      dto.email !== cu.email_tai_khoan
    ) {
      const trung = await this.prisma.tai_khoan.findFirst({
        where: {
          id: { not: taiKhoanId },
          email: dto.email,
        },
        select: {
          id: true,
        },
      });

      if (trung) {
        throw new LoiNghiepVuException(
          'NHAN_VIEN_003',
          'Email đã được tài khoản khác sử dụng.',
          HttpStatus.CONFLICT,
        );
      }
    }

    const ngayVaoLam =
      dto.ngayVaoLam !== undefined
        ? this.ngayVaoLam(dto.ngayVaoLam)
        : undefined;

    const matKhauHash =
      dto.matKhauMoi !== undefined
        ? await argon2.hash(dto.matKhauMoi)
        : undefined;

    await this.prisma.$transaction(async (tx) => {
      await tx.nhan_vien.update({
        where: {
          id: nhanVienId,
        },
        data: {
          ...(dto.hoTen !== undefined
            ? { ho_ten: dto.hoTen }
            : {}),
          ...(dto.soDienThoai !== undefined
            ? { so_dien_thoai: dto.soDienThoai }
            : {}),
          ...(dto.email !== undefined
            ? { email: dto.email }
            : {}),
          ...(ngayVaoLam !== undefined
            ? { ngay_vao_lam: ngayVaoLam }
            : {}),
          ...(dto.ghiChu !== undefined
            ? { ghi_chu: dto.ghiChu }
            : {}),
        },
      });

      await tx.tai_khoan.update({
        where: {
          id: taiKhoanId,
        },
        data: {
          ...(dto.email !== undefined
            ? { email: dto.email }
            : {}),
          ...(vaiTroId !== undefined
            ? {
                vai_tro_id: vaiTroId,
                refresh_token_hash: null,
              }
            : {}),
          ...(matKhauHash !== undefined
            ? {
                mat_khau: matKhauHash,
                bat_buoc_doi_mat_khau: true,
                refresh_token_hash: null,
                so_lan_dang_nhap_sai: 0,
                khoa_den: null,
              }
            : {}),
        },
      });
    });

    const moi = await this.chiTiet(id);

    await this.nhatKy.ghiNhan({
      taiKhoanId: nguoiDung.taiKhoanId,
      hanhDong: 'CAP_NHAT_NHAN_VIEN',
      doiTuong: 'NHAN_VIEN',
      doiTuongId: id,
      duLieuCu: cu,
      duLieuMoi: moi,
      maYeuCau,
    });

    return moi;
  }

  async capNhatTrangThai(
    id: string,
    dto: CapNhatTrangThaiNhanVienDto,
    nguoiDung: NguoiDungXacThuc,
    maYeuCau?: string | null,
  ) {
    const cu = await this.chiTiet(id);

    if (
      cu.tai_khoan_id.toString() === nguoiDung.taiKhoanId &&
      dto.trangThai !== 'HOAT_DONG'
    ) {
      throw new LoiNghiepVuException(
        'NHAN_VIEN_004',
        'Không thể tự khóa hoặc cho chính tài khoản đang đăng nhập nghỉ việc.',
        HttpStatus.CONFLICT,
      );
    }

    const nhanVienId = bigintTuChuoi(
      id,
      'ID nhân viên',
    );
    const taiKhoanId = cu.tai_khoan_id;

    await this.prisma.$transaction(async (tx) => {
      await tx.nhan_vien.update({
        where: {
          id: nhanVienId,
        },
        data: {
          trang_thai: dto.trangThai,
        },
      });

      await tx.tai_khoan.update({
        where: {
          id: taiKhoanId,
        },
        data: {
          trang_thai:
            this.trangThaiTaiKhoan(dto.trangThai),
          refresh_token_hash: null,
        },
      });
    });

    const moi = await this.chiTiet(id);

    await this.nhatKy.ghiNhan({
      taiKhoanId: nguoiDung.taiKhoanId,
      hanhDong: 'CAP_NHAT_TRANG_THAI_NHAN_VIEN',
      doiTuong: 'NHAN_VIEN',
      doiTuongId: id,
      duLieuCu: cu,
      duLieuMoi: moi,
      maYeuCau,
    });

    return moi;
  }

  private async damBaoVaiTroNhanVien(
    maVaiTro: string,
  ) {
    const vaiTro = await this.prisma.vai_tro.findFirst({
      where: {
        ma_vai_tro: maVaiTro,
        trang_thai: 'HOAT_DONG',
      },
      select: {
        id: true,
        ma_vai_tro: true,
      },
    });

    if (
      !vaiTro ||
      vaiTro.ma_vai_tro === 'KHACH_HANG'
    ) {
      throw new LoiNghiepVuException(
        'NHAN_VIEN_002',
        'Vai trò nhân viên không tồn tại, đã ngừng hoạt động hoặc không hợp lệ.',
        HttpStatus.BAD_REQUEST,
      );
    }

    return vaiTro;
  }

  private async damBaoKhongTrungKhiTao(
    maNhanVien: string,
    email: string,
    tenDangNhap: string,
  ): Promise<void> {
    const [trungMa, trungEmail, trungTenDangNhap] =
      await Promise.all([
        this.prisma.nhan_vien.findUnique({
          where: {
            ma_nhan_vien: maNhanVien,
          },
          select: {
            id: true,
          },
        }),
        this.prisma.tai_khoan.findUnique({
          where: {
            email,
          },
          select: {
            id: true,
          },
        }),
        this.prisma.tai_khoan.findUnique({
          where: {
            ten_dang_nhap: tenDangNhap,
          },
          select: {
            id: true,
          },
        }),
      ]);

    if (
      trungMa ||
      trungEmail ||
      trungTenDangNhap
    ) {
      throw new LoiNghiepVuException(
        'NHAN_VIEN_003',
        'Mã nhân viên, email hoặc tên đăng nhập đã tồn tại.',
        HttpStatus.CONFLICT,
      );
    }
  }

  private ngayVaoLam(value: string): Date {
    if (!laNgayHopLe(value)) {
      throw new LoiNghiepVuException(
        'NHAN_VIEN_006',
        'Ngày vào làm không hợp lệ.',
        HttpStatus.BAD_REQUEST,
      );
    }

    return dateWallClockTuNgay(value);
  }

  private trangThaiTaiKhoan(
    trangThaiNhanVien: string,
  ): string {
    if (trangThaiNhanVien === 'HOAT_DONG') {
      return 'HOAT_DONG';
    }

    if (trangThaiNhanVien === 'TAM_NGHI') {
      return 'BI_KHOA';
    }

    return 'NGUNG_HOAT_DONG';
  }

  private toView(
    row: NhanVienViewRow,
  ) {
    return {
      id: row.id,
      tai_khoan_id: row.tai_khoan_id,
      ma_nhan_vien: row.ma_nhan_vien,
      ho_ten: row.ho_ten,
      so_dien_thoai: row.so_dien_thoai,
      email: row.email,
      ngay_vao_lam:
        row.ngay_vao_lam == null
          ? null
          : ngayTuDateWallClock(row.ngay_vao_lam),
      ghi_chu: row.ghi_chu,
      trang_thai: row.trang_thai,
      ngay_tao: row.ngay_tao,
      ngay_cap_nhat: row.ngay_cap_nhat,
      ten_dang_nhap:
        row.tai_khoan.ten_dang_nhap,
      email_tai_khoan:
        row.tai_khoan.email,
      trang_thai_tai_khoan:
        row.tai_khoan.trang_thai,
      bat_buoc_doi_mat_khau:
        row.tai_khoan.bat_buoc_doi_mat_khau,
      lan_dang_nhap_cuoi:
        row.tai_khoan.lan_dang_nhap_cuoi,
      vai_tro_id:
        row.tai_khoan.vai_tro.id,
      ma_vai_tro:
        row.tai_khoan.vai_tro.ma_vai_tro,
      ten_vai_tro:
        row.tai_khoan.vai_tro.ten_vai_tro,
    };
  }
}
