import { DatBanTinhTienService } from './dat-ban-tinh-tien.service';

const mon = (overrides: Record<string, unknown> = {}) => ({
  id: 1n,
  ma_mon: 'MON001',
  ten_mon: 'Bún bò',
  gia: 65000,
  gia_khuyen_mai: null,
  ...overrides,
});

const promo = (overrides: Record<string, unknown> = {}) => ({
  id: 10n,
  ma_khuyen_mai: 'GIAM10',
  ten_khuyen_mai: 'Giảm 10%',
  loai_giam: 'PHAN_TRAM',
  gia_tri: 10,
  gia_tri_don_toi_thieu: null,
  giam_toi_da: null,
  ngay_bat_dau: new Date(Date.now() - 60_000),
  ngay_ket_thuc: new Date(Date.now() + 60_000),
  trang_thai: 'HOAT_DONG',
  ngay_xoa: null,
  ...overrides,
});

describe('DatBanTinhTienService', () => {
  const prisma = {
    mon_an: {
      findMany: jest.fn(),
    },
    khuyen_mai: {
      findUnique: jest.fn(),
    },
  };

  const cauHinh = {
    layBoolean: jest.fn(),
    laySo: jest.fn(),
  };

  const service = new DatBanTinhTienService(prisma as never, cauHinh as never);

  beforeEach(() => {
    jest.clearAllMocks();

    cauHinh.layBoolean.mockImplementation(async (khoa: string) => {
      if (khoa === 'CHO_PHEP_DAT_MON_TRUOC') return true;
      if (khoa === 'YEU_CAU_THANH_TOAN_MON_TRUOC') return true;
      throw new Error(`Unexpected config ${khoa}`);
    });
    cauHinh.laySo.mockResolvedValue(100000);
    prisma.mon_an.findMany.mockResolvedValue([]);
    prisma.khuyen_mai.findUnique.mockResolvedValue(null);
  });

  it('chỉ đặt bàn vẫn tính đúng tiền cọc', async () => {
    const result = await service.tinh({});

    expect(result).toMatchObject({
      monAn: [],
      khuyenMai: null,
      tamTinhMon: 0,
      tienGiam: 0,
      tienMonSauGiam: 0,
      tienMonThanhToanTruoc: 0,
      tienCoc: 100000,
      tongThanhToanTruoc: 100000,
    });
  });

  it('lấy giá từ DB và ưu tiên giá khuyến mãi của món', async () => {
    prisma.mon_an.findMany.mockResolvedValue([
      mon({ id: 1n, gia: 65000, gia_khuyen_mai: 60000 }),
      mon({ id: 2n, ma_mon: 'MON002', ten_mon: 'Gỏi cuốn', gia: 45000 }),
    ]);

    const result = await service.tinh({
      monAn: [
        { monAnId: '1', soLuong: 2 },
        { monAnId: '2', soLuong: 1 },
      ],
    });

    expect(result.tamTinhMon).toBe(165000);
    expect(result.tongThanhToanTruoc).toBe(265000);
    expect(result.monAn[0]).toMatchObject({
      monAnId: '1',
      donGia: 60000,
      soLuong: 2,
      thanhTien: 120000,
    });
  });

  it('áp giảm phần trăm và giới hạn giảm tối đa', async () => {
    prisma.mon_an.findMany.mockResolvedValue([mon({ gia: 300000 })]);
    prisma.khuyen_mai.findUnique.mockResolvedValue(
      promo({
        gia_tri: 20,
        gia_tri_don_toi_thieu: 200000,
        giam_toi_da: 50000,
      }),
    );

    const result = await service.tinh({
      monAn: [{ monAnId: '1', soLuong: 1 }],
      maKhuyenMai: 'GIAM10',
    });

    expect(result.tamTinhMon).toBe(300000);
    expect(result.tienGiam).toBe(50000);
    expect(result.tienMonSauGiam).toBe(250000);
    expect(result.tongThanhToanTruoc).toBe(350000);
  });

  it('không cho giảm số tiền vượt quá tiền món', async () => {
    prisma.mon_an.findMany.mockResolvedValue([mon({ gia: 40000 })]);
    prisma.khuyen_mai.findUnique.mockResolvedValue(
      promo({ loai_giam: 'SO_TIEN', gia_tri: 100000 }),
    );

    const result = await service.tinh({
      monAn: [{ monAnId: '1', soLuong: 1 }],
      maKhuyenMai: 'GIAM10',
    });

    expect(result.tienGiam).toBe(40000);
    expect(result.tienMonSauGiam).toBe(0);
    expect(result.tongThanhToanTruoc).toBe(100000);
  });

  it('chặn mã không đủ giá trị món tối thiểu', async () => {
    prisma.mon_an.findMany.mockResolvedValue([mon({ gia: 65000 })]);
    prisma.khuyen_mai.findUnique.mockResolvedValue(
      promo({ gia_tri_don_toi_thieu: 100000 }),
    );

    await expect(
      service.tinh({
        monAn: [{ monAnId: '1', soLuong: 1 }],
        maKhuyenMai: 'GIAM10',
      }),
    ).rejects.toMatchObject({ maLoi: 'KHUYEN_MAI_007' });
  });

  it('chặn mã hết hạn hoặc ngừng hoạt động', async () => {
    prisma.mon_an.findMany.mockResolvedValue([mon()]);
    prisma.khuyen_mai.findUnique.mockResolvedValue(
      promo({ trang_thai: 'NGUNG_HOAT_DONG' }),
    );

    await expect(
      service.tinh({
        monAn: [{ monAnId: '1', soLuong: 1 }],
        maKhuyenMai: 'GIAM10',
      }),
    ).rejects.toMatchObject({ maLoi: 'KHUYEN_MAI_006' });
  });

  it('chặn món trùng và món không còn phục vụ', async () => {
    await expect(
      service.tinh({
        monAn: [
          { monAnId: '1', soLuong: 1 },
          { monAnId: '1', soLuong: 2 },
        ],
      }),
    ).rejects.toMatchObject({ maLoi: 'DAT_BAN_021' });

    prisma.mon_an.findMany.mockResolvedValue([]);
    await expect(
      service.tinh({
        monAn: [{ monAnId: '1', soLuong: 1 }],
      }),
    ).rejects.toMatchObject({ maLoi: 'DAT_BAN_022' });
  });

  it('khi không yêu cầu trả món trước thì tổng trước chỉ còn tiền cọc', async () => {
    cauHinh.layBoolean.mockImplementation(async (khoa: string) => {
      if (khoa === 'CHO_PHEP_DAT_MON_TRUOC') return true;
      if (khoa === 'YEU_CAU_THANH_TOAN_MON_TRUOC') return false;
      throw new Error(`Unexpected config ${khoa}`);
    });

    prisma.mon_an.findMany.mockResolvedValue([mon({ gia: 65000 })]);

    const result = await service.tinh({
      monAn: [{ monAnId: '1', soLuong: 2 }],
    });

    expect(result.tamTinhMon).toBe(130000);
    expect(result.tienMonThanhToanTruoc).toBe(0);
    expect(result.tongThanhToanTruoc).toBe(100000);
  });

  it('dùng transaction client khi tính giá trong transaction', async () => {
    const tx = {
      mon_an: {
        findMany: jest.fn().mockResolvedValue([mon({ gia: 70000 })]),
      },
      khuyen_mai: {
        findUnique: jest.fn(),
      },
    };

    const result = await service.tinhTrongTransaction(
      tx as never,
      { monAn: [{ monAnId: '1', soLuong: 2 }] },
    );

    expect(tx.mon_an.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.mon_an.findMany).not.toHaveBeenCalled();
    expect(result.tamTinhMon).toBe(140000);
  });

  it('chặn chọn món khi cấu hình đã tắt', async () => {
    cauHinh.layBoolean.mockImplementation(async (khoa: string) => {
      if (khoa === 'CHO_PHEP_DAT_MON_TRUOC') return false;
      if (khoa === 'YEU_CAU_THANH_TOAN_MON_TRUOC') return true;
      throw new Error(`Unexpected config ${khoa}`);
    });

    await expect(
      service.tinh({ monAn: [{ monAnId: '1', soLuong: 1 }] }),
    ).rejects.toMatchObject({ maLoi: 'DAT_BAN_023' });
  });
});

describe('DatBanTinhTienService - quota khuyến mãi', () => {
  function taoTx(options: {
    soLuotToiDa?: number | null;
    soLuotMoiKhach?: number | null;
    tongDangChiem?: number;
    cuaKhach?: number;
  } = {}) {
    const count = jest
      .fn()
      .mockResolvedValueOnce(
        options.tongDangChiem ?? 0,
      )
      .mockResolvedValueOnce(
        options.cuaKhach ?? 0,
      );

    return {
      $queryRaw: jest.fn().mockResolvedValue([
        {
          id: 10n,
          so_luot_toi_da:
            options.soLuotToiDa ?? null,
          so_luot_moi_khach:
            options.soLuotMoiKhach ?? null,
        },
      ]),
      su_dung_khuyen_mai: {
        count,
        create: jest
          .fn()
          .mockResolvedValue({
            id: 1n,
          }),
      },
    };
  }

  const service = new DatBanTinhTienService(
    {} as never,
    {} as never,
  );

  it('giữ quota và chuẩn hóa +84 về số 0 đầu', async () => {
    const tx = taoTx({
      soLuotToiDa: 100,
      soLuotMoiKhach: 1,
    });

    await service.giuKhuyenMaiTrongTransaction(
      tx as never,
      {
        khuyenMaiId: 10n,
        datBanId: 20n,
        soDienThoai: '+84 909 123 456',
      },
    );

    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
    expect(
      tx.su_dung_khuyen_mai.count,
    ).toHaveBeenCalledTimes(2);
    expect(
      tx.su_dung_khuyen_mai.create,
    ).toHaveBeenCalledWith({
      data: {
        khuyen_mai_id: 10n,
        dat_ban_id: 20n,
        so_dien_thoai_chuan: '0909123456',
        trang_thai: 'DA_GIU',
      },
    });
  });

  it('chặn khi tổng quota đã hết', async () => {
    const tx = taoTx({
      soLuotToiDa: 1,
      soLuotMoiKhach: 5,
      tongDangChiem: 1,
      cuaKhach: 0,
    });

    await expect(
      service.giuKhuyenMaiTrongTransaction(
        tx as never,
        {
          khuyenMaiId: 10n,
          datBanId: 20n,
          soDienThoai: '0909123456',
        },
      ),
    ).rejects.toMatchObject({
      maLoi: 'KHUYEN_MAI_009',
    });

    expect(
      tx.su_dung_khuyen_mai.create,
    ).not.toHaveBeenCalled();
  });

  it('chặn khi khách đã hết quota cá nhân', async () => {
    const tx = taoTx({
      soLuotToiDa: 100,
      soLuotMoiKhach: 1,
      tongDangChiem: 5,
      cuaKhach: 1,
    });

    await expect(
      service.giuKhuyenMaiTrongTransaction(
        tx as never,
        {
          khuyenMaiId: 10n,
          datBanId: 20n,
          soDienThoai: '0909123456',
        },
      ),
    ).rejects.toMatchObject({
      maLoi: 'KHUYEN_MAI_010',
    });

    expect(
      tx.su_dung_khuyen_mai.create,
    ).not.toHaveBeenCalled();
  });
});
