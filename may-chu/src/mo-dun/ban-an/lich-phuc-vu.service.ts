import { HttpStatus, Injectable } from '@nestjs/common';
import { LoiNghiepVuException } from '../../dung-chung/exception/loi-nghiep-vu.exception';
import {
  gioThanhPhut,
  laNgayHopLe,
  phutThanhGio,
  soPhutTuHienTaiDen,
  thuTrongTuan,
} from '../../dung-chung/tien-ich/ngay-gio';
import { CauHinhService } from '../cau-hinh/cau-hinh.service';
import { GioHoatDongService } from '../gio-hoat-dong/gio-hoat-dong.service';
import { NgayDacBietService } from '../ngay-dac-biet/ngay-dac-biet.service';

export interface KhoangPhucVu {
  gioMoCua: string;
  gioDongCua: string;
  nguon: 'LICH_TUAN' | 'NGAY_DAC_BIET';
}

@Injectable()
export class LichPhucVuService {
  constructor(
    private readonly cauHinh: CauHinhService,
    private readonly gioHoatDong: GioHoatDongService,
    private readonly ngayDacBiet: NgayDacBietService,
  ) {}

  async layKhoangPhucVu(ngay: string): Promise<KhoangPhucVu[]> {
    if (!laNgayHopLe(ngay)) {
      throw new LoiNghiepVuException('DAT_BAN_011', 'Ngày đặt bàn không hợp lệ.');
    }

    const dacBiet = await this.ngayDacBiet.layTheoNgay(ngay);
    if (dacBiet) {
      if (Boolean(dacBiet.dong_cua_ca_ngay)) return [];
      if (!dacBiet.gio_mo_cua || !dacBiet.gio_dong_cua) return [];
      return [{
        gioMoCua: dacBiet.gio_mo_cua,
        gioDongCua: dacBiet.gio_dong_cua,
        nguon: 'NGAY_DAC_BIET',
      }];
    }

    const lich = await this.gioHoatDong.layTheoThu(thuTrongTuan(ngay));
    return lich.map((item) => ({
      gioMoCua: item.gio_mo_cua,
      gioDongCua: item.gio_dong_cua,
      nguon: 'LICH_TUAN' as const,
    }));
  }

  async tinhGioKetThuc(ngay: string, gioBatDau: string): Promise<string> {
    const thoiLuong = await this.cauHinh.laySo('THOI_LUONG_DAT_BAN_PHUT');
    const batDau = gioThanhPhut(gioBatDau);
    const ketThuc = batDau + thoiLuong;
    const cacKhoang = await this.layKhoangPhucVu(ngay);

    const hopLe = cacKhoang.some((khoang) => {
      const mo = gioThanhPhut(khoang.gioMoCua);
      const dong = gioThanhPhut(khoang.gioDongCua);
      return batDau >= mo && ketThuc <= dong;
    });

    if (!hopLe) {
      throw new LoiNghiepVuException(
        'DAT_BAN_003',
        'Khung giờ đã chọn nằm ngoài thời gian phục vụ hoặc không đủ thời lượng cho một lượt đặt bàn.',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    return phutThanhGio(ketThuc);
  }

  async kiemTraQuyTacThoiGian(ngay: string, gioBatDau: string): Promise<void> {
    if (!laNgayHopLe(ngay)) {
      throw new LoiNghiepVuException('DAT_BAN_011', 'Ngày đặt bàn không hợp lệ.');
    }

    const phutTuHienTai = soPhutTuHienTaiDen(ngay, gioBatDau);
    const toiThieu = await this.cauHinh.laySo('DAT_TRUOC_TOI_THIEU_PHUT');
    const toiDaNgay = await this.cauHinh.laySo('DAT_TRUOC_TOI_DA_NGAY');

    if (phutTuHienTai < toiThieu) {
      throw new LoiNghiepVuException(
        'DAT_BAN_005',
        `Bạn phải đặt trước ít nhất ${toiThieu} phút.`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    if (phutTuHienTai > toiDaNgay * 1440) {
      throw new LoiNghiepVuException(
        'DAT_BAN_006',
        `Chỉ được đặt trước tối đa ${toiDaNgay} ngày.`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  async taoKhungGio(ngay: string): Promise<string[]> {
    const choPhep = await this.cauHinh.layBoolean('CHO_PHEP_DAT_BAN');
    if (!choPhep) return [];

    const khoangCach = await this.cauHinh.laySo('KHOANG_CACH_SLOT_PHUT');
    const thoiLuong = await this.cauHinh.laySo('THOI_LUONG_DAT_BAN_PHUT');
    const toiThieu = await this.cauHinh.laySo('DAT_TRUOC_TOI_THIEU_PHUT');
    const toiDaNgay = await this.cauHinh.laySo('DAT_TRUOC_TOI_DA_NGAY');
    const cacKhoang = await this.layKhoangPhucVu(ngay);
    const ketQua: string[] = [];

    for (const khoang of cacKhoang) {
      const mo = gioThanhPhut(khoang.gioMoCua);
      const dong = gioThanhPhut(khoang.gioDongCua);
      for (let phut = mo; phut + thoiLuong <= dong; phut += khoangCach) {
        const gio = phutThanhGio(phut);
        const cachHienTai = soPhutTuHienTaiDen(ngay, gio);
        if (cachHienTai >= toiThieu && cachHienTai <= toiDaNgay * 1440) {
          ketQua.push(gio);
        }
      }
    }

    return [...new Set(ketQua)].sort();
  }
}
