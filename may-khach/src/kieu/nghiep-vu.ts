import type {
  NguonDatBan,
  PhuongThucThanhToan,
  TrangThaiBanAn,
  TrangThaiDatBan,
  TrangThaiHoanTien,
  TrangThaiHoatDong,
  TrangThaiTaiKhoan,
  TrangThaiThanhToan,
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


export interface MonDatTruoc {
  id?: string;
  monAnId: string;
  maMon: string;
  tenMon: string;
  donGia: number;
  soLuong: number;
  thanhTien: number;
  ghiChu?: string | null;
}

export interface KhuyenMaiDatBan {
  id: string;
  maKhuyenMai: string;
  tenKhuyenMai: string;
  loaiGiam: 'PHAN_TRAM' | 'SO_TIEN';
  giaTri: number;
  giaTriMonToiThieu?: number | null;
  giamToiDa?: number | null;
}

export interface HoanTienDatBan {
  id: string;
  maHoanTien: string;
  soTien: number;
  lyDo: string;
  trangThai: TrangThaiHoanTien;
  maGiaoDichCong?: string | null;
  nguoiThucHienId?: string | null;
  thoiGianHoan?: string | null;
  ngayTao: string;
}

export interface ThanhToanDatBan {
  id: string;
  maThanhToan: string;
  datBanId?: string;
  soTien: number;
  phuongThuc: PhuongThucThanhToan;
  trangThai: TrangThaiThanhToan;
  maGiaoDichCong?: string | null;
  khoaIdempotency?: string | null;
  thoiGianThanhToan?: string | null;
  ngayTao?: string;
  ngayCapNhat?: string;
  hoanTien?: HoanTienDatBan[];
}

export interface ThanhToanTaoDatBan {
  id: string;
  maThanhToan: string;
  soTien: number;
  phuongThuc: PhuongThucThanhToan;
  trangThai: TrangThaiThanhToan;
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
  monAn?: MonDatTruoc[];
  khuyenMaiId?: string | null;
  maKhuyenMaiApDung?: string | null;
  khuyenMai?: KhuyenMaiDatBan | null;
  tamTinhMon?: number;
  tienGiam?: number;
  tienCoc?: number;
  tongThanhToanTruoc?: number;
  thanhToan?: ThanhToanDatBan[];
  lichSu?: Array<{
    id: string;
    trangThaiCu: TrangThaiDatBan | null;
    trangThaiMoi: TrangThaiDatBan;
    hanhDong: string;
    thoiGian: string;
  }>;
}
