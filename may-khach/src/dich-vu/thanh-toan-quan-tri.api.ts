import { goiApi, taoQuery } from './http';
import type { DanhSachPhanTrang } from '@/kieu/api';
import type {
  PhuongThucThanhToan,
  TrangThaiDatBan,
  TrangThaiHoanTien,
  TrangThaiThanhToan,
} from '@/kieu/trang-thai';

export interface DatBanThanhToanQuanTri {
  id?: string;
  maDatBan: string;
  hoTen: string;
  soDienThoai: string;
  email?: string | null;
  ngayDat: string;
  gioBatDau: string;
  gioKetThuc?: string;
  soNguoi?: number;
  trangThai: TrangThaiDatBan;
  tamTinhMon?: number;
  tienGiam?: number;
  tienCoc?: number;
  tongThanhToanTruoc?: number;
}

export interface HoanTienQuanTri {
  id: string;
  maHoanTien: string;
  soTien: number;
  lyDo: string;
  trangThai: TrangThaiHoanTien;
  maGiaoDichCong?: string | null;
  khoaIdempotency?: string | null;
  nguoiThucHienId?: string | null;
  thoiGianHoan?: string | null;
  ngayTao: string;
  ngayCapNhat?: string;
}

export interface ThanhToanQuanTri {
  id: string;
  maThanhToan: string;
  datBanId: string;
  soTien: number;
  phuongThuc: PhuongThucThanhToan;
  trangThai: TrangThaiThanhToan;
  maGiaoDichCong?: string | null;
  khoaIdempotency?: string | null;
  ghiChu?: string | null;
  thoiGianThanhToan?: string | null;
  ngayTao: string;
  ngayCapNhat: string;
  datBan: DatBanThanhToanQuanTri;
  tongHoan?: number;
  coHoanTienDangCho?: boolean;
  hoanTien?: HoanTienQuanTri[];
}

export interface BoLocThanhToanQuanTri {
  trang?: number;
  kichThuoc?: number;
  tuKhoa?: string;
  trangThai?: TrangThaiThanhToan;
  phuongThuc?: PhuongThucThanhToan;
}

export interface XacNhanThanhToanThuCongPayload {
  phuongThuc: 'CHUYEN_KHOAN' | 'TIEN_MAT';
  maGiaoDichCong?: string;
  ghiChu?: string;
}

export interface XacNhanHoanTienPayload {
  maGiaoDichCong?: string;
  ghiChu?: string;
}

export const thanhToanQuanTriApi = {
  danhSach: (p: BoLocThanhToanQuanTri = {}) =>
    goiApi<DanhSachPhanTrang<ThanhToanQuanTri>>(
      `/quan-tri/thanh-toan${taoQuery({
        trang: p.trang ?? 1,
        kichThuoc: p.kichThuoc ?? 20,
        tuKhoa: p.tuKhoa,
        trangThai: p.trangThai,
        phuongThuc: p.phuongThuc,
      })}`,
      { xacThuc: true },
    ),

  chiTiet: (id: string) =>
    goiApi<ThanhToanQuanTri>(
      `/quan-tri/thanh-toan/${id}`,
      { xacThuc: true },
    ),

  xacNhanThuCong: (
    id: string,
    payload: XacNhanThanhToanThuCongPayload,
  ) =>
    goiApi<ThanhToanQuanTri>(
      `/quan-tri/thanh-toan/${id}/xac-nhan-thu-cong`,
      {
        method: 'POST',
        xacThuc: true,
        body: JSON.stringify(payload),
      },
    ),

  xacNhanHoanTien: (
    id: string,
    payload: XacNhanHoanTienPayload = {},
  ) =>
    goiApi<ThanhToanQuanTri>(
      `/quan-tri/thanh-toan/hoan-tien/${id}/xac-nhan`,
      {
        method: 'POST',
        xacThuc: true,
        body: JSON.stringify(payload),
      },
    ),
};
