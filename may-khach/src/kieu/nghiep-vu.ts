import type {
  NguonDatBan,
  TrangThaiBanAn,
  TrangThaiDatBan,
  TrangThaiHoatDong,
  TrangThaiTaiKhoan,
} from './trang-thai';

export interface BoToken {
  accessToken: string;
  loaiToken: string;
  accessHetHanSauGiay: number;
}

export interface NguoiDungHienTai {
  id: string;
  tenDangNhap: string;
  email: string | null;
  trangThai: TrangThaiTaiKhoan;
  batBuocDoiMatKhau: boolean;
  lanDangNhapCuoi: string | null;
  vaiTro: { id: string; maVaiTro: string };
  quyen: string[];
}

export interface DanhMucMon {
  id: string;
  maDanhMuc: string;
  tenDanhMuc: string;
  duongDan: string;
  moTa?: string | null;
  thuTu?: number;
  soMon?: number;
}

export interface HinhAnhMon {
  id: string;
  monAnId?: string;
  duongDanAnh: string;
  altText?: string | null;
  thuTu: number;
  laAnhChinh: boolean;
  ngayTao?: string;
}

export interface MonAn {
  id: string;
  maMon: string;
  danhMucId: string;
  tenDanhMuc?: string;
  duongDanDanhMuc?: string;
  tenMon: string;
  duongDan: string;
  moTa?: string | null;
  gia: number;
  giaKhuyenMai?: number | null;
  hinhAnhChinh?: string | null;
  laMonNoiBat?: boolean;
  conMon?: boolean;
  trangThai?: TrangThaiHoatDong;
  ngayTao?: string;
  ngayCapNhat?: string;
  hinhAnh?: HinhAnhMon[];
}

export interface BanAnPhuongAn {
  kieu: 'BAN_DON' | 'GHEP_BAN';
  banAns: Array<{
    id: string;
    maBan: string;
    tenBan: string;
    khuVucId: string;
    tenKhuVuc: string;
    sucChua: number;
    sucChuaToiDa: number;
    trangThai: TrangThaiBanAn;
  }>;
  tongSucChua: number;
  tongSucChuaToiDa: number;
}

export interface KetQuaTimBan {
  ngay: string;
  gioBatDau: string;
  gioKetThuc: string;
  soNguoi: number;
  khuVucId: string | null;
  coBan: boolean;
  phuongAn: BanAnPhuongAn[];
}

export interface DatBan {
  id: string;
  maDatBan: string;
  hoTen: string;
  soDienThoai: string;
  email?: string | null;
  ngayDat: string;
  gioBatDau: string;
  gioKetThuc: string;
  soNguoi: number;
  trangThai: TrangThaiDatBan;
  nguonDat?: NguonDatBan;
  ghiChuKhach?: string | null;
  banAns?: Array<{ id: string; maBan: string; tenBan?: string; tenKhuVuc?: string }>;
  lichSu?: Array<{
    id: string;
    trangThaiCu: TrangThaiDatBan | null;
    trangThaiMoi: TrangThaiDatBan;
    hanhDong: string;
    thoiGian: string;
  }>;
}
