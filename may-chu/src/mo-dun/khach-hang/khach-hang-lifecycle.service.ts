import { HttpStatus, Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client';
import { LoiNghiepVuException } from '../../dung-chung/exception/loi-nghiep-vu.exception';
import {
  taoMaKhachHangTam,
  taoMaKhachHangTuId,
} from '../../dung-chung/tien-ich/ma-khach-hang';

interface ThongTinKhachHang {
  hoTen: string;
  soDienThoai: string;
  email?: string | null;
}

interface GanTaiKhoanInput extends ThongTinKhachHang {
  taiKhoanId: bigint;
}

@Injectable()
export class KhachHangLifecycleService {
  async damBaoKhachChoDatBan(
    tx: Prisma.TransactionClient,
    input: ThongTinKhachHang,
  ) {
    const thongTin = this.chuanHoa(input);

    let khach = await tx.khach_hang.findUnique({
      where: {
        so_dien_thoai: thongTin.soDienThoai,
      },
    });

    if (!khach) {
      return this.taoMoi(tx, thongTin);
    }

    if (khach.ngay_xoa) {
      khach = await tx.khach_hang.update({
        where: {
          id: khach.id,
        },
        data: {
          ho_ten: thongTin.hoTen,
          email: thongTin.email,
          trang_thai: 'HOAT_DONG',
          ngay_xoa: null,
        },
      });
    }

    if (khach.trang_thai !== 'HOAT_DONG') {
      throw new LoiNghiepVuException(
        'KHACH_HANG_004',
        'Khách hàng đang bị khóa hoặc ngừng hoạt động.',
        HttpStatus.FORBIDDEN,
      );
    }

    return khach;
  }

  async ganTaiKhoanKhiDangKy(
    tx: Prisma.TransactionClient,
    input: GanTaiKhoanInput,
  ) {
    const thongTin = this.chuanHoa(input);

    const khach = await tx.khach_hang.findUnique({
      where: {
        so_dien_thoai: thongTin.soDienThoai,
      },
    });

    if (!khach) {
      return this.taoMoi(tx, {
        ...thongTin,
        taiKhoanId: input.taiKhoanId,
      });
    }

    if (khach.tai_khoan_id) {
      throw new LoiNghiepVuException(
        'XAC_THUC_009',
        'Số điện thoại đã gắn với tài khoản khác.',
        HttpStatus.CONFLICT,
      );
    }

    if (
      !khach.ngay_xoa &&
      khach.trang_thai !== 'HOAT_DONG'
    ) {
      throw new LoiNghiepVuException(
        'XAC_THUC_015',
        'Khách hàng đang bị khóa hoặc ngừng hoạt động. Vui lòng liên hệ nhà hàng.',
        HttpStatus.FORBIDDEN,
      );
    }

    return tx.khach_hang.update({
      where: {
        id: khach.id,
      },
      data: {
        tai_khoan_id: input.taiKhoanId,
        ho_ten: thongTin.hoTen,
        email: thongTin.email,
        trang_thai: 'HOAT_DONG',
        ngay_xoa: null,
      },
    });
  }

  private async taoMoi(
    tx: Prisma.TransactionClient,
    input: ThongTinKhachHang & {
      taiKhoanId?: bigint;
    },
  ) {
    const khachMoi = await tx.khach_hang.create({
      data: {
        tai_khoan_id: input.taiKhoanId ?? null,
        ma_khach_hang: taoMaKhachHangTam(),
        ho_ten: input.hoTen,
        so_dien_thoai: input.soDienThoai,
        email: input.email ?? null,
        trang_thai: 'HOAT_DONG',
      },
    });

    return tx.khach_hang.update({
      where: {
        id: khachMoi.id,
      },
      data: {
        ma_khach_hang:
          taoMaKhachHangTuId(khachMoi.id),
      },
    });
  }

  private chuanHoa(input: ThongTinKhachHang) {
    return {
      hoTen: input.hoTen.trim(),
      soDienThoai: input.soDienThoai.trim(),
      email: input.email?.trim() || null,
    };
  }
}
