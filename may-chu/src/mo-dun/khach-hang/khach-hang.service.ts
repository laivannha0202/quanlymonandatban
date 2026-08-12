import { HttpStatus, Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../co-so-du-lieu/prisma.service';
import { LoiNghiepVuException } from '../../dung-chung/exception/loi-nghiep-vu.exception';
import { bigintTuChuoi } from '../../dung-chung/tien-ich/id';
import type { NguoiDungXacThuc } from '../../dung-chung/types/nguoi-dung-xac-thuc.type';
import { NhatKyService } from '../nhat-ky/nhat-ky.service';
import { CapNhatHoSoKhachHangDto } from './dto/cap-nhat-ho-so-khach-hang.dto';
import { CapNhatKhachHangDto } from './dto/cap-nhat-khach-hang.dto';
import { CapNhatTrangThaiKhachHangDto } from './dto/cap-nhat-trang-thai-khach-hang.dto';
import { DanhSachKhachHangDto } from './dto/danh-sach-khach-hang.dto';

interface ThongKeKhachHang {
  tongDatBan: number;
  tongHoanThanh: number;
  tongHuy: number;
  tongKhongDen: number;
  lanDatGanNhat: Date | null;
}

type DuLieuCapNhat = CapNhatHoSoKhachHangDto | CapNhatKhachHangDto;

@Injectable()
export class KhachHangService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly nhatKy: NhatKyService,
  ) {}

  async hoSoCuaToi(taiKhoanIdChuoi: string) {
    const taiKhoanId = bigintTuChuoi(taiKhoanIdChuoi, 'ID tài khoản');
    const khach = await this.prisma.khach_hang.findFirst({
      where: { tai_khoan_id: taiKhoanId, ngay_xoa: null },
      select: {
        id: true, ma_khach_hang: true, ho_ten: true, so_dien_thoai: true,
        email: true, ngay_sinh: true, gioi_tinh: true, trang_thai: true,
        tai_khoan: {
          select: {
            ten_dang_nhap: true, email: true,
            lan_dang_nhap_cuoi: true, ngay_xoa: true,
          },
        },
      },
    });

    if (!khach?.tai_khoan || khach.tai_khoan.ngay_xoa) {
      throw new LoiNghiepVuException(
        'KHACH_HANG_001',
        'Không tìm thấy hồ sơ khách hàng.',
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      id: khach.id,
      ma_khach_hang: khach.ma_khach_hang,
      ho_ten: khach.ho_ten,
      so_dien_thoai: khach.so_dien_thoai,
      email: khach.email,
      ngay_sinh: this.dinhDangNgay(khach.ngay_sinh),
      gioi_tinh: khach.gioi_tinh,
      trang_thai: khach.trang_thai,
      ten_dang_nhap: khach.tai_khoan.ten_dang_nhap,
      email_tai_khoan: khach.tai_khoan.email,
      lan_dang_nhap_cuoi: khach.tai_khoan.lan_dang_nhap_cuoi,
    };
  }

  async capNhatHoSoCuaToi(
    taiKhoanIdChuoi: string,
    dto: CapNhatHoSoKhachHangDto,
  ) {
    const cu = await this.hoSoCuaToi(taiKhoanIdChuoi);
    const taiKhoanId = bigintTuChuoi(taiKhoanIdChuoi, 'ID tài khoản');
    const khachHangId = BigInt(String(cu.id));

    await this.damBaoThongTinKhongTrung(
      khachHangId, taiKhoanId, dto, cu.email_tai_khoan,
    );
    await this.capNhatKhachVaTaiKhoan(
      khachHangId, taiKhoanId, dto,
      cu.ten_dang_nhap, cu.email_tai_khoan,
    );

    return this.hoSoCuaToi(taiKhoanIdChuoi);
  }

  async danhSach(dto: DanhSachKhachHangDto) {
    const where = this.taoDieuKienDanhSach(dto);
    const [danhSach, tong] = await Promise.all([
      this.prisma.khach_hang.findMany({
        where,
        orderBy: { ngay_tao: 'desc' },
        skip: (dto.trang - 1) * dto.kichThuoc,
        take: dto.kichThuoc,
        select: {
          id: true, ma_khach_hang: true, tai_khoan_id: true,
          ho_ten: true, so_dien_thoai: true, email: true,
          ngay_sinh: true, gioi_tinh: true, ghi_chu: true,
          trang_thai: true, ngay_tao: true, ngay_cap_nhat: true,
        },
      }),
      this.prisma.khach_hang.count({ where }),
    ]);

    const thongKe = await this.layThongKe(danhSach.map((item) => item.id));

    return {
      danhSach: danhSach.map((item) => ({
        ...item,
        ngay_sinh: this.dinhDangNgay(item.ngay_sinh),
        ...this.thongKePhanHoi(thongKe.get(item.id.toString())),
      })),
      phanTrang: {
        trang: dto.trang,
        kichThuoc: dto.kichThuoc,
        tong,
        tongTrang: Math.ceil(tong / dto.kichThuoc),
      },
    };
  }

  async chiTiet(id: string) {
    const khachHangId = bigintTuChuoi(id, 'ID khách hàng');
    const khach = await this.prisma.khach_hang.findFirst({
      where: { id: khachHangId, ngay_xoa: null },
      select: {
        id: true, ma_khach_hang: true, tai_khoan_id: true,
        ho_ten: true, so_dien_thoai: true, email: true,
        ngay_sinh: true, gioi_tinh: true, ghi_chu: true,
        trang_thai: true, ngay_tao: true, ngay_cap_nhat: true,
        tai_khoan: {
          select: {
            ten_dang_nhap: true, email: true, lan_dang_nhap_cuoi: true,
          },
        },
      },
    });

    if (!khach) {
      throw new LoiNghiepVuException(
        'KHACH_HANG_001', 'Không tìm thấy khách hàng.', HttpStatus.NOT_FOUND,
      );
    }

    const thongKe = await this.layThongKe([khach.id]);

    return {
      id: khach.id,
      ma_khach_hang: khach.ma_khach_hang,
      tai_khoan_id: khach.tai_khoan_id,
      ho_ten: khach.ho_ten,
      so_dien_thoai: khach.so_dien_thoai,
      email: khach.email,
      ngay_sinh: this.dinhDangNgay(khach.ngay_sinh),
      gioi_tinh: khach.gioi_tinh,
      ghi_chu: khach.ghi_chu,
      trang_thai: khach.trang_thai,
      ngay_tao: khach.ngay_tao,
      ngay_cap_nhat: khach.ngay_cap_nhat,
      ten_dang_nhap: khach.tai_khoan?.ten_dang_nhap ?? null,
      email_tai_khoan: khach.tai_khoan?.email ?? null,
      lan_dang_nhap_cuoi: khach.tai_khoan?.lan_dang_nhap_cuoi ?? null,
      ...this.thongKePhanHoi(thongKe.get(khach.id.toString())),
    };
  }

  async capNhat(
    id: string,
    dto: CapNhatKhachHangDto,
    nguoiDung: NguoiDungXacThuc,
    maYeuCau?: string | null,
  ) {
    const cu = await this.chiTiet(id);
    const khachHangId = bigintTuChuoi(id, 'ID khách hàng');
    const taiKhoanId = cu.tai_khoan_id
      ? BigInt(String(cu.tai_khoan_id))
      : null;

    await this.damBaoThongTinKhongTrung(
      khachHangId, taiKhoanId, dto, cu.email_tai_khoan,
    );
    await this.capNhatKhachVaTaiKhoan(
      khachHangId, taiKhoanId, dto,
      cu.ten_dang_nhap, cu.email_tai_khoan,
    );

    const moi = await this.chiTiet(id);
    await this.nhatKy.ghiNhan({
      taiKhoanId: nguoiDung.taiKhoanId,
      hanhDong: 'CAP_NHAT_KHACH_HANG',
      doiTuong: 'KHACH_HANG',
      doiTuongId: id,
      duLieuCu: cu,
      duLieuMoi: moi,
      maYeuCau,
    });
    return moi;
  }

  async capNhatTrangThai(
    id: string,
    dto: CapNhatTrangThaiKhachHangDto,
    nguoiDung: NguoiDungXacThuc,
    maYeuCau?: string | null,
  ) {
    const cu = await this.chiTiet(id);
    const khachHangId = bigintTuChuoi(id, 'ID khách hàng');
    const taiKhoanId = cu.tai_khoan_id
      ? BigInt(String(cu.tai_khoan_id))
      : null;

    await this.prisma.$transaction(async (tx) => {
      await tx.khach_hang.update({
        where: { id: khachHangId },
        data: { trang_thai: dto.trangThai },
      });

      if (taiKhoanId) {
        await tx.tai_khoan.update({
          where: { id: taiKhoanId },
          data: {
            trang_thai: dto.trangThai,
            ...(dto.trangThai !== 'HOAT_DONG'
              ? { refresh_token_hash: null }
              : {}),
          },
        });
      }
    });

    const moi = await this.chiTiet(id);
    await this.nhatKy.ghiNhan({
      taiKhoanId: nguoiDung.taiKhoanId,
      hanhDong: 'CAP_NHAT_TRANG_THAI_KHACH_HANG',
      doiTuong: 'KHACH_HANG',
      doiTuongId: id,
      duLieuCu: cu,
      duLieuMoi: moi,
      maYeuCau,
    });
    return moi;
  }

  private taoDieuKienDanhSach(
    dto: DanhSachKhachHangDto,
  ): Prisma.khach_hangWhereInput {
    const tuKhoa = dto.tuKhoa?.trim();
    return {
      ngay_xoa: null,
      ...(dto.trangThai ? { trang_thai: dto.trangThai } : {}),
      ...(tuKhoa
        ? {
            OR: [
              { ma_khach_hang: { contains: tuKhoa } },
              { ho_ten: { contains: tuKhoa } },
              { so_dien_thoai: { contains: tuKhoa } },
              { email: { contains: tuKhoa } },
            ],
          }
        : {}),
    };
  }

  private async damBaoThongTinKhongTrung(
    khachHangId: bigint,
    taiKhoanId: bigint | null,
    dto: DuLieuCapNhat,
    emailTaiKhoanHienTai: string | null,
  ) {
    const soDienThoai = dto.soDienThoai?.trim();
    if (soDienThoai) {
      const trung = await this.prisma.khach_hang.findFirst({
        where: {
          so_dien_thoai: soDienThoai,
          NOT: { id: khachHangId },
        },
        select: { id: true },
      });
      if (trung) {
        throw new LoiNghiepVuException(
          'KHACH_HANG_002',
          'Số điện thoại đã thuộc khách hàng khác.',
          HttpStatus.CONFLICT,
        );
      }
    }

    const email = dto.email?.trim();
    if (email && taiKhoanId && email !== emailTaiKhoanHienTai) {
      const trung = await this.prisma.tai_khoan.findFirst({
        where: {
          id: { not: taiKhoanId },
          OR: [{ email }, { ten_dang_nhap: email }],
        },
        select: { id: true },
      });
      if (trung) {
        throw new LoiNghiepVuException(
          'KHACH_HANG_003',
          'Email đã được tài khoản khác sử dụng.',
          HttpStatus.CONFLICT,
        );
      }
    }
  }

  private async capNhatKhachVaTaiKhoan(
    khachHangId: bigint,
    taiKhoanId: bigint | null,
    dto: DuLieuCapNhat,
    tenDangNhapHienTai: string | null,
    emailTaiKhoanHienTai: string | null,
  ) {
    const data = this.taoDuLieuCapNhat(dto);
    const email = dto.email?.trim();

    await this.prisma.$transaction(async (tx) => {
      if (Object.keys(data).length) {
        await tx.khach_hang.update({
          where: { id: khachHangId },
          data,
        });
      }

      if (email !== undefined && taiKhoanId) {
        await tx.tai_khoan.update({
          where: { id: taiKhoanId },
          data: {
            email,
            ...(tenDangNhapHienTai === emailTaiKhoanHienTai
              ? { ten_dang_nhap: email }
              : {}),
          },
        });
      }
    });
  }

  private taoDuLieuCapNhat(
    dto: DuLieuCapNhat,
  ): Prisma.khach_hangUncheckedUpdateInput {
    const coGhiChu = 'ghiChu' in dto;
    return {
      ...(dto.hoTen !== undefined ? { ho_ten: dto.hoTen.trim() } : {}),
      ...(dto.soDienThoai !== undefined
        ? { so_dien_thoai: dto.soDienThoai.trim() }
        : {}),
      ...(dto.email !== undefined ? { email: dto.email.trim() } : {}),
      ...(dto.ngaySinh !== undefined
        ? { ngay_sinh: new Date(`${dto.ngaySinh}T00:00:00.000Z`) }
        : {}),
      ...(dto.gioiTinh !== undefined ? { gioi_tinh: dto.gioiTinh } : {}),
      ...(coGhiChu && dto.ghiChu !== undefined
        ? { ghi_chu: dto.ghiChu.trim() || null }
        : {}),
    };
  }

  private async layThongKe(ids: bigint[]) {
    const map = new Map<string, ThongKeKhachHang>(
      ids.map((id) => [
        id.toString(),
        {
          tongDatBan: 0,
          tongHoanThanh: 0,
          tongHuy: 0,
          tongKhongDen: 0,
          lanDatGanNhat: null,
        },
      ]),
    );
    if (!ids.length) return map;

    const [tongRows, trangThaiRows] = await Promise.all([
      this.prisma.dat_ban.groupBy({
        by: ['khach_hang_id'],
        where: { khach_hang_id: { in: ids } },
        _count: { _all: true },
        _max: { gio_bat_dau: true },
      }),
      this.prisma.dat_ban.groupBy({
        by: ['khach_hang_id', 'trang_thai'],
        where: {
          khach_hang_id: { in: ids },
          trang_thai: { in: ['DA_HOAN_THANH', 'DA_HUY', 'KHONG_DEN'] },
        },
        _count: { _all: true },
      }),
    ]);

    for (const row of tongRows) {
      if (!row.khach_hang_id) continue;
      const item = map.get(row.khach_hang_id.toString());
      if (!item) continue;
      item.tongDatBan = row._count._all;
      item.lanDatGanNhat = row._max.gio_bat_dau ?? null;
    }

    for (const row of trangThaiRows) {
      if (!row.khach_hang_id) continue;
      const item = map.get(row.khach_hang_id.toString());
      if (!item) continue;
      if (row.trang_thai === 'DA_HOAN_THANH') item.tongHoanThanh = row._count._all;
      if (row.trang_thai === 'DA_HUY') item.tongHuy = row._count._all;
      if (row.trang_thai === 'KHONG_DEN') item.tongKhongDen = row._count._all;
    }

    return map;
  }

  private thongKePhanHoi(thongKe?: ThongKeKhachHang) {
    return {
      tong_dat_ban: thongKe?.tongDatBan ?? 0,
      tong_hoan_thanh: thongKe?.tongHoanThanh ?? 0,
      tong_huy: thongKe?.tongHuy ?? 0,
      tong_khong_den: thongKe?.tongKhongDen ?? 0,
      lan_dat_gan_nhat: thongKe?.lanDatGanNhat ?? null,
    };
  }

  private dinhDangNgay(ngay: Date | null) {
    return ngay?.toISOString().slice(0, 10) ?? null;
  }
}
