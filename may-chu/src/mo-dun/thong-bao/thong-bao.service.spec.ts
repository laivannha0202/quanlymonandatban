import { ThongBaoService } from './thong-bao.service';

describe('ThongBaoService - Prisma lifecycle', () => {
  it('tạo thông báo đặt bàn bằng relation Prisma khi khách có tài khoản', async () => {
    const prisma = {
      dat_ban: {
        findUnique: jest.fn().mockResolvedValue({
          khach_hang: {
            tai_khoan_id: 10n,
          },
        }),
      },
      thong_bao: {
        create: jest.fn().mockResolvedValue({
          id: 1n,
        }),
      },
    } as any;

    const service = new ThongBaoService(
      prisma,
    );

    await service.taoChoDatBan(
      5n,
      'DAT_BAN_XAC_NHAN',
      'Đặt bàn đã xác nhận',
      'Nội dung',
    );

    expect(prisma.thong_bao.create)
      .toHaveBeenCalledWith({
        data: {
          tai_khoan_id: 10n,
          dat_ban_id: 5n,
          loai_thong_bao:
            'DAT_BAN_XAC_NHAN',
          tieu_de:
            'Đặt bàn đã xác nhận',
          noi_dung: 'Nội dung',
          duong_dan:
            '/tai-khoan/dat-ban/5',
        },
      });
  });

  it('không tạo thông báo khi booking chưa gắn khách có tài khoản', async () => {
    const prisma = {
      dat_ban: {
        findUnique: jest.fn().mockResolvedValue({
          khach_hang: {
            tai_khoan_id: null,
          },
        }),
      },
      thong_bao: {
        create: jest.fn(),
      },
    } as any;

    const service = new ThongBaoService(
      prisma,
    );

    await service.taoChoDatBan(
      5n,
      'DAT_BAN_XAC_NHAN',
      'Đặt bàn đã xác nhận',
      'Nội dung',
    );

    expect(prisma.thong_bao.create)
      .not.toHaveBeenCalled();
  });

  it('list chỉ lấy thông báo của tài khoản hiện tại và phân trang', async () => {
    const prisma = {
      thong_bao: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 1n,
            tai_khoan_id: 10n,
            da_doc: false,
          },
        ]),
        count: jest.fn().mockResolvedValue(1),
      },
    } as any;

    const service = new ThongBaoService(
      prisma,
    );

    const result = await service.danhSach(
      '10',
      {
        trang: 1,
        kichThuoc: 20,
        daDoc: 'false',
      } as any,
    );

    expect(result.phanTrang).toEqual({
      trang: 1,
      kichThuoc: 20,
      tong: 1,
      tongTrang: 1,
    });

    expect(prisma.thong_bao.findMany)
      .toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tai_khoan_id: 10n,
            da_doc: false,
          },
          skip: 0,
          take: 20,
        }),
      );
  });

  it('đếm chưa đọc chỉ trong tài khoản hiện tại', async () => {
    const prisma = {
      thong_bao: {
        count: jest.fn().mockResolvedValue(3),
      },
    } as any;

    const service = new ThongBaoService(
      prisma,
    );

    await expect(
      service.soChuaDoc('10'),
    ).resolves.toEqual({
      soChuaDoc: 3,
    });

    expect(prisma.thong_bao.count)
      .toHaveBeenCalledWith({
        where: {
          tai_khoan_id: 10n,
          da_doc: false,
        },
      });
  });

  it('đọc một thông báo kiểm tra ownership trước khi update', async () => {
    const prisma = {
      thong_bao: {
        findFirst: jest.fn().mockResolvedValue({
          id: 7n,
          da_doc: false,
          thoi_gian_doc: null,
        }),
        update: jest.fn().mockResolvedValue({}),
      },
    } as any;

    const service = new ThongBaoService(
      prisma,
    );

    await expect(
      service.danhDauDaDoc(
        '10',
        '7',
      ),
    ).resolves.toEqual({
      daDoc: true,
    });

    expect(prisma.thong_bao.findFirst)
      .toHaveBeenCalledWith({
        where: {
          id: 7n,
          tai_khoan_id: 10n,
        },
        select: {
          id: true,
          da_doc: true,
          thoi_gian_doc: true,
        },
      });

    expect(prisma.thong_bao.update)
      .toHaveBeenCalledWith({
        where: {
          id: 7n,
        },
        data: {
          da_doc: true,
          thoi_gian_doc:
            expect.any(Date),
        },
      });
  });

  it('đọc lại thông báo đã đọc là idempotent', async () => {
    const prisma = {
      thong_bao: {
        findFirst: jest.fn().mockResolvedValue({
          id: 7n,
          da_doc: true,
          thoi_gian_doc: new Date(
            '2026-08-12T00:00:00.000Z',
          ),
        }),
        update: jest.fn(),
      },
    } as any;

    const service = new ThongBaoService(
      prisma,
    );

    await expect(
      service.danhDauDaDoc(
        '10',
        '7',
      ),
    ).resolves.toEqual({
      daDoc: true,
    });

    expect(prisma.thong_bao.update)
      .not.toHaveBeenCalled();
  });

  it('không cho đọc thông báo của tài khoản khác', async () => {
    const prisma = {
      thong_bao: {
        findFirst: jest.fn().mockResolvedValue(
          null,
        ),
        update: jest.fn(),
      },
    } as any;

    const service = new ThongBaoService(
      prisma,
    );

    await expect(
      service.danhDauDaDoc(
        '10',
        '99',
      ),
    ).rejects.toMatchObject({
      maLoi: 'THONG_BAO_001',
    });

    expect(prisma.thong_bao.update)
      .not.toHaveBeenCalled();
  });

  it('đọc tất cả chỉ cập nhật bản ghi chưa đọc của tài khoản hiện tại', async () => {
    const prisma = {
      thong_bao: {
        updateMany: jest.fn().mockResolvedValue({
          count: 4,
        }),
      },
    } as any;

    const service = new ThongBaoService(
      prisma,
    );

    await expect(
      service.docTatCa('10'),
    ).resolves.toEqual({
      soThongBaoDaDoc: 4,
    });

    expect(prisma.thong_bao.updateMany)
      .toHaveBeenCalledWith({
        where: {
          tai_khoan_id: 10n,
          da_doc: false,
        },
        data: {
          da_doc: true,
          thoi_gian_doc:
            expect.any(Date),
        },
      });
  });
});
