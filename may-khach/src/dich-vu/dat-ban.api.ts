import { goiApi, taoQuery } from './http';
import type { DanhSachPhanTrang } from '@/kieu/api';
import type {
  DatBan,
  KetQuaTimBan,
  KhuyenMaiDatBan,
  MonDatTruoc,
  ThanhToanTaoDatBan,
} from '@/kieu/nghiep-vu';

export interface MonDatTruocPayload {
  monAnId: string;
  soLuong: number;
  ghiChu?: string;
}

export interface TinhTienDatBanPayload {
  monAn?: MonDatTruocPayload[];
  maKhuyenMai?: string;

  soDienThoai?: string;}

export interface BaoGiaDatBan {
  monAn: MonDatTruoc[];
  khuyenMai: KhuyenMaiDatBan | null;
  tamTinhMon: number;
  tienGiam: number;
  tienMonSauGiam: number;
  tienMonThanhToanTruoc: number;
  tienCoc: number;
  tongThanhToanTruoc: number;
  yeuCauThanhToanMonTruoc: boolean;
}

export interface KetQuaTaoDatBan extends Omit<DatBan, 'thanhToan'> {
  monAn?: MonDatTruoc[];
  khuyenMai?: KhuyenMaiDatBan | null;
  tamTinhMon?: number;
  tienGiam?: number;
  tienMonSauGiam?: number;
  tienMonThanhToanTruoc?: number;
  tienCoc?: number;
  tongThanhToanTruoc?: number;
  thanhToan?: ThanhToanTaoDatBan | null;
}

export interface TaoDatBanPayload {
  hoTen: string;
  soDienThoai: string;
  email?: string;
  ngay: string;
  gioBatDau: string;
  soNguoi: number;
  khuVucId?: string;
  banAnIds?: string[];
  monAn?: MonDatTruocPayload[];
  maKhuyenMai?: string;
  ghiChu?: string;
}

export const datBanApi = {
  khungGio: (ngay: string) => goiApi<{ ngay: string; danhSach: string[] }>(`/dat-ban/khung-gio${taoQuery({ ngay })}`),
  timBan: (p: { ngay: string; gioBatDau: string; soNguoi: number; khuVucId?: string }) =>
    goiApi<KetQuaTimBan>(`/ban-an/tim-ban-trong${taoQuery(p)}`),
  tinhTien: (payload: TinhTienDatBanPayload) =>
    goiApi<BaoGiaDatBan>('/dat-ban/tinh-tien', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  tao: (payload: TaoDatBanPayload) =>
    goiApi<KetQuaTaoDatBan>('/dat-ban', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  traCuu: (maDatBan: string, soDienThoai: string) =>
    goiApi<DatBan>('/dat-ban/tra-cuu', { method: 'POST', body: JSON.stringify({ maDatBan, soDienThoai }) }),
  cuaToi: (trang = 1, kichThuoc = 30) =>
    goiApi<DanhSachPhanTrang<DatBan>>(`/khach-hang/dat-ban${taoQuery({ trang, kichThuoc })}`, { xacThuc: true }),
  chiTietCuaToi: (id: string) =>
    goiApi<DatBan>(`/khach-hang/dat-ban/${id}`, { xacThuc: true }),
  huyCuaToi: (id: string, lyDo?: string) =>
    goiApi<DatBan>(`/khach-hang/dat-ban/${id}/huy`, { method: 'PATCH', xacThuc: true, body: JSON.stringify({ lyDo }) }),
};
