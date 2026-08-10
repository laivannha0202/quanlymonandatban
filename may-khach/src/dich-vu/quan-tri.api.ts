import { goiApi, taoQuery } from './http';
import type { DanhSachPhanTrang } from '@/kieu/api';
import type { DatBan, MonAn } from '@/kieu/nghiep-vu';

export interface DashboardData {
  ngay: string;
  datBan: Record<string, number>;
  banAn: Record<string, number>;
  khachHang: Record<string, number>;
  danhGia: Record<string, number>;
  datBanGanToi: DatBan[];
}

export interface KhuVucQuanTri {
  id: string;
  maKhuVuc: string;
  tenKhuVuc: string;
  moTa?: string | null;
  hinhAnh?: string | null;
  thuTu: number;
  trangThai: string;
}

export interface BanAnQuanTri {
  id: string;
  maBan: string;
  tenBan: string;
  khuVucId: string;
  tenKhuVuc?: string;
  sucChua: number;
  sucChuaToiDa: number;
  viTriX?: number | null;
  viTriY?: number | null;
  trangThai: string;
  ghiChu?: string | null;
}

export interface LienKetBanQuanTri {
  id: string;
  ban1Id: string;
  ban2Id: string;
  coTheGhep: boolean;
  ghiChu?: string | null;
}

export interface KhachHangQuanTri {
  id: string;
  hoTen: string;
  soDienThoai: string;
  email?: string | null;
  trangThai: string;
  tongDatBan?: number;
  tongHoanThanh?: number;
}

export interface NhanVienQuanTri {
  id: string;
  maNhanVien: string;
  hoTen: string;
  email?: string | null;
  trangThai: string;
  maVaiTro?: string;
  tenVaiTro?: string;
}

export type KhuVucPayload = {
  maKhuVuc: string;
  tenKhuVuc: string;
  moTa?: string;
  hinhAnh?: string;
  thuTu?: number;
  trangThai?: string;
};

export type BanAnPayload = {
  maBan: string;
  tenBan: string;
  khuVucId: string;
  sucChua: number;
  sucChuaToiDa: number;
  viTriX?: number;
  viTriY?: number;
  trangThai?: string;
  ghiChu?: string;
};

export type MonAnPayload = {
  maMon: string;
  danhMucId: string;
  tenMon: string;
  duongDan?: string;
  moTa?: string;
  gia: number;
  giaKhuyenMai?: number;
  hinhAnhChinh?: string;
  laMonNoiBat?: boolean;
  conMon?: boolean;
  trangThai?: string;
};

export type HinhAnhMonPayload = {
  duongDanAnh: string;
  altText?: string;
  thuTu?: number;
  laAnhChinh?: boolean;
};

export const quanTriApi = {
  dashboard: () => goiApi<DashboardData>('/quan-tri/dashboard', { xacThuc: true }),
  datBan: (p: Record<string, string | number | undefined> = {}) =>
    goiApi<DanhSachPhanTrang<DatBan>>(`/quan-tri/dat-ban${taoQuery({ trang: 1, kichThuoc: 50, ...p })}`, { xacThuc: true }),
  chuyenTrangThaiDatBan: (id: string, hanhDong: 'xac-nhan' | 'check-in' | 'hoan-thanh' | 'khong-den' | 'huy') =>
    goiApi<DatBan>(`/quan-tri/dat-ban/${id}/${hanhDong}`, {
      method: 'PATCH', xacThuc: true, body: hanhDong === 'huy' ? JSON.stringify({}) : undefined,
    }),

  khuVuc: (p: { tuKhoa?: string; trangThai?: string } = {}) =>
    goiApi<KhuVucQuanTri[]>(`/quan-tri/khu-vuc${taoQuery(p)}`, { xacThuc: true }),
  taoKhuVuc: (duLieu: KhuVucPayload) => goiApi<KhuVucQuanTri>('/quan-tri/khu-vuc', { method: 'POST', xacThuc: true, body: JSON.stringify(duLieu) }),
  capNhatKhuVuc: (id: string, duLieu: Partial<KhuVucPayload>) => goiApi<KhuVucQuanTri>(`/quan-tri/khu-vuc/${id}`, { method: 'PATCH', xacThuc: true, body: JSON.stringify(duLieu) }),
  xoaKhuVuc: (id: string) => goiApi<{ daXoa: boolean }>(`/quan-tri/khu-vuc/${id}`, { method: 'DELETE', xacThuc: true }),

  banAn: (p: Record<string, string | number | undefined> = {}) =>
    goiApi<DanhSachPhanTrang<BanAnQuanTri>>(`/quan-tri/ban-an${taoQuery({ trang: 1, kichThuoc: 20, ...p })}`, { xacThuc: true }),
  taoBanAn: (duLieu: BanAnPayload) => goiApi<BanAnQuanTri>('/quan-tri/ban-an', { method: 'POST', xacThuc: true, body: JSON.stringify(duLieu) }),
  capNhatBanAn: (id: string, duLieu: Partial<BanAnPayload>) => goiApi<BanAnQuanTri>(`/quan-tri/ban-an/${id}`, { method: 'PATCH', xacThuc: true, body: JSON.stringify(duLieu) }),
  xoaBanAn: (id: string) => goiApi<{ daXoa: boolean }>(`/quan-tri/ban-an/${id}`, { method: 'DELETE', xacThuc: true }),
  lienKetBan: () => goiApi<LienKetBanQuanTri[]>('/quan-tri/ban-an/lien-ket', { xacThuc: true }),
  taoLienKetBan: (duLieu: { ban1Id: string; ban2Id: string; coTheGhep?: boolean; ghiChu?: string }) =>
    goiApi<LienKetBanQuanTri>('/quan-tri/ban-an/lien-ket', { method: 'POST', xacThuc: true, body: JSON.stringify(duLieu) }),
  capNhatLienKetBan: (id: string, duLieu: { coTheGhep?: boolean; ghiChu?: string }) =>
    goiApi<LienKetBanQuanTri>(`/quan-tri/ban-an/lien-ket/${id}`, { method: 'PATCH', xacThuc: true, body: JSON.stringify(duLieu) }),
  xoaLienKetBan: (id: string) => goiApi<{ daXoa: boolean }>(`/quan-tri/ban-an/lien-ket/${id}`, { method: 'DELETE', xacThuc: true }),

  monAn: (p: Record<string, string | number | undefined> = {}) =>
    goiApi<DanhSachPhanTrang<MonAn>>(`/quan-tri/mon-an${taoQuery({ trang: 1, kichThuoc: 20, ...p })}`, { xacThuc: true }),
  monAnChiTiet: (id: string) => goiApi<MonAn>(`/quan-tri/mon-an/${id}`, { xacThuc: true }),
  taoMonAn: (duLieu: MonAnPayload) => goiApi<MonAn>('/quan-tri/mon-an', { method: 'POST', xacThuc: true, body: JSON.stringify(duLieu) }),
  capNhatMonAn: (id: string, duLieu: Partial<MonAnPayload>) => goiApi<MonAn>(`/quan-tri/mon-an/${id}`, { method: 'PATCH', xacThuc: true, body: JSON.stringify(duLieu) }),
  xoaMonAn: (id: string) => goiApi<{ daXoa: boolean }>(`/quan-tri/mon-an/${id}`, { method: 'DELETE', xacThuc: true }),
  themHinhMon: (id: string, duLieu: HinhAnhMonPayload) => goiApi<MonAn>(`/quan-tri/mon-an/${id}/hinh-anh`, { method: 'POST', xacThuc: true, body: JSON.stringify(duLieu) }),
  capNhatHinhMon: (id: string, hinhId: string, duLieu: Partial<HinhAnhMonPayload>) => goiApi<MonAn>(`/quan-tri/mon-an/${id}/hinh-anh/${hinhId}`, { method: 'PATCH', xacThuc: true, body: JSON.stringify(duLieu) }),
  xoaHinhMon: (id: string, hinhId: string) => goiApi<MonAn>(`/quan-tri/mon-an/${id}/hinh-anh/${hinhId}`, { method: 'DELETE', xacThuc: true }),

  khachHang: () => goiApi<DanhSachPhanTrang<KhachHangQuanTri>>('/quan-tri/khach-hang?trang=1&kichThuoc=100', { xacThuc: true }),
  nhanVien: () => goiApi<DanhSachPhanTrang<NhanVienQuanTri>>('/quan-tri/nhan-vien?trang=1&kichThuoc=100', { xacThuc: true }),
};
