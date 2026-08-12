import { KhuyenMaiService } from './khuyen-mai.service';

describe('KhuyenMaiService - Prisma CRUD', () => {
  const nguoiDung = {
    taiKhoanId: '10',
  } as any;

  const row = {
    id: 1n,
    ma_khuyen_mai: 'HV_HE_2026',
    ten_khuyen_mai: 'Khuyến mãi hè',
    mo_ta: null,
    loai_giam: 'PHAN_TRAM',
    gia_tri: { toString: () => '15.00' },
    gia_tri_don_toi_thieu: {
      toString: () => '200000.00',
    },
    giam_toi_da: {
      toString: () => '50000.00',
    },
    ngay_bat_dau: new Date(
      '2026-08-01T00:00:00.000Z',
    ),
    ngay_ket_thuc: new Date(
      '2026-08-31T23:59:59.000Z',
    ),
    so_luot_toi_da: 100,
    so_luot_da_dung: 10,
    trang_thai: 'HOAT_DONG',
    ngay_tao: new Date(
      '2026-08-01T00:00:00.000Z',
    ),
    ngay_cap_nhat: new Date(
      '2026-08-01T00:00:00.000Z',
    ),
    ngay_xoa: null,
  };

  it('danh sách quản trị dùng Prisma và chuẩn hóa Decimal thành number', async () => {
    const prisma = {
      khuyen_mai: {
        findMany: jest.fn().mockResolvedValue([row]),
        count: jest.fn().mockResolvedValue(1),
      },
    } as any;

    const service = new KhuyenMaiService(
      prisma,
      {} as any,
    );

    const result = await service.danhSach({
      trang: 1,
      kichThuoc: 20,
    } as any);

    expect(result.danhSach[0]).toEqual(
      expect.objectContaining({
        gia_tri: 15,
        gia_tri_don_toi_thieu: 200000,
        giam_toi_da: 50000,
      }),
    );
  });

  it('public loại chương trình đã hết lượt', async () => {
    const prisma = {
      khuyen_mai: {
        findMany: jest.fn().mockResolvedValue([
          row,
          {
            ...row,
            id: 2n,
            so_luot_toi_da: 10,
            so_luot_da_dung: 10,
          },
        ]),
      },
    } as any;

    const service = new KhuyenMaiService(
      prisma,
      {} as any,
    );

    const result = await service.dangApDung();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1n);
  });

  it('không cho đổi mã khuyến mãi sau khi tạo', async () => {
    const prisma = {
      khuyen_mai: {
        findFirst: jest.fn().mockResolvedValue(row),
        update: jest.fn(),
      },
    } as any;

    const service = new KhuyenMaiService(
      prisma,
      {} as any,
    );

    await expect(
      service.capNhat(
        '1',
        {
          maKhuyenMai: 'HV_MA_MOI',
        } as any,
        nguoiDung,
      ),
    ).rejects.toMatchObject({
      maLoi: 'KHUYEN_MAI_005',
    });

    expect(prisma.khuyen_mai.update)
      .not.toHaveBeenCalled();
  });

  it('đổi từ phần trăm sang số tiền phải xóa giam_toi_da', async () => {
    const updated = {
      ...row,
      loai_giam: 'SO_TIEN',
      gia_tri: 30000,
      giam_toi_da: null,
    };

    const prisma = {
      khuyen_mai: {
        findFirst: jest.fn().mockResolvedValue(row),
        update: jest.fn().mockResolvedValue(updated),
      },
    } as any;

    const nhatKy = {
      ghiNhan: jest.fn().mockResolvedValue(undefined),
    } as any;

    const service = new KhuyenMaiService(
      prisma,
      nhatKy,
    );

    await service.capNhat(
      '1',
      {
        loaiGiam: 'SO_TIEN',
        giaTri: 30000,
      },
      nguoiDung,
    );

    expect(prisma.khuyen_mai.update)
      .toHaveBeenCalledWith({
        where: { id: 1n },
        data: expect.objectContaining({
          loai_giam: 'SO_TIEN',
          gia_tri: 30000,
          giam_toi_da: null,
        }),
      });
  });

  it('không cho hạ quota xuống dưới số lượt đã dùng', async () => {
    const prisma = {
      khuyen_mai: {
        findFirst: jest.fn().mockResolvedValue(row),
        update: jest.fn(),
      },
    } as any;

    const service = new KhuyenMaiService(
      prisma,
      {} as any,
    );

    await expect(
      service.capNhat(
        '1',
        {
          soLuotToiDa: 5,
        },
        nguoiDung,
      ),
    ).rejects.toMatchObject({
      maLoi: 'KHUYEN_MAI_006',
    });

    expect(prisma.khuyen_mai.update)
      .not.toHaveBeenCalled();
  });

  it('soft-delete bằng Prisma và ngừng hoạt động', async () => {
    const prisma = {
      khuyen_mai: {
        findFirst: jest.fn().mockResolvedValue(row),
        update: jest.fn().mockResolvedValue({}),
      },
    } as any;

    const nhatKy = {
      ghiNhan: jest.fn().mockResolvedValue(undefined),
    } as any;

    const service = new KhuyenMaiService(
      prisma,
      nhatKy,
    );

    await expect(
      service.xoa('1', nguoiDung),
    ).resolves.toEqual({ daXoa: true });

    expect(prisma.khuyen_mai.update)
      .toHaveBeenCalledWith({
        where: { id: 1n },
        data: {
          ngay_xoa: expect.any(Date),
          trang_thai: 'NGUNG_HOAT_DONG',
        },
      });
  });
});
