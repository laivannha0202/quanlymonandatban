/**
 * Contract trạng thái dùng ở biên API frontend.
 *
 * Nguồn chuẩn: CHECK constraints trong
 * co-so-du-lieu/quan_ly_nha_hang_mysql.sql.
 *
 * Frontend không tự phát minh trạng thái và không dùng `string`
 * cho các field nghiệp vụ có tập giá trị hữu hạn.
 */

export type TrangThaiHoatDong =
  | 'HOAT_DONG'
  | 'NGUNG_HOAT_DONG';

export type TrangThaiTaiKhoan =
  | 'HOAT_DONG'
  | 'BI_KHOA'
  | 'NGUNG_HOAT_DONG';

export type TrangThaiKhachHang =
  TrangThaiTaiKhoan;

export type TrangThaiNhanVien =
  | 'HOAT_DONG'
  | 'TAM_NGHI'
  | 'DA_NGHI';

export type TrangThaiBanAn =
  | 'TRONG'
  | 'DANG_SU_DUNG'
  | 'BAO_TRI'
  | 'NGUNG_SU_DUNG';

export type TrangThaiDatBan =
  | 'CHO_XAC_NHAN'
  | 'DA_XAC_NHAN'
  | 'DA_CHECK_IN'
  | 'DA_HOAN_THANH'
  | 'DA_HUY'
  | 'KHONG_DEN';

export type NguonDatBan =
  | 'WEBSITE'
  | 'DIEN_THOAI'
  | 'FACEBOOK'
  | 'TRUC_TIEP'
  | 'KHAC';

export type KieuXepBan =
  | 'KHACH_CHON_BAN'
  | 'HE_THONG_SAP_XEP'
  | 'NHAN_VIEN_SAP_XEP';
