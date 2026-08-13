import { goiApi } from './http';
import type {
  PhuongThucThanhToan,
  TrangThaiDatBan,
  TrangThaiThanhToan,
} from '@/kieu/trang-thai';

export interface TraCuuThanhToanPayload {
  maDatBan: string;
  soDienThoai: string;
}

export interface XacNhanThanhToanMoPhongPayload
  extends TraCuuThanhToanPayload {
  maThanhToan: string;
  khoaIdempotency: string;
}

export interface KetQuaThanhToan {
  id: string;
  maThanhToan: string;
  datBanId: string;
  soTien: number;
  phuongThuc: PhuongThucThanhToan;
  trangThai: TrangThaiThanhToan;
  maGiaoDichCong?: string | null;
  khoaIdempotency?: string | null;
  thoiGianThanhToan?: string | null;
  ngayTao?: string;
  ngayCapNhat?: string;
  maDatBan: string;
  trangThaiDatBan: TrangThaiDatBan;
  vuaThanhToan?: boolean;
  vuaXacNhanDatBan?: boolean;
}

export const thanhToanApi = {
  traCuu: (payload: TraCuuThanhToanPayload) =>
    goiApi<KetQuaThanhToan>('/thanh-toan/tra-cuu', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  xacNhanMoPhong: (payload: XacNhanThanhToanMoPhongPayload) =>
    goiApi<KetQuaThanhToan>('/thanh-toan/mo-phong/xac-nhan', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
