import { goiApi, taoQuery } from './http';
import type { DanhSachPhanTrang } from '@/kieu/api';

export interface ThongTinNhaHangCongKhai {
  tenNhaHang: string;
  diaChi?: string | null;
  soDienThoai?: string | null;
  email?: string | null;
}

export interface DanhMucQuanTri {
  id: string;
  maDanhMuc: string;
  tenDanhMuc: string;
  duongDan: string;
  moTa?: string | null;
  hinhAnh?: string | null;
  thuTu: number;
  trangThai: string;
  soMon?: number;
}

export interface KhuyenMai {
  id: string;
  maKhuyenMai: string;
  tenKhuyenMai: string;
  moTa?: string | null;
  loaiGiam: 'PHAN_TRAM' | 'SO_TIEN';
  giaTri: number;
  giaTriDonToiThieu?: number | null;
  giamToiDa?: number | null;
  ngayBatDau: string;
  ngayKetThuc: string;
  soLuotToiDa?: number | null;
  soLuotDaDung?: number;
  trangThai: string;
}

export interface DanhGia {
  id: string;
  khachHangId: string;
  datBanId: string;
  hoTen: string;
  soSao: number;
  noiDung?: string | null;
  phanHoi?: string | null;
  nguoiPhanHoiId?: string | null;
  nguoiPhanHoi?: string | null;
  thoiGianPhanHoi?: string | null;
  hienThi: boolean;
  ngayTao: string;
  ngayCapNhat?: string;
}

export interface ThongBao {
  id: string;
  taiKhoanId: string;
  datBanId?: string | null;
  loaiThongBao: string;
  tieuDe: string;
  noiDung: string;
  duongDan?: string | null;
  daDoc: boolean;
  thoiGianDoc?: string | null;
  ngayTao: string;
}

export interface Quyen {
  id: string;
  maQuyen: string;
  tenQuyen: string;
  nhomQuyen?: string | null;
  moTa?: string | null;
}

export interface VaiTro {
  id: string;
  maVaiTro: string;
  tenVaiTro: string;
  moTa?: string | null;
  trangThai: string;
  quyen: Quyen[];
}

export interface BaoCaoDatBan {
  tuNgay: string;
  denNgay: string;
  tongQuan: Record<string, number>;
  theoNgay: Array<Record<string, string | number>>;
  theoTrangThai: Array<Record<string, string | number>>;
  theoNguon: Array<Record<string, string | number>>;
  theoKhuVuc: Array<Record<string, string | number>>;
}

export interface BaoCaoKhachHang {
  tuNgay: string;
  denNgay: string;
  tongQuan: Record<string, number>;
  topKhachHang: Array<Record<string, string | number | null>>;
}

export interface BaoCaoDanhGia {
  tuNgay: string;
  denNgay: string;
  tongQuan: Record<string, number>;
  theoSoSao: Array<Record<string, string | number>>;
}

type DanhMucPayload = {
  maDanhMuc?: string;
  tenDanhMuc?: string;
  duongDan?: string;
  moTa?: string;
  hinhAnh?: string;
  thuTu?: number;
  trangThai?: string;
};

type KhuyenMaiPayload = {
  maKhuyenMai?: string;
  tenKhuyenMai?: string;
  moTa?: string;
  loaiGiam?: 'PHAN_TRAM' | 'SO_TIEN';
  giaTri?: number;
  giaTriDonToiThieu?: number;
  giamToiDa?: number;
  ngayBatDau?: string;
  ngayKetThuc?: string;
  soLuotToiDa?: number;
  trangThai?: string;
};

export const heThongApi = {
  thongTinNhaHangCongKhai: () => goiApi<ThongTinNhaHangCongKhai>('/cau-hinh/cong-khai'),

  khuyenMaiCongKhai: () => goiApi<KhuyenMai[]>('/khuyen-mai/dang-ap-dung'),

  thongBao: (p: Record<string, string | number | undefined> = {}) =>
    goiApi<DanhSachPhanTrang<ThongBao>>(`/thong-bao${taoQuery({ trang: 1, kichThuoc: 30, ...p })}`, { xacThuc: true }),
  soThongBaoChuaDoc: () => goiApi<{ soChuaDoc: number }>('/thong-bao/chua-doc', { xacThuc: true }),
  docThongBao: (id: string) => goiApi<{ daDoc: boolean }>(`/thong-bao/${id}/da-doc`, { method: 'PATCH', xacThuc: true }),
  docTatCaThongBao: () => goiApi<{ soThongBaoDaDoc: number }>('/thong-bao/doc-tat-ca', { method: 'PATCH', xacThuc: true }),

  taoDanhGia: (duLieu: { datBanId: string; soSao: number; noiDung?: string }) =>
    goiApi<DanhGia>('/khach-hang/danh-gia', { method: 'POST', xacThuc: true, body: JSON.stringify(duLieu) }),
  capNhatDanhGia: (id: string, duLieu: { soSao?: number; noiDung?: string }) =>
    goiApi<DanhGia>(`/khach-hang/danh-gia/${id}`, { method: 'PATCH', xacThuc: true, body: JSON.stringify(duLieu) }),
  xoaDanhGia: (id: string) => goiApi<{ daXoa: boolean }>(`/khach-hang/danh-gia/${id}`, { method: 'DELETE', xacThuc: true }),

  danhMucQuanTri: () => goiApi<DanhMucQuanTri[]>('/quan-tri/danh-muc-mon', { xacThuc: true }),
  taoDanhMuc: (duLieu: Required<Pick<DanhMucPayload, 'maDanhMuc' | 'tenDanhMuc'>> & DanhMucPayload) =>
    goiApi<DanhMucQuanTri>('/quan-tri/danh-muc-mon', { method: 'POST', xacThuc: true, body: JSON.stringify(duLieu) }),
  capNhatDanhMuc: (id: string, duLieu: DanhMucPayload) =>
    goiApi<DanhMucQuanTri>(`/quan-tri/danh-muc-mon/${id}`, { method: 'PATCH', xacThuc: true, body: JSON.stringify(duLieu) }),
  xoaDanhMuc: (id: string) => goiApi<{ daXoa: boolean }>(`/quan-tri/danh-muc-mon/${id}`, { method: 'DELETE', xacThuc: true }),

  khuyenMaiQuanTri: (p: Record<string, string | number | undefined> = {}) =>
    goiApi<DanhSachPhanTrang<KhuyenMai>>(`/quan-tri/khuyen-mai${taoQuery({ trang: 1, kichThuoc: 20, ...p })}`, { xacThuc: true }),
  taoKhuyenMai: (duLieu: Required<Pick<KhuyenMaiPayload, 'maKhuyenMai' | 'tenKhuyenMai' | 'loaiGiam' | 'giaTri' | 'ngayBatDau' | 'ngayKetThuc'>> & KhuyenMaiPayload) =>
    goiApi<KhuyenMai>('/quan-tri/khuyen-mai', { method: 'POST', xacThuc: true, body: JSON.stringify(duLieu) }),
  capNhatKhuyenMai: (id: string, duLieu: KhuyenMaiPayload) =>
    goiApi<KhuyenMai>(`/quan-tri/khuyen-mai/${id}`, { method: 'PATCH', xacThuc: true, body: JSON.stringify(duLieu) }),
  xoaKhuyenMai: (id: string) => goiApi<{ daXoa: boolean }>(`/quan-tri/khuyen-mai/${id}`, { method: 'DELETE', xacThuc: true }),

  danhGiaQuanTri: (p: Record<string, string | number | undefined> = {}) =>
    goiApi<DanhSachPhanTrang<DanhGia>>(`/quan-tri/danh-gia${taoQuery({ trang: 1, kichThuoc: 20, ...p })}`, { xacThuc: true }),
  phanHoiDanhGia: (id: string, phanHoi: string) =>
    goiApi<DanhGia>(`/quan-tri/danh-gia/${id}/phan-hoi`, { method: 'PATCH', xacThuc: true, body: JSON.stringify({ phanHoi }) }),
  hienThiDanhGia: (id: string, hienThi: boolean) =>
    goiApi<DanhGia>(`/quan-tri/danh-gia/${id}/hien-thi`, { method: 'PATCH', xacThuc: true, body: JSON.stringify({ hienThi }) }),

  baoCaoDatBan: (tuNgay?: string, denNgay?: string) =>
    goiApi<BaoCaoDatBan>(`/quan-tri/bao-cao/dat-ban${taoQuery({ tuNgay, denNgay })}`, { xacThuc: true }),
  baoCaoKhachHang: (tuNgay?: string, denNgay?: string) =>
    goiApi<BaoCaoKhachHang>(`/quan-tri/bao-cao/khach-hang${taoQuery({ tuNgay, denNgay })}`, { xacThuc: true }),
  baoCaoDanhGia: (tuNgay?: string, denNgay?: string) =>
    goiApi<BaoCaoDanhGia>(`/quan-tri/bao-cao/danh-gia${taoQuery({ tuNgay, denNgay })}`, { xacThuc: true }),

  vaiTro: () => goiApi<VaiTro[]>('/quan-tri/vai-tro', { xacThuc: true }),
  quyen: () => goiApi<Quyen[]>('/quan-tri/quyen', { xacThuc: true }),
  capNhatQuyenVaiTro: (id: string, maQuyens: string[]) =>
    goiApi<VaiTro>(`/quan-tri/vai-tro/${id}/quyen`, { method: 'PUT', xacThuc: true, body: JSON.stringify({ maQuyens }) }),
};
