import { ThanhToanService } from './thanh-toan.service';

describe('ThanhToanService - timeout giữ bàn', () => {
  const taoService = (overrides: {
    candidates?: any[];
    paymentUpdateCount?: number;
    bookingUpdateCount?: number;
  } = {}) => {
    const tx = {
      thanh_toan: {
        updateMany: jest
          .fn()
          .mockResolvedValue({
            count: overrides.paymentUpdateCount ?? 1,
          }),
      },
      dat_ban: {
        updateMany: jest
          .fn()
          .mockResolvedValue({
            count: overrides.bookingUpdateCount ?? 1,
          }),
      },
      su_dung_khuyen_mai: {
      updateMany: jest
        .fn()
        .mockResolvedValue({ count: 1 }),
    },
    lich_su_dat_ban: {
        create: jest.fn().mockResolvedValue({}),
      },
    };

    const prisma = {
      thanh_toan: {
        findMany: jest.fn().mockResolvedValue(
          overrides.candidates ?? [
            {
              id: 5n,
              dat_ban_id: 9n,
              ma_thanh_toan: 'TT-DEMO',
              dat_ban: {
                id: 9n,
                ma_dat_ban: 'DB-DEMO',
              },
            },
          ],
        ),
      },
      $transaction: jest.fn(
        async (callback: (client: typeof tx) => unknown) =>
          callback(tx),
      ),
    };

    const cauHinh = {
      laySo: jest.fn().mockResolvedValue(15),
    };

    const thongBao = {
      taoChoDatBan: jest.fn().mockResolvedValue({}),
    };

    const service = Object.create(
      ThanhToanService.prototype,
    ) as ThanhToanService;

    Object.assign(service as any, {
      prisma,
      cauHinh,
      thongBao,
    });

    return {
      service,
      prisma,
      tx,
      cauHinh,
      thongBao,
    };
  };

  it('hủy payment + booking quá hạn và ghi lịch sử', async () => {
    const { service, tx, cauHinh, thongBao } = taoService();

    const result =
      await service.huyDatBanQuaHanThanhToan();

    expect(result).toBe(1);
    expect(cauHinh.laySo).toHaveBeenCalledWith(
      'THOI_GIAN_THANH_TOAN_PHUT',
    );
    expect(tx.thanh_toan.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 5n,
          trang_thai: 'CHO_THANH_TOAN',
        }),
        data: {
          trang_thai: 'DA_HUY',
        },
      }),
    );
    expect(tx.dat_ban.updateMany).toHaveBeenCalledWith({
      where: {
        id: 9n,
        trang_thai: 'CHO_XAC_NHAN',
      },
      data: {
        trang_thai: 'DA_HUY',
      },
    });
    expect(tx.lich_su_dat_ban.create).toHaveBeenCalled();
    expect(thongBao.taoChoDatBan).toHaveBeenCalledWith(
      9n,
      'DAT_BAN_HET_HAN_THANH_TOAN',
      expect.any(String),
      expect.any(String),
    );
  });

  it('không hủy booking nếu payment CAS đã thua thanh toán', async () => {
    const { service, tx } = taoService({
      paymentUpdateCount: 0,
    });

    const result =
      await service.huyDatBanQuaHanThanhToan();

    expect(result).toBe(0);
    expect(tx.dat_ban.updateMany).not.toHaveBeenCalled();
    expect(tx.lich_su_dat_ban.create).not.toHaveBeenCalled();
  });

  it('khôi phục payment nếu booking vừa được nhân viên xác nhận', async () => {
    const { service, tx } = taoService({
      bookingUpdateCount: 0,
    });

    const result =
      await service.huyDatBanQuaHanThanhToan();

    expect(result).toBe(0);
    expect(tx.thanh_toan.updateMany).toHaveBeenCalledTimes(2);
    expect(tx.thanh_toan.updateMany).toHaveBeenLastCalledWith({
      where: {
        id: 5n,
        trang_thai: 'DA_HUY',
      },
      data: {
        trang_thai: 'CHO_THANH_TOAN',
      },
    });
    expect(tx.lich_su_dat_ban.create).not.toHaveBeenCalled();
  });

  it('không mở transaction khi không có payment quá hạn', async () => {
    const { service, prisma } = taoService({
      candidates: [],
    });

    const result =
      await service.huyDatBanQuaHanThanhToan();

    expect(result).toBe(0);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
