import {
  dateWallClockTuNgayGioSql,
  hienTaiWallClockVietNam,
} from './ngay-gio';

describe('Tiện ích wall-clock Việt Nam', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('chuyển SQL wall-clock thành Date carrier không lệch giờ', () => {
    expect(
      dateWallClockTuNgayGioSql('2026-08-20 19:00:00').toISOString(),
    ).toBe('2026-08-20T19:00:00.000Z');
  });

  it('tạo thời điểm hiện tại theo component giờ Việt Nam', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-12T03:00:00.000Z'));

    expect(hienTaiWallClockVietNam().toISOString()).toBe(
      '2026-08-12T10:00:00.000Z',
    );
  });
});
