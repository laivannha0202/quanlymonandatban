import { HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../co-so-du-lieu/prisma.service';
import { LoiNghiepVuException } from '../../dung-chung/exception/loi-nghiep-vu.exception';
import { bigintTuChuoi } from '../../dung-chung/tien-ich/id';
import { ngayGioSql } from '../../dung-chung/tien-ich/ngay-gio';
import type { NguoiDungXacThuc } from '../../dung-chung/types/nguoi-dung-xac-thuc.type';
import { CauHinhService } from '../cau-hinh/cau-hinh.service';
import { LichPhucVuService } from '../ban-an/lich-phuc-vu.service';
import { TimBanTrongService } from '../ban-an/tim-ban-trong.service';
import { KhachHangLifecycleService } from '../khach-hang/khach-hang-lifecycle.service';
import { NhatKyService } from '../nhat-ky/nhat-ky.service';
import { ThongBaoService } from '../thong-bao/thong-bao.service';
import { ThanhToanService } from '../thanh-toan/thanh-toan.service';
import { CapNhatThongTinDatBanDto } from './dto/cap-nhat-thong-tin-dat-ban.dto';
import { DanhSachDatBanDto } from './dto/danh-sach-dat-ban.dto';
import { TaoDatBanAdminDto } from './dto/tao-dat-ban-admin.dto';
import { TaoDatBanDto } from './dto/tao-dat-ban.dto';
import { TraCuuDatBanDto } from './dto/tra-cuu-dat-ban.dto';
import { DatBanRepository } from './dat-ban.repository';
import { DatBanTinhTienService } from './dat-ban-tinh-tien.service';

interface TaoDatBanNoiBo extends TaoDatBanDto {
  nguonDat: 'WEBSITE' | 'DIEN_THOAI' | 'FACEBOOK' | 'TRUC_TIEP' | 'KHAC';
  xacNhanNgay: boolean;
  ghiChuNoiBo?: string;
  taiKhoanThucHienId?: string;
  laQuanTri: boolean;
}

@Injectable()
export class DatBanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: DatBanRepository,
    private readonly tinhTien: DatBanTinhTienService,
    private readonly thanhToan: ThanhToanService,
    private readonly timBanTrong: TimBanTrongService,
    private readonly lichPhucVu: LichPhucVuService,
    private readonly cauHinh: CauHinhService,
    private readonly thongBao: ThongBaoService,
    private readonly nhatKy: NhatKyService,
    private readonly khachHangLifecycle: KhachHangLifecycleService,
  ) {}

  async taoPublic(dto: TaoDatBanDto) {
    const choPhep = await this.cauHinh.layBoolean('CHO_PHEP_DAT_BAN');
    if (!choPhep) {
      throw new LoiNghiepVuException('DAT_BAN_010', 'Nhà hàng đang tạm ngừng nhận đặt bàn trực tuyến.', HttpStatus.SERVICE_UNAVAILABLE);
    }
    const toiDa = await this.cauHinh.laySo('SO_NGUOI_TOI_DA_MOI_DAT_BAN');
    if (dto.soNguoi > toiDa) {
      throw new LoiNghiepVuException('DAT_BAN_004', `Mỗi lượt đặt online tối đa ${toiDa} khách.`, HttpStatus.UNPROCESSABLE_ENTITY);
    }
    await this.lichPhucVu.kiemTraQuyTacThoiGian(dto.ngay, dto.gioBatDau);
    return this.taoNoiBo({ ...dto, nguonDat: 'WEBSITE', xacNhanNgay: false, laQuanTri: false });
  }

  async taoQuanTri(dto: TaoDatBanAdminDto, nguoiDung: NguoiDungXacThuc, maYeuCau?: string | null) {
    const mocDat = new Date(`${dto.ngay}T${dto.gioBatDau}:00+07:00`).getTime();
    if (!Number.isFinite(mocDat) || mocDat < Date.now() - 60_000) {
      throw new LoiNghiepVuException('DAT_BAN_020', 'Không thể tạo đặt bàn ở thời điểm đã qua.', HttpStatus.UNPROCESSABLE_ENTITY);
    }
    if (!dto.banAnIds?.length) {
      throw new LoiNghiepVuException('DAT_BAN_018', 'Khi tạo đặt bàn tại trang quản trị, nhân viên cần chọn ít nhất một bàn.', HttpStatus.UNPROCESSABLE_ENTITY);
    }
    const ketQua = await this.taoNoiBo({
      ...dto,
      nguonDat: dto.nguonDat ?? 'TRUC_TIEP',
      xacNhanNgay: dto.xacNhanNgay ?? true,
      ghiChuNoiBo: dto.ghiChuNoiBo,
      taiKhoanThucHienId: nguoiDung.taiKhoanId,
      laQuanTri: true,
    });
    await this.nhatKy.ghiNhan({
      taiKhoanId: nguoiDung.taiKhoanId,
      hanhDong: 'TAO_DAT_BAN', doiTuong: 'DAT_BAN', doiTuongId: ketQua.id.toString(),
      duLieuMoi: ketQua, maYeuCau,
    });
    return ketQua;
  }

  private async taoNoiBo(input: TaoDatBanNoiBo) {
    await this.thanhToan.huyDatBanQuaHanThanhToan();
    const gioKetThuc = await this.lichPhucVu.tinhGioKetThuc(input.ngay, input.gioBatDau);
    let banIds = (input.banAnIds ?? []).map((id) => bigintTuChuoi(id, 'ID bàn'));

    if (!banIds.length) {
      const goiY = await this.timBanTrong.tim({
        ngay: input.ngay, gioBatDau: input.gioBatDau, soNguoi: input.soNguoi, khuVucId: input.khuVucId,
      });
      if (!goiY.phuongAn.length) {
        throw new LoiNghiepVuException('DAT_BAN_002', 'Không còn bàn phù hợp trong khung giờ đã chọn.', HttpStatus.CONFLICT);
      }
      banIds = goiY.phuongAn[0].banAns.map((ban) => ban.id);
    }

    const gioBatDauSql = ngayGioSql(input.ngay, input.gioBatDau);
    const gioKetThucSql = ngayGioSql(input.ngay, gioKetThuc);

    const ketQua = await this.prisma.$transaction(async (tx) => {
      const ban = await this.repository.khoaVaKiemTraBan(tx, banIds, gioBatDauSql, gioKetThucSql, input.soNguoi);
      if (input.khuVucId && ban[0].khu_vuc_id !== bigintTuChuoi(input.khuVucId, 'ID khu vực')) {
        throw new LoiNghiepVuException('DAT_BAN_019', 'Bàn đã chọn không thuộc khu vực yêu cầu.', HttpStatus.UNPROCESSABLE_ENTITY);
      }

      // Báo giá lại bên trong chính transaction tạo booking.
      // Frontend chỉ gửi ID món/số lượng/mã ưu đãi; giá và tiền giảm luôn lấy từ DB.
      const baoGia = await this.tinhTien.tinhTrongTransaction(tx, {
        monAn: input.monAn,
        maKhuyenMai: input.maKhuyenMai,
      });

      const khach =
        await this.khachHangLifecycle.damBaoKhachChoDatBan(
          tx,
          {
            hoTen: input.hoTen,
            soDienThoai: input.soDienThoai,
            email: input.email,
          },
        );

      const khachHangId = khach.id;

      let nhanVienId: bigint | null = null;
      if (input.xacNhanNgay && input.taiKhoanThucHienId) {
        const nhanVien = await tx.nhan_vien.findUnique({
          where: { tai_khoan_id: BigInt(input.taiKhoanThucHienId) }, select: { id: true },
        });
        nhanVienId = nhanVien?.id ?? null;
      }

      const trangThai =
        input.xacNhanNgay
          ? 'DA_XAC_NHAN'
          : 'CHO_XAC_NHAN';

      const kieuXepBan =
        input.banAnIds?.length
          ? input.laQuanTri
            ? 'NHAN_VIEN_SAP_XEP'
            : 'KHACH_CHON_BAN'
          : 'HE_THONG_SAP_XEP';

      const datBanMoi =
        await tx.dat_ban.create({
          data: {
            ma_dat_ban:
              `TMP-${randomUUID()}`,
            khach_hang_id:
              khachHangId,
            khu_vuc_id:
              ban[0].khu_vuc_id,
            khuyen_mai_id:
              baoGia.khuyenMai
                ? BigInt(baoGia.khuyenMai.id)
                : null,
            ho_ten:
              input.hoTen.trim(),
            so_dien_thoai:
              input.soDienThoai.trim(),
            email:
              input.email?.trim() ||
              null,
            ngay_dat:
              new Date(
                `${input.ngay}T00:00:00.000Z`,
              ),
            gio_bat_dau:
              new Date(
                `${input.ngay}T${input.gioBatDau}:00.000Z`,
              ),
            gio_ket_thuc:
              new Date(
                `${input.ngay}T${gioKetThuc}:00.000Z`,
              ),
            so_nguoi:
              input.soNguoi,
            trang_thai:
              trangThai,
            nguon_dat:
              input.nguonDat,
            kieu_xep_ban:
              kieuXepBan,
            ma_khuyen_mai_ap_dung:
              baoGia.khuyenMai?.maKhuyenMai ?? null,
            tam_tinh_mon:
              baoGia.tamTinhMon,
            tien_giam:
              baoGia.tienGiam,
            tien_coc:
              baoGia.tienCoc,
            tong_thanh_toan_truoc:
              baoGia.tongThanhToanTruoc,
            ghi_chu_khach:
              input.ghiChu?.trim() ||
              null,
            ghi_chu_noi_bo:
              input.ghiChuNoiBo?.trim() ||
              null,
            nguoi_xac_nhan_id:
              nhanVienId,
            thoi_gian_xac_nhan:
              input.xacNhanNgay
                ? new Date()
                : null,
          },
          select: {
            id: true,
          },
        });

      const id = datBanMoi.id;

      if (baoGia.khuyenMai) {
        await this.tinhTien.giuKhuyenMaiTrongTransaction(
          tx,
          {
            khuyenMaiId:
              BigInt(baoGia.khuyenMai.id),
            datBanId: id,
            soDienThoai:
              khach.so_dien_thoai,
          },
        );
      }

      if (
        baoGia.khuyenMai &&
        trangThai === 'DA_XAC_NHAN'
      ) {
        await this.thanhToan.danhDauKhuyenMaiDaDungTrongTransaction(
          tx,
          id,
        );
      }

      const maDatBan =
        `DB${input.ngay.replaceAll('-', '')}-` +
        id.toString().padStart(6, '0');

      await tx.dat_ban.update({
        where: { id },
        data: {
          ma_dat_ban: maDatBan,
        },
      });
      await tx.chi_tiet_dat_ban.createMany({
        data: ban.map((item) => ({
          dat_ban_id: id,
          ban_an_id: item.id,
        })),
      });

      if (baoGia.monAn.length) {
        await tx.chi_tiet_dat_mon.createMany({
          data: baoGia.monAn.map((item) => ({
            dat_ban_id: id,
            mon_an_id: BigInt(item.monAnId),
            ma_mon: item.maMon,
            ten_mon: item.tenMon,
            don_gia: item.donGia,
            so_luong: item.soLuong,
            thanh_tien: item.thanhTien,
            ghi_chu: item.ghiChu,
          })),
        });
      }

      let thanhToan: {
        id: bigint;
        maThanhToan: string;
        soTien: number;
        phuongThuc: string;
        trangThai: string;
      } | null = null;

      // Mọi booking có số tiền phải thu trước đều phải có payment ledger.
      // Booking website sẽ thanh toán qua luồng khách; booking do nhân viên
      // tạo sẽ nằm CHO_THANH_TOAN để nhân viên có quyền tài chính ghi nhận
      // phương thức thực tế sau đó.
      if (baoGia.tongThanhToanTruoc > 0) {
        const maThanhToan =
          `TT${input.ngay.replaceAll('-', '')}-` +
          id.toString().padStart(6, '0');

        const payment = await tx.thanh_toan.create({
          data: {
            ma_thanh_toan: maThanhToan,
            dat_ban_id: id,
            so_tien: baoGia.tongThanhToanTruoc,
            phuong_thuc: 'MO_PHONG',
            trang_thai: 'CHO_THANH_TOAN',
            ghi_chu:
              input.laQuanTri
                ? `Khoản cần thu trước cho đặt bàn ${maDatBan} do nhân viên tạo.`
                : `Thanh toán trước cho đặt bàn ${maDatBan}.`,
          },
          select: {
            id: true,
            ma_thanh_toan: true,
            so_tien: true,
            phuong_thuc: true,
            trang_thai: true,
          },
        });

        thanhToan = {
          id: payment.id,
          maThanhToan: payment.ma_thanh_toan,
          soTien: Math.round(Number(payment.so_tien)),
          phuongThuc: payment.phuong_thuc,
          trangThai: payment.trang_thai,
        };
      }

      await tx.lich_su_dat_ban.create({
        data: {
          dat_ban_id: id,
          trang_thai_cu: null,
          trang_thai_moi: trangThai,
          nguoi_thuc_hien_id: input.taiKhoanThucHienId ? BigInt(input.taiKhoanThucHienId) : null,
          hanh_dong: input.xacNhanNgay ? 'TAO_VA_XAC_NHAN' : 'TAO_DAT_BAN',
          ghi_chu: null,
        },
      });
      return {
        id,
        maDatBan,
        trangThai,
        hoTen: input.hoTen.trim(),
        soDienThoai: input.soDienThoai.trim(),
        email: input.email?.trim() || null,
        ngay: input.ngay,
        ngayDat: input.ngay,
        gioBatDau: input.gioBatDau,
        gioKetThuc,
        soNguoi: input.soNguoi,
        ghiChuKhach: input.ghiChu?.trim() || null,
        banAns: ban,
        monAn: baoGia.monAn,
        khuyenMai: baoGia.khuyenMai,
        tamTinhMon: baoGia.tamTinhMon,
        tienGiam: baoGia.tienGiam,
        tienMonSauGiam: baoGia.tienMonSauGiam,
        tienMonThanhToanTruoc: baoGia.tienMonThanhToanTruoc,
        tienCoc: baoGia.tienCoc,
        tongThanhToanTruoc: baoGia.tongThanhToanTruoc,
        thanhToan,
      };
    }, { timeout: 10_000 });

    await this.thongBao.taoChoDatBan(
      ketQua.id,
      ketQua.trangThai === 'DA_XAC_NHAN' ? 'DAT_BAN_DA_XAC_NHAN' : 'DAT_BAN_DA_TAO',
      ketQua.trangThai === 'DA_XAC_NHAN' ? 'Đặt bàn đã được xác nhận' : 'Đã nhận yêu cầu đặt bàn',
      `Mã đặt bàn ${ketQua.maDatBan}, ${ketQua.ngay} lúc ${ketQua.gioBatDau}.`,
    );
    return ketQua;
  }

  async traCuu(dto: TraCuuDatBanDto) {
    const ketQua = await this.repository.traCuu(dto.maDatBan.trim(), dto.soDienThoai.trim());
    if (!ketQua) throw new LoiNghiepVuException('DAT_BAN_001', 'Không tìm thấy đặt bàn phù hợp.', HttpStatus.NOT_FOUND);
    const { ghi_chu_noi_bo: _bo, ...publicData } = ketQua;
    return publicData;
  }

  async danhSachQuanTri(dto: DanhSachDatBanDto) { return this.repository.danhSachQuanTri(dto); }

  async chiTietQuanTri(id: string) {
    const ketQua = await this.repository.layChiTietDayDu(bigintTuChuoi(id, 'ID đặt bàn'));
    if (!ketQua) throw new LoiNghiepVuException('DAT_BAN_001', 'Đặt bàn không tồn tại.', HttpStatus.NOT_FOUND);
    return ketQua;
  }

  async danhSachCuaKhach(nguoiDung: NguoiDungXacThuc, trang: number, kichThuoc: number) {
    return this.repository.danhSachCuaKhach(BigInt(nguoiDung.taiKhoanId), trang, kichThuoc);
  }

  async chiTietCuaKhach(id: string, nguoiDung: NguoiDungXacThuc) {
    const datBanId = bigintTuChuoi(id, 'ID đặt bàn');
    const soHuu = await this.repository.khachSoHuuDatBan(BigInt(nguoiDung.taiKhoanId), datBanId);
    if (!soHuu) throw new LoiNghiepVuException('DAT_BAN_001', 'Đặt bàn không tồn tại.', HttpStatus.NOT_FOUND);
    const ketQua = await this.repository.layChiTietDayDu(datBanId);
    if (!ketQua) throw new LoiNghiepVuException('DAT_BAN_001', 'Đặt bàn không tồn tại.', HttpStatus.NOT_FOUND);
    const { ghi_chu_noi_bo: _bo, ...publicData } = ketQua;
    return publicData;
  }

  async capNhatThongTin(id: string, dto: CapNhatThongTinDatBanDto, nguoiDung: NguoiDungXacThuc, maYeuCau?: string | null) {
    const datBanId = bigintTuChuoi(id, 'ID đặt bàn');
    const cu = await this.repository.layChiTietTheoId(datBanId);
    if (!cu) throw new LoiNghiepVuException('DAT_BAN_001', 'Đặt bàn không tồn tại.', HttpStatus.NOT_FOUND);
    if (['DA_HOAN_THANH', 'DA_HUY', 'KHONG_DEN'].includes(cu.trang_thai)) {
      throw new LoiNghiepVuException('DAT_BAN_008', 'Không thể sửa đặt bàn đã kết thúc.', HttpStatus.CONFLICT);
    }
    const moi = await this.prisma.dat_ban.update({
      where: { id: datBanId },
      data: {
        ...(dto.hoTen !== undefined ? { ho_ten: dto.hoTen } : {}),
        ...(dto.soDienThoai !== undefined ? { so_dien_thoai: dto.soDienThoai } : {}),
        ...(dto.email !== undefined ? { email: dto.email || null } : {}),
        ...(dto.ghiChuKhach !== undefined ? { ghi_chu_khach: dto.ghiChuKhach || null } : {}),
        ...(dto.ghiChuNoiBo !== undefined ? { ghi_chu_noi_bo: dto.ghiChuNoiBo || null } : {}),
      },
    });
    await this.nhatKy.ghiNhan({ taiKhoanId: nguoiDung.taiKhoanId, hanhDong: 'CAP_NHAT_DAT_BAN', doiTuong: 'DAT_BAN', doiTuongId: id, duLieuCu: cu, duLieuMoi: moi, maYeuCau });
    return this.repository.layChiTietDayDu(datBanId);
  }
}
