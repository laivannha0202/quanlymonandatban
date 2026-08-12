import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../co-so-du-lieu/prisma.service';
import { LoiNghiepVuException } from '../../dung-chung/exception/loi-nghiep-vu.exception';
import { bigintTuChuoi } from '../../dung-chung/tien-ich/id';
import type { NguoiDungXacThuc } from '../../dung-chung/types/nguoi-dung-xac-thuc.type';
import { CauHinhService } from '../cau-hinh/cau-hinh.service';
import { NhatKyService } from '../nhat-ky/nhat-ky.service';
import { ThongBaoService } from '../thong-bao/thong-bao.service';
import { DatBanRepository } from './dat-ban.repository';
import { HuyDatBanDto } from './dto/huy-dat-ban.dto';
import { SapBanDto } from './dto/sap-ban.dto';

import { coTheChuyenTrangThai } from './dat-ban-state';

@Injectable()
export class DatBanWorkflowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: DatBanRepository,
    private readonly cauHinh: CauHinhService,
    private readonly thongBao: ThongBaoService,
    private readonly nhatKy: NhatKyService,
  ) {}

  async xacNhan(id: string, nguoiDung: NguoiDungXacThuc, maYeuCau?: string | null) {
    return this.chuyenTrangThai(id, 'DA_XAC_NHAN', 'XAC_NHAN', nguoiDung, undefined, maYeuCau);
  }

  async thongSoCheckIn() {
    const [checkInSomToiDaPhut, thoiGianChoKhachPhut] = await Promise.all([
      this.cauHinh.laySo('CHECK_IN_SOM_TOI_DA_PHUT'),
      this.cauHinh.laySo('THOI_GIAN_CHO_KHACH_PHUT'),
    ]);

    return { checkInSomToiDaPhut, thoiGianChoKhachPhut };
  }

  async checkIn(
    id: string,
    nguoiDung: NguoiDungXacThuc,
    maYeuCau?: string | null,
  ) {
    const datBanId = bigintTuChuoi(id, 'ID đặt bàn');

    const datBan = await this.repository.layChiTietTheoId(datBanId);

    if (!datBan) {
      throw new LoiNghiepVuException(
        'DAT_BAN_001',
        'Đặt bàn không tồn tại.',
        HttpStatus.NOT_FOUND,
      );
    }

    const checkInSomToiDaPhut = await this.cauHinh.laySo(
      'CHECK_IN_SOM_TOI_DA_PHUT',
    );

    const gioBatDau = new Date(
      `${datBan.gio_bat_dau.replace(' ', 'T')}+07:00`,
    ).getTime();

    const gioKetThuc = new Date(
      `${datBan.gio_ket_thuc.replace(' ', 'T')}+07:00`,
    ).getTime();

    const hienTai = Date.now();

    if (hienTai < gioBatDau - checkInSomToiDaPhut * 60_000) {
      throw new LoiNghiepVuException(
        'DAT_BAN_018',
        `Chỉ được check-in sớm tối đa ${checkInSomToiDaPhut} phút trước giờ đặt.`,
        HttpStatus.CONFLICT,
      );
    }

    if (hienTai >= gioKetThuc) {
      throw new LoiNghiepVuException(
        'DAT_BAN_019',
        'Đã quá thời gian phục vụ của lượt đặt bàn này.',
        HttpStatus.CONFLICT,
      );
    }

    return this.chuyenTrangThai(
      id,
      'DA_CHECK_IN',
      'CHECK_IN',
      nguoiDung,
      undefined,
      maYeuCau,
    );
  }

  async hoanThanh(id: string, nguoiDung: NguoiDungXacThuc, maYeuCau?: string | null) {
    return this.chuyenTrangThai(id, 'DA_HOAN_THANH', 'HOAN_THANH', nguoiDung, undefined, maYeuCau);
  }

  async huyQuanTri(id: string, dto: HuyDatBanDto, nguoiDung: NguoiDungXacThuc, maYeuCau?: string | null) {
    return this.chuyenTrangThai(id, 'DA_HUY', 'HUY', nguoiDung, dto.lyDo, maYeuCau);
  }

  async khongDen(id: string, nguoiDung: NguoiDungXacThuc, maYeuCau?: string | null) {
    const datBanId = bigintTuChuoi(id, 'ID đặt bàn');
    const datBan = await this.repository.layChiTietTheoId(datBanId);
    if (!datBan) throw new LoiNghiepVuException('DAT_BAN_001', 'Đặt bàn không tồn tại.', HttpStatus.NOT_FOUND);
    const thoiGianCho = await this.cauHinh.laySo('THOI_GIAN_CHO_KHACH_PHUT');
    const gioBatDau = new Date(`${datBan.gio_bat_dau.replace(' ', 'T')}+07:00`).getTime();
    if (Date.now() < gioBatDau + thoiGianCho * 60_000) {
      throw new LoiNghiepVuException('DAT_BAN_015', `Chỉ được đánh dấu không đến sau ${thoiGianCho} phút kể từ giờ đặt.`, HttpStatus.CONFLICT);
    }
    return this.chuyenTrangThai(id, 'KHONG_DEN', 'KHONG_DEN', nguoiDung, undefined, maYeuCau);
  }

  async huyCuaKhach(id: string, dto: HuyDatBanDto, nguoiDung: NguoiDungXacThuc) {
    const datBanId = bigintTuChuoi(id, 'ID đặt bàn');
    const soHuu = await this.repository.khachSoHuuDatBan(BigInt(nguoiDung.taiKhoanId), datBanId);
    if (!soHuu) throw new LoiNghiepVuException('DAT_BAN_001', 'Đặt bàn không tồn tại.', HttpStatus.NOT_FOUND);
    const datBan = await this.repository.layChiTietTheoId(datBanId);
    if (!datBan) throw new LoiNghiepVuException('DAT_BAN_001', 'Đặt bàn không tồn tại.', HttpStatus.NOT_FOUND);
    if (!['CHO_XAC_NHAN', 'DA_XAC_NHAN'].includes(datBan.trang_thai)) {
      throw new LoiNghiepVuException('DAT_BAN_007', 'Trạng thái hiện tại không cho phép khách tự hủy.', HttpStatus.CONFLICT);
    }
    const truocPhut = await this.cauHinh.laySo('THOI_GIAN_HUY_TRUOC_PHUT');
    const gioBatDau = new Date(`${datBan.gio_bat_dau.replace(' ', 'T')}+07:00`).getTime();
    if (gioBatDau - Date.now() < truocPhut * 60_000) {
      throw new LoiNghiepVuException('DAT_BAN_007', `Chỉ được tự hủy trước giờ đặt ít nhất ${truocPhut} phút.`, HttpStatus.CONFLICT);
    }
    const ketQua = await this.chuyenTrangThaiNoiBo(datBanId, 'DA_HUY', 'KHACH_HUY', BigInt(nguoiDung.taiKhoanId), dto.lyDo);
    await this.thongBao.taoChoDatBan(datBanId, 'DAT_BAN_DA_HUY', 'Đặt bàn đã hủy', `Đặt bàn ${datBan.ma_dat_ban} đã được hủy.`);
    return ketQua;
  }

  async sapBan(id: string, dto: SapBanDto, nguoiDung: NguoiDungXacThuc, maYeuCau?: string | null) {
    const datBanId = bigintTuChuoi(id, 'ID đặt bàn');
    const banIds = dto.banAnIds.map((x) => bigintTuChuoi(x, 'ID bàn'));
    const cu = await this.repository.layChiTietDayDu(datBanId);
    if (!cu) throw new LoiNghiepVuException('DAT_BAN_001', 'Đặt bàn không tồn tại.', HttpStatus.NOT_FOUND);
    if (!['CHO_XAC_NHAN', 'DA_XAC_NHAN'].includes(cu.trang_thai)) {
      throw new LoiNghiepVuException('DAT_BAN_008', 'Chỉ được sắp bàn trước khi khách check-in.', HttpStatus.CONFLICT);
    }

    await this.prisma.$transaction(async (tx) => {
      // Luôn khóa bàn trước, rồi mới khóa booking để cùng thứ tự với luồng tạo booking.
      const ban = await this.repository.khoaVaKiemTraBan(tx, banIds, cu.gio_bat_dau, cu.gio_ket_thuc, cu.so_nguoi, datBanId);
      const khoa = await this.repository.khoaDatBan(tx, datBanId);
      if (!khoa) throw new LoiNghiepVuException('DAT_BAN_001', 'Đặt bàn không tồn tại.', HttpStatus.NOT_FOUND);
      if (!['CHO_XAC_NHAN', 'DA_XAC_NHAN'].includes(khoa.trang_thai)) {
        throw new LoiNghiepVuException('DAT_BAN_008', 'Trạng thái đặt bàn vừa thay đổi, không thể sắp bàn.', HttpStatus.CONFLICT);
      }
      await tx.chi_tiet_dat_ban.deleteMany({ where: { dat_ban_id: datBanId } });
      await tx.chi_tiet_dat_ban.createMany({ data: ban.map((item) => ({ dat_ban_id: datBanId, ban_an_id: item.id })) });
      await tx.dat_ban.update({ where: { id: datBanId }, data: { khu_vuc_id: ban[0].khu_vuc_id, kieu_xep_ban: 'NHAN_VIEN_SAP_XEP' } });
      await tx.lich_su_dat_ban.create({
        data: {
          dat_ban_id: datBanId,
          trang_thai_cu: khoa.trang_thai,
          trang_thai_moi: khoa.trang_thai,
          nguoi_thuc_hien_id: BigInt(nguoiDung.taiKhoanId),
          hanh_dong: 'SAP_BAN',
          ghi_chu: `Bàn: ${ban.map((x) => x.ma_ban).join(', ')}`,
        },
      });
    }, { timeout: 10_000 });

    const moi = await this.repository.layChiTietDayDu(datBanId);
    await this.nhatKy.ghiNhan({ taiKhoanId: nguoiDung.taiKhoanId, hanhDong: 'SAP_BAN', doiTuong: 'DAT_BAN', doiTuongId: id, duLieuCu: cu, duLieuMoi: moi, maYeuCau });
    return moi;
  }

  private async chuyenTrangThai(
    id: string,
    trangThaiMoi: string,
    hanhDong: string,
    nguoiDung: NguoiDungXacThuc,
    ghiChu?: string,
    maYeuCau?: string | null,
  ) {
    const datBanId = bigintTuChuoi(id, 'ID đặt bàn');
    const cu = await this.repository.layChiTietDayDu(datBanId);
    if (!cu) throw new LoiNghiepVuException('DAT_BAN_001', 'Đặt bàn không tồn tại.', HttpStatus.NOT_FOUND);
    const moi = await this.chuyenTrangThaiNoiBo(datBanId, trangThaiMoi, hanhDong, BigInt(nguoiDung.taiKhoanId), ghiChu);
    await this.nhatKy.ghiNhan({ taiKhoanId: nguoiDung.taiKhoanId, hanhDong, doiTuong: 'DAT_BAN', doiTuongId: id, duLieuCu: cu, duLieuMoi: moi, maYeuCau });

    const thongBao = trangThaiMoi === 'DA_XAC_NHAN'
      ? ['DAT_BAN_DA_XAC_NHAN', 'Đặt bàn đã được xác nhận']
      : trangThaiMoi === 'DA_HUY'
        ? ['DAT_BAN_DA_HUY', 'Đặt bàn đã hủy']
        : null;
    if (thongBao) await this.thongBao.taoChoDatBan(datBanId, thongBao[0], thongBao[1], `Mã đặt bàn ${cu.ma_dat_ban}.`);
    return moi;
  }

  private async chuyenTrangThaiNoiBo(datBanId: bigint, trangThaiMoi: string, hanhDong: string, taiKhoanId: bigint | null, ghiChu?: string) {
    const canKhoaBan = ['DA_CHECK_IN', 'DA_HOAN_THANH'].includes(trangThaiMoi);
    const banIds = canKhoaBan
      ? (await this.prisma.chi_tiet_dat_ban.findMany({ where: { dat_ban_id: datBanId }, select: { ban_an_id: true } }))
          .map((x) => x.ban_an_id)
          .sort((a, b) => (a < b ? -1 : 1))
      : [];

    await this.prisma.$transaction(async (tx) => {
      let banDaKhoa: Array<{ id: bigint; trang_thai: string }> = [];
      if (banIds.length) {
        // Raw SQL có chủ đích: khóa trạng thái các bàn trước khi
        // check-in/hoàn thành. Prisma.join bind toàn bộ ID an toàn.
        banDaKhoa = await tx.$queryRaw<
          Array<{
            id: bigint;
            trang_thai: string;
          }>
        >(Prisma.sql`
          SELECT id, trang_thai
          FROM ban_an
          WHERE id IN (${Prisma.join(banIds)})
          ORDER BY id
          FOR UPDATE
        `);
      }

      const datBan = await this.repository.khoaDatBan(tx, datBanId);
      if (!datBan) throw new LoiNghiepVuException('DAT_BAN_001', 'Đặt bàn không tồn tại.', HttpStatus.NOT_FOUND);

      if (canKhoaBan) {
        // Có thể có request sắp bàn chạy song song sau lúc đọc banIds.
        // Sau khi khóa booking, đọc lại mapping; nếu đã đổi thì dừng và
        // yêu cầu client thử lại thay vì cập nhật nhầm trạng thái bàn cũ.
        const banHienTai = await tx.chi_tiet_dat_ban.findMany({
          where: { dat_ban_id: datBanId },
          orderBy: { ban_an_id: 'asc' },
          select: { ban_an_id: true },
        });
        const banIdsHienTai = banHienTai.map((x) => x.ban_an_id);
        const banIdsDaKhoa = banDaKhoa.map((x) => x.id);
        const mappingKhongConKhop =
          banIdsHienTai.length !== banIdsDaKhoa.length ||
          banIdsHienTai.some((id, index) => id !== banIdsDaKhoa[index]);

        if (mappingKhongConKhop) {
          throw new LoiNghiepVuException(
            'DAT_BAN_020',
            'Danh sách bàn vừa được thay đổi bởi thao tác khác. Vui lòng thử lại.',
            HttpStatus.CONFLICT,
          );
        }
      }

      const hopLe = coTheChuyenTrangThai(datBan.trang_thai, trangThaiMoi);
      if (!hopLe) {
        throw new LoiNghiepVuException('DAT_BAN_008', `Không thể chuyển từ ${datBan.trang_thai} sang ${trangThaiMoi}.`, HttpStatus.CONFLICT);
      }

      let nhanVienId: bigint | null = null;
      if (trangThaiMoi === 'DA_XAC_NHAN' && taiKhoanId) {
        const nhanVien = await tx.nhan_vien.findUnique({ where: { tai_khoan_id: taiKhoanId }, select: { id: true } });
        nhanVienId = nhanVien?.id ?? null;
      }

      if (trangThaiMoi === 'DA_CHECK_IN') {
        if (!banDaKhoa.length) throw new LoiNghiepVuException('DAT_BAN_016', 'Đặt bàn chưa được sắp bàn.', HttpStatus.CONFLICT);
        if (banDaKhoa.some((x) => x.trang_thai !== 'TRONG')) {
          throw new LoiNghiepVuException('DAT_BAN_017', 'Một hoặc nhiều bàn chưa sẵn sàng để check-in.', HttpStatus.CONFLICT);
        }
        await tx.ban_an.updateMany({ where: { id: { in: banDaKhoa.map((x) => x.id) } }, data: { trang_thai: 'DANG_SU_DUNG' } });
      }

      if (trangThaiMoi === 'DA_HOAN_THANH' && banDaKhoa.length) {
        await tx.ban_an.updateMany({ where: { id: { in: banDaKhoa.map((x) => x.id) } }, data: { trang_thai: 'TRONG' } });
      }

      await tx.dat_ban.update({
        where: { id: datBanId },
        data: {
          trang_thai: trangThaiMoi,
          ...(trangThaiMoi === 'DA_XAC_NHAN' ? { nguoi_xac_nhan_id: nhanVienId, thoi_gian_xac_nhan: new Date() } : {}),
          ...(trangThaiMoi === 'DA_CHECK_IN' ? { thoi_gian_check_in: new Date() } : {}),
          ...(trangThaiMoi === 'DA_HOAN_THANH' ? { thoi_gian_hoan_thanh: new Date() } : {}),
          ...(trangThaiMoi === 'DA_HUY' ? { thoi_gian_huy: new Date(), ly_do_huy: ghiChu ?? null } : {}),
        },
      });
      await tx.lich_su_dat_ban.create({
        data: {
          dat_ban_id: datBanId,
          trang_thai_cu: datBan.trang_thai,
          trang_thai_moi: trangThaiMoi,
          nguoi_thuc_hien_id: taiKhoanId,
          hanh_dong: hanhDong,
          ghi_chu: ghiChu ?? null,
        },
      });
    }, { timeout: 10_000 });

    return this.repository.layChiTietDayDu(datBanId);
  }
}
