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


describe('BanAnService - invariant cập nhật bàn', () => {
  function taoBan() {
    return {
      id: 1n,
      ma_ban: 'B01',
      ten_ban: 'Bàn 01',
      khu_vuc_id: 1n,
      suc_chua: 2,
      suc_chua_toi_da: 4,
      trang_thai: 'TRONG',
    };
  }

  it('chặn đổi sức chứa khi bàn còn booking hiệu lực', async () => {
    const prisma = {
      ban_an: {
        findFirst: jest.fn().mockResolvedValue(taoBan()),
        update: jest.fn(),
      },
      dat_ban: {
        count: jest.fn().mockResolvedValue(1),
      },
      khu_vuc: {
        findFirst: jest.fn(),
      },
      lien_ket_ban: {
        count: jest.fn(),
      },
    } as any;

    const service = new BanAnService(prisma);

    await expect(
      service.capNhat('1', {
        sucChuaToiDa: 3,
      } as any),
    ).rejects.toMatchObject({
      maLoi: 'BAN_AN_007',
    });

    expect(prisma.ban_an.update).not.toHaveBeenCalled();
  });

  it('chặn chuyển khu vực khi bàn vẫn có liên kết ghép', async () => {
    const prisma = {
      ban_an: {
        findFirst: jest.fn().mockResolvedValue(taoBan()),
        update: jest.fn(),
      },
      dat_ban: {
        count: jest.fn().mockResolvedValue(0),
      },
      khu_vuc: {
        findFirst: jest.fn().mockResolvedValue({
          id: 2n,
        }),
      },
      lien_ket_ban: {
        count: jest.fn().mockResolvedValue(1),
      },
    } as any;

    const service = new BanAnService(prisma);

    await expect(
      service.capNhat('1', {
        khuVucId: '2',
      } as any),
    ).rejects.toMatchObject({
      maLoi: 'BAN_AN_008',
    });

    expect(prisma.ban_an.update).not.toHaveBeenCalled();
  });

  it('cho phép sửa tên bàn khi còn booking vì không làm đổi khả năng phục vụ', async () => {
    const ban = taoBan();
    const prisma = {
      ban_an: {
        findFirst: jest.fn().mockResolvedValue(ban),
        update: jest.fn().mockResolvedValue({
          ...ban,
          ten_ban: 'Bàn cửa sổ',
        }),
      },
      dat_ban: {
        count: jest.fn(),
      },
      khu_vuc: {
        findFirst: jest.fn(),
      },
      lien_ket_ban: {
        count: jest.fn(),
      },
    } as any;

    const service = new BanAnService(prisma);

    await expect(
      service.capNhat('1', {
        tenBan: 'Bàn cửa sổ',
      } as any),
    ).resolves.toEqual(
      expect.objectContaining({
        ten_ban: 'Bàn cửa sổ',
      }),
    );

    expect(prisma.dat_ban.count).not.toHaveBeenCalled();
    expect(prisma.lien_ket_ban.count).not.toHaveBeenCalled();
  });
});
