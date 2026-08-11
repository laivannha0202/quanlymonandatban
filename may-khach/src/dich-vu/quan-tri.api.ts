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
  maKhachHang?: string | null;
  taiKhoanId?: string | null;
  hoTen: string;
  soDienThoai: string;
  email?: string | null;
  ngaySinh?: string | null;
  gioiTinh?: 'NAM' | 'NU' | 'KHAC' | null;
  ghiChu?: string | null;
  trangThai: 'HOAT_DONG' | 'BI_KHOA' | 'NGUNG_HOAT_DONG';
  tongDatBan?: number;
  tongHoanThanh?: number;
  tongHuy?: number;
  tongKhongDen?: number;
  lanDatGanNhat?: string | null;
  tenDangNhap?: string | null;
  emailTaiKhoan?: string | null;
  lanDangNhapCuoi?: string | null;
}

export interface NhanVienQuanTri {
  id: string;
  taiKhoanId: string;
  maNhanVien: string;
  hoTen: string;
  soDienThoai?: string | null;
  email?: string | null;
  ngayVaoLam?: string | null;
  ghiChu?: string | null;
  trangThai: 'HOAT_DONG' | 'TAM_NGHI' | 'DA_NGHI';
  vaiTroId: string;
  maVaiTro: string;
  tenVaiTro: string;
  tenDangNhap?: string | null;
  emailTaiKhoan?: string | null;
  trangThaiTaiKhoan?: string;
  batBuocDoiMatKhau?: boolean;
  lanDangNhapCuoi?: string | null;
}

export interface CauHinhQuanTri {
  id: string;
  khoa: string;
  giaTri: string;
  kieuDuLieu: 'CHUOI' | 'SO' | 'BOOLEAN' | 'JSON';
  nhom: string;
  moTa?: string | null;
  choPhepSua: boolean;
}

export interface GioHoatDongQuanTri {
  id: string;
  thuTrongTuan: number;
  caSo: number;
  gioMoCua: string;
  gioDongCua: string;
  hoatDong: boolean;
  ghiChu?: string | null;
}

export interface NgayDacBietQuanTri {
  id: string;
  ngay: string;
  tenSuKien: string;
  dongCuaCaNgay: boolean;
  gioMoCua?: string | null;
  gioDongCua?: string | null;
  ghiChu?: string | null;
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

export type KhachHangPayload = {
  hoTen?: string;
  soDienThoai?: string;
  email?: string;
  ngaySinh?: string;
  gioiTinh?: 'NAM' | 'NU' | 'KHAC';
  ghiChu?: string;
};

export type TaoNhanVienPayload = {
  maNhanVien: string;
  hoTen: string;
  email: string;
  tenDangNhap?: string;
  matKhau: string;
  maVaiTro?: string;
  soDienThoai?: string;
  ngayVaoLam?: string;
  ghiChu?: string;
  trangThai?: 'HOAT_DONG' | 'TAM_NGHI' | 'DA_NGHI';
};

export type CapNhatNhanVienPayload = {
  hoTen?: string;
  soDienThoai?: string;
  email?: string;
  maVaiTro?: string;
  ngayVaoLam?: string;
  ghiChu?: string;
  matKhauMoi?: string;
};

export type GioHoatDongPayload = {
  thuTrongTuan: number;
  caSo: number;
  gioMoCua: string;
  gioDongCua: string;
  hoatDong?: boolean;
  ghiChu?: string;
};

export type NgayDacBietPayload = {
  ngay: string;
  tenSuKien: string;
  dongCuaCaNgay: boolean;
  gioMoCua?: string;
  gioDongCua?: string;
  ghiChu?: string;
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
  taoKhuVuc: (duLieu: KhuVucPayload) =>
    goiApi<KhuVucQuanTri>('/quan-tri/khu-vuc', { method: 'POST', xacThuc: true, body: JSON.stringify(duLieu) }),
  capNhatKhuVuc: (id: string, duLieu: Partial<KhuVucPayload>) =>
    goiApi<KhuVucQuanTri>(`/quan-tri/khu-vuc/${id}`, { method: 'PATCH', xacThuc: true, body: JSON.stringify(duLieu) }),
  xoaKhuVuc: (id: string) =>
    goiApi<{ daXoa: boolean }>(`/quan-tri/khu-vuc/${id}`, { method: 'DELETE', xacThuc: true }),

  banAn: (p: Record<string, string | number | undefined> = {}) =>
    goiApi<DanhSachPhanTrang<BanAnQuanTri>>(`/quan-tri/ban-an${taoQuery({ trang: 1, kichThuoc: 20, ...p })}`, { xacThuc: true }),
  taoBanAn: (duLieu: BanAnPayload) =>
    goiApi<BanAnQuanTri>('/quan-tri/ban-an', { method: 'POST', xacThuc: true, body: JSON.stringify(duLieu) }),
  capNhatBanAn: (id: string, duLieu: Partial<BanAnPayload>) =>
    goiApi<BanAnQuanTri>(`/quan-tri/ban-an/${id}`, { method: 'PATCH', xacThuc: true, body: JSON.stringify(duLieu) }),
  xoaBanAn: (id: string) =>
    goiApi<{ daXoa: boolean }>(`/quan-tri/ban-an/${id}`, { method: 'DELETE', xacThuc: true }),
  lienKetBan: () =>
    goiApi<LienKetBanQuanTri[]>('/quan-tri/ban-an/lien-ket', { xacThuc: true }),
  taoLienKetBan: (duLieu: { ban1Id: string; ban2Id: string; coTheGhep?: boolean; ghiChu?: string }) =>
    goiApi<LienKetBanQuanTri>('/quan-tri/ban-an/lien-ket', { method: 'POST', xacThuc: true, body: JSON.stringify(duLieu) }),
  capNhatLienKetBan: (id: string, duLieu: { coTheGhep?: boolean; ghiChu?: string }) =>
    goiApi<LienKetBanQuanTri>(`/quan-tri/ban-an/lien-ket/${id}`, { method: 'PATCH', xacThuc: true, body: JSON.stringify(duLieu) }),
  xoaLienKetBan: (id: string) =>
    goiApi<{ daXoa: boolean }>(`/quan-tri/ban-an/lien-ket/${id}`, { method: 'DELETE', xacThuc: true }),

  monAn: (p: Record<string, string | number | undefined> = {}) =>
    goiApi<DanhSachPhanTrang<MonAn>>(`/quan-tri/mon-an${taoQuery({ trang: 1, kichThuoc: 20, ...p })}`, { xacThuc: true }),
  monAnChiTiet: (id: string) =>
    goiApi<MonAn>(`/quan-tri/mon-an/${id}`, { xacThuc: true }),
  taoMonAn: (duLieu: MonAnPayload) =>
    goiApi<MonAn>('/quan-tri/mon-an', { method: 'POST', xacThuc: true, body: JSON.stringify(duLieu) }),
  capNhatMonAn: (id: string, duLieu: Partial<MonAnPayload>) =>
    goiApi<MonAn>(`/quan-tri/mon-an/${id}`, { method: 'PATCH', xacThuc: true, body: JSON.stringify(duLieu) }),
  xoaMonAn: (id: string) =>
    goiApi<{ daXoa: boolean }>(`/quan-tri/mon-an/${id}`, { method: 'DELETE', xacThuc: true }),
  themHinhMon: (id: string, duLieu: HinhAnhMonPayload) =>
    goiApi<MonAn>(`/quan-tri/mon-an/${id}/hinh-anh`, { method: 'POST', xacThuc: true, body: JSON.stringify(duLieu) }),
  capNhatHinhMon: (id: string, hinhId: string, duLieu: Partial<HinhAnhMonPayload>) =>
    goiApi<MonAn>(`/quan-tri/mon-an/${id}/hinh-anh/${hinhId}`, { method: 'PATCH', xacThuc: true, body: JSON.stringify(duLieu) }),
  xoaHinhMon: (id: string, hinhId: string) =>
    goiApi<MonAn>(`/quan-tri/mon-an/${id}/hinh-anh/${hinhId}`, { method: 'DELETE', xacThuc: true }),

  khachHang: (p: Record<string, string | number | undefined> = {}) =>
    goiApi<DanhSachPhanTrang<KhachHangQuanTri>>(`/quan-tri/khach-hang${taoQuery({ trang: 1, kichThuoc: 100, ...p })}`, { xacThuc: true }),
  khachHangChiTiet: (id: string) =>
    goiApi<KhachHangQuanTri>(`/quan-tri/khach-hang/${id}`, { xacThuc: true }),
  capNhatKhachHang: (id: string, duLieu: KhachHangPayload) =>
    goiApi<KhachHangQuanTri>(`/quan-tri/khach-hang/${id}`, { method: 'PATCH', xacThuc: true, body: JSON.stringify(duLieu) }),
  capNhatTrangThaiKhachHang: (id: string, trangThai: 'HOAT_DONG' | 'BI_KHOA' | 'NGUNG_HOAT_DONG') =>
    goiApi<KhachHangQuanTri>(`/quan-tri/khach-hang/${id}/trang-thai`, { method: 'PATCH', xacThuc: true, body: JSON.stringify({ trangThai }) }),

  nhanVien: (p: Record<string, string | number | undefined> = {}) =>
    goiApi<DanhSachPhanTrang<NhanVienQuanTri>>(`/quan-tri/nhan-vien${taoQuery({ trang: 1, kichThuoc: 100, ...p })}`, { xacThuc: true }),
  nhanVienChiTiet: (id: string) =>
    goiApi<NhanVienQuanTri>(`/quan-tri/nhan-vien/${id}`, { xacThuc: true }),
  taoNhanVien: (duLieu: TaoNhanVienPayload) =>
    goiApi<NhanVienQuanTri>('/quan-tri/nhan-vien', { method: 'POST', xacThuc: true, body: JSON.stringify(duLieu) }),
  capNhatNhanVien: (id: string, duLieu: CapNhatNhanVienPayload) =>
    goiApi<NhanVienQuanTri>(`/quan-tri/nhan-vien/${id}`, { method: 'PATCH', xacThuc: true, body: JSON.stringify(duLieu) }),
  capNhatTrangThaiNhanVien: (id: string, trangThai: 'HOAT_DONG' | 'TAM_NGHI' | 'DA_NGHI') =>
    goiApi<NhanVienQuanTri>(`/quan-tri/nhan-vien/${id}/trang-thai`, { method: 'PATCH', xacThuc: true, body: JSON.stringify({ trangThai }) }),

  cauHinh: (nhom?: string) =>
    goiApi<CauHinhQuanTri[]>(`/quan-tri/cau-hinh${taoQuery({ nhom })}`, { xacThuc: true }),
  capNhatCauHinh: (danhSach: Array<{ khoa: string; giaTri: string }>) =>
    goiApi<CauHinhQuanTri[]>('/quan-tri/cau-hinh', { method: 'PATCH', xacThuc: true, body: JSON.stringify({ danhSach }) }),

  gioHoatDong: () =>
    goiApi<GioHoatDongQuanTri[]>('/quan-tri/gio-hoat-dong', { xacThuc: true }),
  capNhatGioHoatDong: (danhSach: GioHoatDongPayload[]) =>
    goiApi<GioHoatDongQuanTri[]>('/quan-tri/gio-hoat-dong', { method: 'PUT', xacThuc: true, body: JSON.stringify({ danhSach }) }),
  xoaGioHoatDong: (thu: number, caSo: number) =>
    goiApi<{ daXoa: boolean }>(`/quan-tri/gio-hoat-dong/${thu}/${caSo}`, { method: 'DELETE', xacThuc: true }),

  ngayDacBiet: (p: { tuNgay?: string; denNgay?: string } = {}) =>
    goiApi<NgayDacBietQuanTri[]>(`/quan-tri/ngay-dac-biet${taoQuery(p)}`, { xacThuc: true }),
  taoNgayDacBiet: (duLieu: NgayDacBietPayload) =>
    goiApi<NgayDacBietQuanTri>('/quan-tri/ngay-dac-biet', { method: 'POST', xacThuc: true, body: JSON.stringify(duLieu) }),
  capNhatNgayDacBiet: (id: string, duLieu: Partial<NgayDacBietPayload>) =>
    goiApi<NgayDacBietQuanTri>(`/quan-tri/ngay-dac-biet/${id}`, { method: 'PATCH', xacThuc: true, body: JSON.stringify(duLieu) }),
  xoaNgayDacBiet: (id: string) =>
    goiApi<{ daXoa: boolean }>(`/quan-tri/ngay-dac-biet/${id}`, { method: 'DELETE', xacThuc: true }),
};
