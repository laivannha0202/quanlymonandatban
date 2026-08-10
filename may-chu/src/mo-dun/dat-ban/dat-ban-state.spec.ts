import { coTheChuyenTrangThai } from './dat-ban-state';

describe('State machine đặt bàn', () => {
  it('cho phép luồng chuẩn', () => {
    expect(coTheChuyenTrangThai('CHO_XAC_NHAN', 'DA_XAC_NHAN')).toBe(true);
    expect(coTheChuyenTrangThai('DA_XAC_NHAN', 'DA_CHECK_IN')).toBe(true);
    expect(coTheChuyenTrangThai('DA_CHECK_IN', 'DA_HOAN_THANH')).toBe(true);
  });

  it('chặn nhảy trạng thái sai', () => {
    expect(coTheChuyenTrangThai('CHO_XAC_NHAN', 'DA_HOAN_THANH')).toBe(false);
    expect(coTheChuyenTrangThai('DA_HUY', 'DA_XAC_NHAN')).toBe(false);
    expect(coTheChuyenTrangThai('KHONG_DEN', 'DA_CHECK_IN')).toBe(false);
  });
});
