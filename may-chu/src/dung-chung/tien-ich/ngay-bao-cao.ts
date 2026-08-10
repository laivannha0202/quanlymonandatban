import { HttpStatus } from '@nestjs/common';
import { LoiNghiepVuException } from '../exception/loi-nghiep-vu.exception';
import { laNgayHopLe } from './ngay-gio';

export function ngayHienTaiVietNam(): string {
  const now = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return now.toISOString().slice(0, 10);
}

export function khoangNgayMacDinh(tuNgay?: string, denNgay?: string): { tuNgay: string; denNgay: string } {
  const den = denNgay || ngayHienTaiVietNam();
  const denDate = new Date(`${den}T00:00:00+07:00`);
  const tuDate = new Date(denDate.getTime() - 29 * 86_400_000);
  const tu = tuNgay || new Date(tuDate.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
  if (!laNgayHopLe(tu) || !laNgayHopLe(den)) {
    throw new LoiNghiepVuException('BAO_CAO_001', 'Khoảng ngày không hợp lệ.', HttpStatus.BAD_REQUEST);
  }
  const batDau = new Date(`${tu}T00:00:00+07:00`).getTime();
  const ketThuc = new Date(`${den}T00:00:00+07:00`).getTime();
  const soNgay = Math.floor((ketThuc - batDau) / 86_400_000) + 1;
  if (soNgay < 1 || soNgay > 366) {
    throw new LoiNghiepVuException('BAO_CAO_002', 'Khoảng báo cáo phải từ 1 đến 366 ngày.', HttpStatus.BAD_REQUEST);
  }
  return { tuNgay: tu, denNgay: den };
}
