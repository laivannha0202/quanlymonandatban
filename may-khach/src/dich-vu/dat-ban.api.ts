import { goiApi, taoQuery } from './http';
import type { DanhSachPhanTrang } from '@/kieu/api';
import type { DatBan, KetQuaTimBan } from '@/kieu/nghiep-vu';

export interface TaoDatBanPayload {
  hoTen: string;
  soDienThoai: string;
  email?: string;
  ngay: string;
  gioBatDau: string;
  soNguoi: number;
  khuVucId?: string;
  banAnIds?: string[];
  ghiChu?: string;
}

export const datBanApi = {
  khungGio: (ngay: string) => goiApi<{ ngay: string; danhSach: string[] }>(`/dat-ban/khung-gio${taoQuery({ ngay })}`),
  timBan: (p: { ngay: string; gioBatDau: string; soNguoi: number; khuVucId?: string }) =>
    goiApi<KetQuaTimBan>(`/ban-an/tim-ban-trong${taoQuery(p)}`),
  tao: (payload: TaoDatBanPayload) => goiApi<DatBan>('/dat-ban', { method: 'POST', body: JSON.stringify(payload) }),
  traCuu: (maDatBan: string, soDienThoai: string) =>
    goiApi<DatBan>('/dat-ban/tra-cuu', { method: 'POST', body: JSON.stringify({ maDatBan, soDienThoai }) }),
  cuaToi: (trang = 1, kichThuoc = 30) =>
    goiApi<DanhSachPhanTrang<DatBan>>(`/khach-hang/dat-ban${taoQuery({ trang, kichThuoc })}`, { xacThuc: true }),
  huyCuaToi: (id: string, lyDo?: string) =>
    goiApi<DatBan>(`/khach-hang/dat-ban/${id}/huy`, { method: 'PATCH', xacThuc: true, body: JSON.stringify({ lyDo }) }),
};
