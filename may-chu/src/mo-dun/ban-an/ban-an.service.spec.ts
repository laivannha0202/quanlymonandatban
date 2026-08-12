import { BanAnService } from './ban-an.service';

describe('BanAnService - xóa bàn', () => {
  it('chặn xóa khi bàn còn booking hiệu lực', async () => {
    const prisma = {
      ban_an: {
        findFirst: jest.fn().mockResolvedValue({
          id: 1n,
          ma_ban: 'B01',
          khu_vuc_id: 1n,
          suc_chua: 2,
          suc_chua_toi_da: 4,
          trang_thai: 'TRONG',
        }),
      },
      dat_ban: {
        count: jest.fn().mockResolvedValue(1),
      },
      $transaction: jest.fn(),
    } as any;

    const service = new BanAnService(prisma);

    await expect(service.xoa('1')).rejects.toMatchObject({
      maLoi: 'BAN_AN_003',
    });

    expect(prisma.dat_ban.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          chi_tiet_dat_ban: {
            some: {
              ban_an_id: 1n,
            },
          },
        }),
      }),
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('soft-delete bàn khi không còn booking hiệu lực', async () => {
    const prisma = {
      ban_an: {
        findFirst: jest.fn().mockResolvedValue({
          id: 1n,
          ma_ban: 'B01',
          khu_vuc_id: 1n,
          suc_chua: 2,
          suc_chua_toi_da: 4,
          trang_thai: 'TRONG',
        }),
        update: jest.fn(),
      },
      dat_ban: {
        count: jest.fn().mockResolvedValue(0),
      },
      lien_ket_ban: {
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn().mockResolvedValue([]),
    } as any;

    const service = new BanAnService(prisma);

    await expect(service.xoa('1')).resolves.toEqual({
      daXoa: true,
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});
