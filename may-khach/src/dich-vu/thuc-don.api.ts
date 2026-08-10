import { goiApi, taoQuery } from './http';
import type { DanhSachPhanTrang } from '@/kieu/api';
import type { DanhMucMon, MonAn } from '@/kieu/nghiep-vu';

export const thucDonApi = {
  danhMuc: () => goiApi<DanhMucMon[]>('/thuc-don/danh-muc'),
  monAn: (thamSo: { trang?: number; kichThuoc?: number; danhMucId?: string; tuKhoa?: string } = {}) =>
    goiApi<DanhSachPhanTrang<MonAn>>(`/thuc-don/mon-an${taoQuery(thamSo)}`),
  chiTietMon: (duongDan: string) => goiApi<MonAn>(`/thuc-don/mon-an/${encodeURIComponent(duongDan)}`),
};
