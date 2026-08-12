import {
  taoMaKhachHangTam,
  taoMaKhachHangTuId,
} from './ma-khach-hang';

describe('ma-khach-hang', () => {
  it('sinh mã ổn định từ ID với tối thiểu 3 chữ số', () => {
    expect(taoMaKhachHangTuId(1)).toBe('HV_KH001');
    expect(taoMaKhachHangTuId(42n)).toBe('HV_KH042');
    expect(taoMaKhachHangTuId('999')).toBe('HV_KH999');
    expect(taoMaKhachHangTuId(1000)).toBe('HV_KH1000');
  });

  it('sinh mã tạm duy nhất và không vượt giới hạn cột', () => {
    const a = taoMaKhachHangTam();
    const b = taoMaKhachHangTam();

    expect(a).toMatch(/^TMP_KH_[0-9a-f]{16}$/);
    expect(b).toMatch(/^TMP_KH_[0-9a-f]{16}$/);
    expect(a).not.toBe(b);
    expect(a.length).toBeLessThanOrEqual(30);
  });
});
