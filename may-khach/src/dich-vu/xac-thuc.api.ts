import { goiApi } from './http';
import type { BoToken, NguoiDungHienTai } from '@/kieu/nghiep-vu';

export const xacThucApi = {
  dangNhap: (duLieu: { taiKhoan: string; matKhau: string }) =>
    goiApi<BoToken>('/xac-thuc/dang-nhap', { method: 'POST', body: JSON.stringify(duLieu) }),
  dangKy: (duLieu: { hoTen: string; soDienThoai: string; email: string; matKhau: string }) =>
    goiApi<BoToken>('/xac-thuc/dang-ky', { method: 'POST', body: JSON.stringify(duLieu) }),
  hienTai: () => goiApi<NguoiDungHienTai>('/xac-thuc/thong-tin-hien-tai', { xacThuc: true }),
  dangXuat: () => goiApi<{ thongBao: string }>('/xac-thuc/dang-xuat', { method: 'POST', xacThuc: true }),
  quenMatKhau: (email: string) =>
    goiApi<{ thongBao: string; tokenDatLaiMatKhau?: string }>('/xac-thuc/quen-mat-khau', {
      method: 'POST', body: JSON.stringify({ email }),
    }),
  datLaiMatKhau: (token: string, matKhauMoi: string) =>
    goiApi<{ thongBao: string }>('/xac-thuc/dat-lai-mat-khau', {
      method: 'POST', body: JSON.stringify({ token, matKhauMoi }),
    }),
  doiMatKhau: (matKhauHienTai: string, matKhauMoi: string) =>
    goiApi<{ thongBao: string }>('/xac-thuc/doi-mat-khau', {
      method: 'POST', xacThuc: true, body: JSON.stringify({ matKhauHienTai, matKhauMoi }),
    }),
};
