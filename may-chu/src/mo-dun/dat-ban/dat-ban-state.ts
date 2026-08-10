export const CHUYEN_TRANG_THAI_DAT_BAN: Record<string, readonly string[]> = {
  CHO_XAC_NHAN: ['DA_XAC_NHAN', 'DA_HUY'],
  DA_XAC_NHAN: ['DA_CHECK_IN', 'DA_HUY', 'KHONG_DEN'],
  DA_CHECK_IN: ['DA_HOAN_THANH'],
  DA_HOAN_THANH: [],
  DA_HUY: [],
  KHONG_DEN: [],
};

export function coTheChuyenTrangThai(trangThaiCu: string, trangThaiMoi: string): boolean {
  return CHUYEN_TRANG_THAI_DAT_BAN[trangThaiCu]?.includes(trangThaiMoi) ?? false;
}
