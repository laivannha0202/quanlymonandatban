import { VaiTroService } from './vai-tro.service';

describe('VaiTroService - RBAC invariants', () => {
  const nguoiDung = {
    taiKhoanId: '99',
    vaiTroId: '1',
    maVaiTro: 'QUAN_TRI_VIEN',
  } as any;

  const quyenXem = {
    id: 11n,
    ma_quyen: 'DAT_BAN_XEM',
    ten_quyen: 'Xem đặt bàn',
    nhom_quyen: 'DAT_BAN',
    mo_ta: null,
    ngay_tao: new Date('2026-08-12T00:00:00.000Z'),
    ngay_cap_nhat: new Date('2026-08-12T00:00:00.000Z'),
  };

  const quyenSua = {
    id: 12n,
    ma_quyen: 'DAT_BAN_SUA',
    ten_quyen: 'Sửa đặt bàn',
    nhom_quyen: 'DAT_BAN',
    mo_ta: null,
    ngay_tao: new Date('2026-08-12T00:00:00.000Z'),
    ngay_cap_nhat: new Date('2026-08-12T00:00:00.000Z'),
  };

  const roleRow = {
    id: 2n,
    ma_vai_tro: 'NHAN_VIEN',
    ten_vai_tro: 'Nhân viên',
    mo_ta: null,
    la_he_thong: true,
    trang_thai: 'HOAT_DONG',
    ngay_tao: new Date('2026-08-12T00:00:00.000Z'),
    ngay_cap_nhat: new Date('2026-08-12T00:00:00.000Z'),
    vai_tro_quyen: [
      { vai_tro_id: 2n, quyen_id: 12n, ngay_tao: new Date(), quyen: quyenSua },
      { vai_tro_id: 2n, quyen_id: 11n, ngay_tao: new Date(), quyen: quyenXem },
    ],
  };

  it('danh sách tải vai trò + quyền trong một relation query', async () => {
    const prisma = {
      vai_tro: {
        findMany: jest.fn().mockResolvedValue([
          roleRow,
        ]),
      },
    } as any;

    const service = new VaiTroService(
      prisma,
      {} as any,
    );

    const result = await service.danhSach();

    expect(prisma.vai_tro.findMany)
      .toHaveBeenCalledTimes(1);

    expect(result[0].quyen.map(
      (item: any) => item.ma_quyen,
    )).toEqual([
      'DAT_BAN_SUA',
      'DAT_BAN_XEM',
    ]);
  });

  it('không cho sửa quyền QUAN_TRI_VIEN', async () => {
    const prisma = {
      vai_tro: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1n,
          ma_vai_tro: 'QUAN_TRI_VIEN',
          trang_thai: 'HOAT_DONG',
        }),
      },
    } as any;

    const service = new VaiTroService(
      prisma,
      {} as any,
    );

    await expect(
      service.capNhatQuyen(
        '1',
        { maQuyens: [] },
        nguoiDung,
      ),
    ).rejects.toMatchObject({
      maLoi: 'VAI_TRO_002',
    });
  });

  it('không cho gán quyền quản trị vào KHACH_HANG', async () => {
    const prisma = {
      vai_tro: {
        findUnique: jest.fn().mockResolvedValue({
          id: 3n,
          ma_vai_tro: 'KHACH_HANG',
          trang_thai: 'HOAT_DONG',
        }),
      },
    } as any;

    const service = new VaiTroService(
      prisma,
      {} as any,
    );

    await expect(
      service.capNhatQuyen(
        '3',
        {
          maQuyens: [
            'VAI_TRO_QUAN_LY',
          ],
        },
        nguoiDung,
      ),
    ).rejects.toMatchObject({
      maLoi: 'VAI_TRO_004',
    });
  });

  it('không cho người dùng tự sửa quyền của vai trò đang sử dụng', async () => {
    const prisma = {
      vai_tro: {
        findUnique: jest.fn().mockResolvedValue({
          id: 2n,
          ma_vai_tro: 'NHAN_VIEN',
          trang_thai: 'HOAT_DONG',
        }),
      },
    } as any;

    const service = new VaiTroService(
      prisma,
      {} as any,
    );

    await expect(
      service.capNhatQuyen(
        '2',
        {
          maQuyens: ['DAT_BAN_XEM'],
        },
        {
          taiKhoanId: '50',
          vaiTroId: '2',
          maVaiTro: 'NHAN_VIEN',
        } as any,
      ),
    ).rejects.toMatchObject({
      maLoi: 'VAI_TRO_005',
    });
  });

  it('từ chối mã quyền không tồn tại trước khi ghi transaction', async () => {
    const prisma = {
      vai_tro: {
        findUnique: jest.fn().mockResolvedValue({
          id: 2n,
          ma_vai_tro: 'NHAN_VIEN',
          trang_thai: 'HOAT_DONG',
        }),
      },
      quyen: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 11n,
            ma_quyen: 'DAT_BAN_XEM',
          },
        ]),
      },
      $transaction: jest.fn(),
    } as any;

    const service = new VaiTroService(
      prisma,
      {} as any,
    );

    await expect(
      service.capNhatQuyen(
        '2',
        {
          maQuyens: [
            'DAT_BAN_XEM',
            'KHONG_TON_TAI',
          ],
        },
        nguoiDung,
      ),
    ).rejects.toMatchObject({
      maLoi: 'VAI_TRO_003',
    });

    expect(prisma.$transaction)
      .not.toHaveBeenCalled();
  });

  it('thay toàn bộ quyền trong một transaction', async () => {
    const roleNoLinks = {
      ...roleRow,
      vai_tro_quyen: [],
    };

    const roleAfter = {
      ...roleRow,
      vai_tro_quyen: [
        {
          vai_tro_id: 2n,
          quyen_id: 11n,
          ngay_tao: new Date(),
          quyen: quyenXem,
        },
      ],
    };

    const tx = {
      vai_tro_quyen: {
        deleteMany: jest.fn().mockResolvedValue({
          count: 2,
        }),
        createMany: jest.fn().mockResolvedValue({
          count: 1,
        }),
      },
    } as any;

    const prisma = {
      vai_tro: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce({
            id: 2n,
            ma_vai_tro: 'NHAN_VIEN',
            trang_thai: 'HOAT_DONG',
          })
          .mockResolvedValueOnce(roleNoLinks)
          .mockResolvedValueOnce(roleAfter),
      },
      quyen: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 11n,
            ma_quyen: 'DAT_BAN_XEM',
          },
        ]),
      },
      $transaction: jest.fn(
        async (callback: (client: any) => unknown) =>
          callback(tx),
      ),
    } as any;

    const nhatKy = {
      ghiNhan: jest.fn().mockResolvedValue(undefined),
    } as any;

    const service = new VaiTroService(
      prisma,
      nhatKy,
    );

    await service.capNhatQuyen(
      '2',
      {
        maQuyens: [' DAT_BAN_XEM '],
      },
      nguoiDung,
    );

    expect(tx.vai_tro_quyen.deleteMany)
      .toHaveBeenCalledWith({
        where: {
          vai_tro_id: 2n,
        },
      });

    expect(tx.vai_tro_quyen.createMany)
      .toHaveBeenCalledWith({
        data: [
          {
            vai_tro_id: 2n,
            quyen_id: 11n,
          },
        ],
      });

    expect(nhatKy.ghiNhan)
      .toHaveBeenCalledTimes(1);
  });
});
