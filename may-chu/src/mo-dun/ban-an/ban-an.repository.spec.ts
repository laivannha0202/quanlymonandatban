import { BanAnRepository } from './ban-an.repository';

describe('BanAnRepository - bàn bị chiếm', () => {
  it('dùng Prisma relation và trả Set ID bàn duy nhất', async () => {
    const prisma = {
      chi_tiet_dat_ban: {
        findMany: jest.fn().mockResolvedValue([
          { ban_an_id: 1n },
          { ban_an_id: 2n },
        ]),
      },
    } as any;

    const repository = new BanAnRepository(prisma);

    const result = await repository.layIdBanDangBiChiem(
      [1n, 2n, 3n],
      '2026-08-20 19:00:00',
      '2026-08-20 20:30:00',
    );

    expect([...result]).toEqual(['1', '2']);

    expect(prisma.chi_tiet_dat_ban.findMany).toHaveBeenCalledWith({
      where: {
        ban_an_id: {
          in: [1n, 2n, 3n],
        },
        dat_ban: {
          trang_thai: {
            in: ['CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DA_CHECK_IN'],
          },
          gio_bat_dau: {
            lt: new Date('2026-08-20T20:30:00.000Z'),
          },
          gio_ket_thuc: {
            gt: new Date('2026-08-20T19:00:00.000Z'),
          },
        },
      },
      distinct: ['ban_an_id'],
      select: {
        ban_an_id: true,
      },
    });
  });
});
