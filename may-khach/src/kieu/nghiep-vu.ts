export interface BoToken {
  accessToken: string;
  refreshToken: string;
  loaiToken: string;
  accessHetHanSauGiay: number;
}

export interface NguoiDungHienTai {
  id: string;
  tenDangNhap: string;
  email: string | null;
  trangThai: string;
  batBuocDoiMatKhau: boolean;
  lanDangNhapCuoi: string | null;
  vaiTro: { id: string; maVaiTro: string };
}

export interface DanhMucMon {
  id: string;
  maDanhMuc: string;
  tenDanhMuc: string;
  duongDan: string;
  moTa?: string | null;
  hinhAnh?: string | null;
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
  trangThai?: string;
  ngayTao?: string;
  ngayCapNhat?: string;
  hinhAnh?: HinhAnhMon[];
}

export interface BanAnPhuongAn {
  kieu: 'BAN_DON' | 'GHEP_BAN';
  banAns: Array<{
    id: string;
    maBan?: string;
    ma_ban?: string;
    tenBan?: string;
    ten_ban?: string;
    tenKhuVuc?: string;
    sucChua?: number;
    sucChuaToiDa?: number;
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
  trangThai: string;
  nguonDat?: string;
  ghiChuKhach?: string | null;
  banAns?: Array<{ id: string; maBan: string; tenBan?: string; tenKhuVuc?: string }>;
  lichSu?: Array<{
    id: string;
    trangThaiCu: string | null;
    trangThaiMoi: string;
    hanhDong: string;
    thoiGian: string;
  }>;
}
