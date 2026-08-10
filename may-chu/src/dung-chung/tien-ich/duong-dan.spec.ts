import { taoDuongDan } from './duong-dan';

describe('taoDuongDan', () => {
  it('chuyển tiếng Việt thành slug ổn định', () => {
    expect(taoDuongDan('Bún Bò Đặc Biệt 2026')).toBe('bun-bo-dac-biet-2026');
  });
});
