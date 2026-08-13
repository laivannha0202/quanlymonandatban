import { ThanhToanService } from './thanh-toan.service';

const pendingPayment = (overrides: Record<string, unknown> = {}) => ({
  id: 11n,
  ma_thanh_toan: 'TT20260820-000123',
  dat_ban_id: 123n,
  so_tien: 230000,
  phuong_thuc: 'MO_PHONG',
  trang_thai: 'CHO_THANH_TOAN',
  ma_giao_dich_cong: null,
  khoa_idempotency: null,
  thoi_gian_thanh_toan: null,
  ngay_tao: new Date(),
  ngay_cap_nhat: new Date(),
  dat_ban: {
    id: 123n,
    ma_dat_ban: 'DB20260820-000123',
    so_dien_thoai: '0909123456',
    trang_thai: 'CHO_XAC_NHAN',
    tong_thanh_toan_truoc: 230000,
  },
  ...overrides,
});

describe('ThanhToanService', () => {
  const tx = {
    thanh_toan: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    hoan_tien: {
      aggregate: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    dat_ban: {
      updateMany: jest.fn(),
    },
    su_dung_khuyen_mai: {
      updateMany: jest
        .fn()
        .mockResolvedValue({ count: 1 }),
    },
    lich_su_dat_ban: {
      create: jest.fn(),
    },
  };

  const prisma = {
    thanh_toan: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(async (callback: (client: typeof tx) => unknown) =>
      callback(tx),
    ),
  };

  const config = {
    get: jest.fn(),
  };

  const cauHinh = {
    laySo: jest.fn().mockResolvedValue(15),
  };

  const thongBao = {
    taoChoDatBan: jest.fn(),
  };

  const service = new ThanhToanService(
    prisma as never,
    config as never,
    cauHinh as never,
    thongBao as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    config.get.mockImplementation((key: string) => {
      if (key === 'NODE_ENV') return 'development';
      return undefined;
    });
    tx.thanh_toan.findUnique.mockReset();
    tx.thanh_toan.findUniqueOrThrow.mockReset();
    tx.thanh_toan.findMany.mockReset();
    tx.thanh_toan.update.mockReset();
    tx.thanh_toan.updateMany.mockReset();
    tx.hoan_tien.aggregate.mockReset();
    tx.hoan_tien.create.mockReset();
    tx.hoan_tien.findUnique.mockReset();
    tx.dat_ban.updateMany.mockReset();
    tx.lich_su_dat_ban.create.mockReset();
  });

  it('thanh toán pending đúng một lần và tự xác nhận booking', async () => {
    const row = pendingPayment();
    tx.thanh_toan.findUnique
      .mockResolvedValueOnce(row)
      .mockResolvedValueOnce(null);
    tx.thanh_toan.updateMany.mockResolvedValue({ count: 1 });
    tx.dat_ban.updateMany.mockResolvedValue({ count: 1 });
    tx.lich_su_dat_ban.create.mockResolvedValue({ id: 1n });
    tx.thanh_toan.findUniqueOrThrow.mockResolvedValue({
      ...row,
      trang_thai: 'DA_THANH_TOAN',
      khoa_idempotency: 'checkout-12345678',
      ma_giao_dich_cong: 'MO_PHONG-abc',
      thoi_gian_thanh_toan: new Date(),
    });

    const result = await service.xacNhanMoPhong({
      maDatBan: 'DB20260820-000123',
      soDienThoai: '0909123456',
      maThanhToan: 'TT20260820-000123',
      khoaIdempotency: 'checkout-12345678',
    });

    expect(tx.thanh_toan.updateMany).toHaveBeenCalledTimes(1);
    expect(tx.dat_ban.updateMany).toHaveBeenCalledTimes(1);
    expect(tx.lich_su_dat_ban.create).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      trangThai: 'DA_THANH_TOAN',
      trangThaiDatBan: 'DA_XAC_NHAN',
      vuaThanhToan: true,
      vuaXacNhanDatBan: true,
    });
    expect(thongBao.taoChoDatBan).toHaveBeenCalledTimes(1);
  });

  it('gửi lại payment đã thanh toán là idempotent và không thu lần hai', async () => {
    tx.thanh_toan.findUnique.mockResolvedValue(
      pendingPayment({
        trang_thai: 'DA_THANH_TOAN',
        khoa_idempotency: 'checkout-12345678',
        dat_ban: {
          ...pendingPayment().dat_ban,
          trang_thai: 'DA_XAC_NHAN',
        },
      }),
    );

    const result = await service.xacNhanMoPhong({
      maDatBan: 'DB20260820-000123',
      soDienThoai: '0909123456',
      maThanhToan: 'TT20260820-000123',
      khoaIdempotency: 'checkout-12345678',
    });

    expect(tx.thanh_toan.updateMany).not.toHaveBeenCalled();
    expect(result.vuaThanhToan).toBe(false);
  });

  it('chặn reuse idempotency key cho payment khác', async () => {
    tx.thanh_toan.findUnique
      .mockResolvedValueOnce(pendingPayment())
      .mockResolvedValueOnce({
        id: 99n,
        ma_thanh_toan: 'TT-OTHER',
      });

    await expect(
      service.xacNhanMoPhong({
        maDatBan: 'DB20260820-000123',
        soDienThoai: '0909123456',
        maThanhToan: 'TT20260820-000123',
        khoaIdempotency: 'checkout-12345678',
      }),
    ).rejects.toMatchObject({ maLoi: 'THANH_TOAN_004' });

    expect(tx.thanh_toan.updateMany).not.toHaveBeenCalled();
  });

  it('chặn số tiền payment lệch snapshot booking', async () => {
    tx.thanh_toan.findUnique.mockResolvedValue(
      pendingPayment({ so_tien: 220000 }),
    );

    await expect(
      service.xacNhanMoPhong({
        maDatBan: 'DB20260820-000123',
        soDienThoai: '0909123456',
        maThanhToan: 'TT20260820-000123',
        khoaIdempotency: 'checkout-12345678',
      }),
    ).rejects.toMatchObject({ maLoi: 'THANH_TOAN_003' });
  });

  it('chặn thanh toán booking đã hủy', async () => {
    tx.thanh_toan.findUnique.mockResolvedValue(
      pendingPayment({
        dat_ban: {
          ...pendingPayment().dat_ban,
          trang_thai: 'DA_HUY',
        },
      }),
    );

    await expect(
      service.xacNhanMoPhong({
        maDatBan: 'DB20260820-000123',
        soDienThoai: '0909123456',
        maThanhToan: 'TT20260820-000123',
        khoaIdempotency: 'checkout-12345678',
      }),
    ).rejects.toMatchObject({ maLoi: 'THANH_TOAN_005' });
  });


  it('hoàn 100% payment mô phỏng và chuyển payment sang DA_HOAN_TIEN', async () => {
    tx.thanh_toan.updateMany.mockResolvedValue({ count: 0 });
    tx.thanh_toan.findMany.mockResolvedValue([
      {
        id: 11n,
        ma_thanh_toan: 'TT20260820-000123',
        so_tien: 230000,
        phuong_thuc: 'MO_PHONG',
        trang_thai: 'DA_THANH_TOAN',
      },
    ]);
    tx.hoan_tien.aggregate
      .mockResolvedValueOnce({ _sum: { so_tien: null } })
      .mockResolvedValueOnce({ _sum: { so_tien: 230000 } });
    tx.hoan_tien.create.mockResolvedValue({
      id: 21n,
      ma_hoan_tien: 'HT-TEST',
      so_tien: 230000,
      trang_thai: 'DA_HOAN',
    });
    tx.thanh_toan.update.mockResolvedValue({ id: 11n });

    const result = await service.hoanTienDatBanTrongTransaction(
      tx as never,
      123n,
      100,
      'Khách hủy đúng hạn',
      5n,
      true,
    );

    expect(result.tongHoan).toBe(230000);
    expect(tx.hoan_tien.create).toHaveBeenCalledTimes(1);
    expect(tx.thanh_toan.update).toHaveBeenCalledWith({
      where: { id: 11n },
      data: { trang_thai: 'DA_HOAN_TIEN' },
    });
  });

  it('hỗ trợ tỷ lệ hoàn một phần theo cấu hình', async () => {
    tx.thanh_toan.updateMany.mockResolvedValue({ count: 0 });
    tx.thanh_toan.findMany.mockResolvedValue([
      {
        id: 11n,
        ma_thanh_toan: 'TT20260820-000123',
        so_tien: 200000,
        phuong_thuc: 'MO_PHONG',
        trang_thai: 'DA_THANH_TOAN',
      },
    ]);
    tx.hoan_tien.aggregate
      .mockResolvedValueOnce({ _sum: { so_tien: 0 } })
      .mockResolvedValueOnce({ _sum: { so_tien: 100000 } });
    tx.hoan_tien.create.mockResolvedValue({
      id: 22n,
      ma_hoan_tien: 'HT-PARTIAL',
      so_tien: 100000,
      trang_thai: 'DA_HOAN',
    });
    tx.thanh_toan.update.mockResolvedValue({ id: 11n });

    const result = await service.hoanTienDatBanTrongTransaction(
      tx as never,
      123n,
      50,
      'Hoàn theo chính sách',
      5n,
      true,
    );

    expect(result.tongHoan).toBe(100000);
    expect(tx.thanh_toan.update).toHaveBeenCalledWith({
      where: { id: 11n },
      data: { trang_thai: 'HOAN_MOT_PHAN' },
    });
  });

  it('chặn admin không có quyền hoàn tiền khi booking đã thu tiền', async () => {
    tx.thanh_toan.updateMany.mockResolvedValue({ count: 0 });
    tx.thanh_toan.findMany.mockResolvedValue([
      {
        id: 11n,
        ma_thanh_toan: 'TT20260820-000123',
        so_tien: 230000,
        phuong_thuc: 'MO_PHONG',
        trang_thai: 'DA_THANH_TOAN',
      },
    ]);
    tx.hoan_tien.aggregate.mockResolvedValue({
      _sum: { so_tien: 0 },
    });

    await expect(
      service.hoanTienDatBanTrongTransaction(
        tx as never,
        123n,
        100,
        'Admin hủy',
        5n,
        false,
      ),
    ).rejects.toMatchObject({ maLoi: 'THANH_TOAN_007' });

    expect(tx.hoan_tien.create).not.toHaveBeenCalled();
  });

  it('hủy payment pending khi booking hủy nhưng không tạo refund', async () => {
    tx.thanh_toan.updateMany.mockResolvedValue({ count: 1 });
    tx.thanh_toan.findMany.mockResolvedValue([]);

    const result = await service.hoanTienDatBanTrongTransaction(
      tx as never,
      123n,
      100,
      'Hủy trước khi thanh toán',
      null,
      false,
    );

    expect(result.tongHoan).toBe(0);
    expect(tx.thanh_toan.updateMany).toHaveBeenCalledWith({
      where: {
        dat_ban_id: 123n,
        trang_thai: 'CHO_THANH_TOAN',
      },
      data: {
        trang_thai: 'DA_HUY',
        ghi_chu: 'Hủy cùng đặt bàn: Hủy trước khi thanh toán',
      },
    });
    expect(tx.hoan_tien.create).not.toHaveBeenCalled();
  });

  it('tắt payment mô phỏng mặc định trong production', async () => {
    config.get.mockImplementation((key: string) => {
      if (key === 'NODE_ENV') return 'production';
      return undefined;
    });

    await expect(
      service.xacNhanMoPhong({
        maDatBan: 'DB20260820-000123',
        soDienThoai: '0909123456',
        maThanhToan: 'TT20260820-000123',
        khoaIdempotency: 'checkout-12345678',
      }),
    ).rejects.toMatchObject({ maLoi: 'THANH_TOAN_006' });

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
