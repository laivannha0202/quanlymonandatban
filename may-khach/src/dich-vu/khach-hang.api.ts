import { goiApi } from './http';
import type { TrangThaiKhachHang } from '@/kieu/trang-thai';

export interface HoSoKhachHang {
  id: string;
  maKhachHang: string;
  hoTen: string;
  soDienThoai: string;
  email?: string | null;
  ngaySinh?: string | null;
  gioiTinh?: string | null;
  ghiChu?: string | null;
  trangThai: TrangThaiKhachHang;
}

export const khachHangApi = {
  hoSo: () => goiApi<HoSoKhachHang>('/khach-hang/ho-so', { xacThuc: true }),
  capNhatHoSo: (payload: Partial<Pick<HoSoKhachHang, 'hoTen' | 'soDienThoai' | 'email' | 'ngaySinh' | 'gioiTinh'>>) =>
    goiApi<HoSoKhachHang>('/khach-hang/ho-so', { method: 'PATCH', xacThuc: true, body: JSON.stringify(payload) }),
};
