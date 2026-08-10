export interface PhanHoiThanhCong<T> {
  thanhCong: true;
  thongBao?: string;
  duLieu: T;
}

export interface PhanHoiLoi {
  thanhCong: false;
  maLoi: string;
  thongBao: string;
  chiTiet?: unknown;
  maYeuCau?: string;
}

export interface PhanTrang {
  trang: number;
  kichThuoc: number;
  tong: number;
  tongTrang: number;
}

export interface DanhSachPhanTrang<T> {
  danhSach: T[];
  phanTrang: PhanTrang;
}
