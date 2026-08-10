import { khoangNgayMacDinh } from './ngay-bao-cao';

describe('khoangNgayMacDinh', () => {
  it('giữ khoảng ngày hợp lệ', () => {
    expect(khoangNgayMacDinh('2026-08-01', '2026-08-31')).toEqual({ tuNgay: '2026-08-01', denNgay: '2026-08-31' });
  });

  it('từ chối khoảng lớn hơn 366 ngày', () => {
    expect(() => khoangNgayMacDinh('2025-01-01', '2026-08-01')).toThrow();
  });
});
