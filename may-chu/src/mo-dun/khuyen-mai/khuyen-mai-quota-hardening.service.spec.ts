import { KhuyenMaiService } from './khuyen-mai.service';

describe('KhuyenMaiService - hardening cập nhật quota', () => {
  const nguoiDung = {
    taiKhoanId: '10',
  } as any;

  const row = {
    id: 1n,
    ma_khuyen_mai: 'QUOTA_TEST',
    ten_khuyen_mai: 'Quota test',
    mo_ta: null,
    loai_giam: 'PHAN_TRAM',
    gia_tri: 10,
    gia_tri_don_toi_thieu: 0,
    giam_toi_da: 50000,
    so_luot_toi_da: 10,
    so_luot_moi_khach: 3,
    ngay_bat_dau: new Date(
      '2026-08-01T00:00:00.000Z',
    ),
    ngay_ket_thuc: new Date(
      '2026-08-31T23:59:59.000Z',
    ),
    trang_thai: 'HOAT_DONG',
    ngay_tao: new Date(
      '2026-08-01T00:00:00.000Z',
    ),
    ngay_cap_nhat: new Date(
      '2026-08-01T00:00:00.000Z',
    ),
    ngay_xoa: null,
  };

  function taoService(options: {
    activeCount: number;
    maxPerCustomer: number;
  }) {
    const tx = {
      $queryRaw: jest
        .fn()
        .mockResolvedValueOnce([
          {
            id: 1n,
            so_luot_toi_da: 10,
            so_luot_moi_khach: 3,
          },
        ])
        .mockResolvedValueOnce([
          {
            so_luot_lon_nhat:
              BigInt(options.maxPerCustomer),
          },
        ]),
      su_dung_khuyen_mai: {
        count: jest
          .fn()
          .mockResolvedValue(
            options.activeCount,
          ),
      },
      khuyen_mai: {
        update: jest
          .fn()
          .mockResolvedValue(row),
      },
    };

    const prisma = {
      khuyen_mai: {
        findFirst: jest
          .fn()
          .mockResolvedValue(row),
      },
      su_dung_khuyen_mai: {
        groupBy: jest
          .fn()
          .mockResolvedValue([]),
      },
      $transaction: jest.fn(
        async (
          callback: (
            transaction: typeof tx,
          ) => unknown,
        ) => callback(tx),
      ),
    };

    const nhatKy = {
      ghiNhan: jest
        .fn()
        .mockResolvedValue(undefined),
    };

    return {
      tx,
      prisma,
      service: new KhuyenMaiService(
        prisma as never,
        nhatKy as never,
      ),
    };
  }

  it('không cho hạ tổng quota thấp hơn DA_GIU + DA_DUNG', async () => {
    const {
      service,
      tx,
    } = taoService({
      activeCount: 4,
      maxPerCustomer: 2,
    });

    await expect(
      service.capNhat(
        '1',
        {
          soLuotToiDa: 3,
        },
        nguoiDung,
      ),
    ).rejects.toMatchObject({
      maLoi: 'KHUYEN_MAI_012',
    });

    expect(
      tx.khuyen_mai.update,
    ).not.toHaveBeenCalled();
  });

  it('không cho hạ quota mỗi khách thấp hơn mức active lớn nhất', async () => {
    const {
      service,
      tx,
    } = taoService({
      activeCount: 4,
      maxPerCustomer: 2,
    });

    await expect(
      service.capNhat(
        '1',
        {
          soLuotMoiKhach: 1,
        },
        nguoiDung,
      ),
    ).rejects.toMatchObject({
      maLoi: 'KHUYEN_MAI_013',
    });

    expect(
      tx.khuyen_mai.update,
    ).not.toHaveBeenCalled();
  });

  it('cho phép tăng quota sau khi đã khóa promotion row', async () => {
    const {
      service,
      tx,
      prisma,
    } = taoService({
      activeCount: 4,
      maxPerCustomer: 2,
    });

    await expect(
      service.capNhat(
        '1',
        {
          soLuotToiDa: 20,
          soLuotMoiKhach: 5,
        },
        nguoiDung,
      ),
    ).resolves.toBeDefined();

    expect(
      prisma.$transaction,
    ).toHaveBeenCalledTimes(1);

    expect(
      tx.$queryRaw,
    ).toHaveBeenCalledTimes(2);

    expect(
      tx.khuyen_mai.update,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1n },
        data: expect.objectContaining({
          so_luot_toi_da: 20,
          so_luot_moi_khach: 5,
        }),
      }),
    );
  });
});
