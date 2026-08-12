import { coTheChuyenTrangThai } from './dat-ban-state';

describe('State machine đặt bàn', () => {
  it('cho phép luồng chuẩn', () => {
    expect(coTheChuyenTrangThai('CHO_XAC_NHAN', 'DA_XAC_NHAN')).toBe(true);
    expect(coTheChuyenTrangThai('DA_XAC_NHAN', 'DA_CHECK_IN')).toBe(true);
    expect(coTheChuyenTrangThai('DA_CHECK_IN', 'DA_HOAN_THANH')).toBe(true);
  });

  it('cho phép đúng các nhánh hủy và không đến', () => {
    expect(coTheChuyenTrangThai('CHO_XAC_NHAN', 'DA_HUY')).toBe(true);
    expect(coTheChuyenTrangThai('DA_XAC_NHAN', 'DA_HUY')).toBe(true);
    expect(coTheChuyenTrangThai('DA_XAC_NHAN', 'KHONG_DEN')).toBe(true);
  });

  it('chặn nhảy trạng thái sai', () => {
    expect(coTheChuyenTrangThai('CHO_XAC_NHAN', 'DA_HOAN_THANH')).toBe(false);
    expect(coTheChuyenTrangThai('DA_XAC_NHAN', 'DA_HOAN_THANH')).toBe(false);
    expect(coTheChuyenTrangThai('DA_CHECK_IN', 'DA_HUY')).toBe(false);
    expect(coTheChuyenTrangThai('DA_HUY', 'DA_XAC_NHAN')).toBe(false);
    expect(coTheChuyenTrangThai('KHONG_DEN', 'DA_CHECK_IN')).toBe(false);
  });

  it('không cho trạng thái kết thúc chuyển tiếp', () => {
    for (const trangThai of ['DA_HOAN_THANH', 'DA_HUY', 'KHONG_DEN']) {
      for (const dich of [
        'CHO_XAC_NHAN',
        'DA_XAC_NHAN',
        'DA_CHECK_IN',
        'DA_HOAN_THANH',
        'DA_HUY',
        'KHONG_DEN',
      ]) {
        expect(coTheChuyenTrangThai(trangThai, dich)).toBe(false);
      }
    }
  });
});
