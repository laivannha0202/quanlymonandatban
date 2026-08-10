import { LichPhucVuService } from './lich-phuc-vu.service';

describe('LichPhucVuService', () => {
  const cauHinh = { laySo: jest.fn(), layBoolean: jest.fn() } as any;
  const gioHoatDong = { layTheoThu: jest.fn() } as any;
  const ngayDacBiet = { layTheoNgay: jest.fn() } as any;
  let service: LichPhucVuService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new LichPhucVuService(cauHinh, gioHoatDong, ngayDacBiet);
  });

  it('ngày đóng cửa đặc biệt ghi đè lịch tuần', async () => {
    ngayDacBiet.layTheoNgay.mockResolvedValue({
      dong_cua_ca_ngay: 1,
      gio_mo_cua: null,
      gio_dong_cua: null,
    });

    const ketQua = await service.layKhoangPhucVu('2026-09-02');
    expect(ketQua).toEqual([]);
    expect(gioHoatDong.layTheoThu).not.toHaveBeenCalled();
  });

  it('không cho booking 120 phút vượt giờ đóng cửa', async () => {
    cauHinh.laySo.mockResolvedValue(120);
    ngayDacBiet.layTheoNgay.mockResolvedValue(null);
    gioHoatDong.layTheoThu.mockResolvedValue([
      { gio_mo_cua: '10:00', gio_dong_cua: '22:00' },
    ]);

    await expect(service.tinhGioKetThuc('2026-08-20', '21:00')).rejects.toMatchObject({
      maLoi: 'DAT_BAN_003',
    });
  });
});
