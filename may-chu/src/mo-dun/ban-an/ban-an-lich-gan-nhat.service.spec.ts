import { BanAnService } from './ban-an.service';

describe('BanAnService - lịch gần nhất trên danh sách bàn', () => {
  it('gắn đúng booking hiệu lực gần nhất cho từng bàn trong page', async () => {
    const ban = [
      {
        id: 1n,
        ma_ban: 'B01',
        ten_ban: 'Bàn 01',
        khu_vuc_id: 1n,
        suc_chua: 2,
        suc_chua_toi_da: 4,
        trang_thai: 'TRONG',
      },
      {
        id: 2n,
        ma_ban: 'B02',
        ten_ban: 'Bàn 02',
        khu_vuc_id: 1n,
        suc_chua: 2,
        suc_chua_toi_da: 4,
        trang_thai: 'TRONG',
      },
    ];

    const lich1 = {
      id: 100n,
      ma_dat_ban: 'DB100',
      ho_ten: 'Khách A',
      so_nguoi: 2,
      gio_bat_dau: new Date('2026-08-14T10:30:00Z'),
      gio_ket_thuc: new Date('2026-08-14T12:00:00Z'),
      trang_thai: 'DA_XAC_NHAN',
    };

    const lich1Sau = {
      ...lich1,
      id: 101n,
      ma_dat_ban: 'DB101',
      gio_bat_dau: new Date('2026-08-14T18:30:00Z'),
      gio_ket_thuc: new Date('2026-08-14T20:00:00Z'),
    };

    const prisma = {
      ban_an: {
        count: jest.fn().mockResolvedValue(2),
        findMany: jest.fn().mockResolvedValue(ban),
      },
      chi_tiet_dat_ban: {
        findMany: jest.fn().mockResolvedValue([
          {
            ban_an_id: 1n,
            dat_ban: lich1,
          },
          {
            ban_an_id: 1n,
            dat_ban: lich1Sau,
          },
        ]),
      },
      $transaction: jest.fn(
        async (items: Array<Promise<unknown>>) =>
          Promise.all(items),
      ),
    };

    const service = new BanAnService(prisma as never);

    const result = await service.danhSach({
      trang: 1,
      kichThuoc: 20,
    });

    expect(result.danhSach[0].lich_dat_gan_nhat).toEqual(lich1);
    expect(result.danhSach[1].lich_dat_gan_nhat).toBeNull();

    expect(prisma.chi_tiet_dat_ban.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.chi_tiet_dat_ban.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          ban_an_id: {
            in: [1n, 2n],
          },
          dat_ban: expect.objectContaining({
            trang_thai: {
              in: [
                'CHO_XAC_NHAN',
                'DA_XAC_NHAN',
                'DA_CHECK_IN',
              ],
            },
          }),
        }),
      }),
    );
  });
});
