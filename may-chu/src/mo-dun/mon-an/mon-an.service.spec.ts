import { MonAnService } from './mon-an.service';

describe('MonAnService - Prisma CRUD', () => {
  const nguoiDung = {
    taiKhoanId: '10',
  } as any;

  const monCoBan = {
    id: 1n,
    ma_mon: 'HV_MON_BUN_BO',
    danh_muc_id: 2n,
    ten_mon: 'Bún bò',
    duong_dan: 'bun-bo',
    mo_ta: 'Món chính',
    gia: { toString: () => '65000.00' },
    gia_khuyen_mai: { toString: () => '59000.00' },
    hinh_anh_chinh: '/uploads/bun-bo.webp',
    la_mon_noi_bat: true,
    con_mon: true,
    trang_thai: 'HOAT_DONG',
    ngay_tao: new Date('2026-08-12T00:00:00.000Z'),
    ngay_cap_nhat: new Date('2026-08-12T00:00:00.000Z'),
    danh_muc_mon: {
      ten_danh_muc: 'Món chính',
      duong_dan: 'mon-chinh',
    },
  };

  it('danh sách public dùng Prisma, flatten danh mục và trả giá dạng number', async () => {
    const prisma = {
      mon_an: {
        findMany: jest.fn().mockResolvedValue([monCoBan]),
        count: jest.fn().mockResolvedValue(1),
      },
    } as any;

    const service = new MonAnService(prisma, {} as any);

    const result = await service.danhSachCongKhai({
      trang: 1,
      kichThuoc: 20,
    } as any);

    expect(result.danhSach).toEqual([
      expect.objectContaining({
        ma_mon: 'HV_MON_BUN_BO',
        ten_danh_muc: 'Món chính',
        duong_dan_danh_muc: 'mon-chinh',
        gia: 65000,
        gia_khuyen_mai: 59000,
      }),
    ]);

    expect(prisma.mon_an.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          ngay_xoa: null,
          trang_thai: 'HOAT_DONG',
          danh_muc_mon: {
            ngay_xoa: null,
            trang_thai: 'HOAT_DONG',
          },
        }),
      }),
    );
  });

  it('không cho đổi mã món sau khi tạo', async () => {
    const prisma = {
      mon_an: {
        findFirst: jest.fn().mockResolvedValue({
          ...monCoBan,
          hinh_anh_mon: [],
        }),
        update: jest.fn(),
      },
    } as any;

    const service = new MonAnService(prisma, {} as any);

    await expect(
      service.capNhat(
        '1',
        {
          maMon: 'HV_MON_KHAC',
        } as any,
        nguoiDung,
      ),
    ).rejects.toMatchObject({
      maLoi: 'MON_AN_005',
    });

    expect(prisma.mon_an.update).not.toHaveBeenCalled();
  });

  it('không cho đổi đường dẫn món sau khi tạo', async () => {
    const prisma = {
      mon_an: {
        findFirst: jest.fn().mockResolvedValue({
          ...monCoBan,
          hinh_anh_mon: [],
        }),
        update: jest.fn(),
      },
    } as any;

    const service = new MonAnService(prisma, {} as any);

    await expect(
      service.capNhat(
        '1',
        {
          duongDan: 'bun-bo-moi',
        } as any,
        nguoiDung,
      ),
    ).rejects.toMatchObject({
      maLoi: 'MON_AN_006',
    });

    expect(prisma.mon_an.update).not.toHaveBeenCalled();
  });

  it('chặn giá khuyến mãi lớn hơn giá gốc khi cập nhật', async () => {
    const prisma = {
      mon_an: {
        findFirst: jest.fn().mockResolvedValue({
          ...monCoBan,
          hinh_anh_mon: [],
        }),
        update: jest.fn(),
      },
    } as any;

    const service = new MonAnService(prisma, {} as any);

    await expect(
      service.capNhat(
        '1',
        {
          gia: 50000,
          giaKhuyenMai: 60000,
        } as any,
        nguoiDung,
      ),
    ).rejects.toMatchObject({
      maLoi: 'MON_AN_004',
    });

    expect(prisma.mon_an.update).not.toHaveBeenCalled();
  });

  it('thêm ảnh chính bằng transaction và đồng bộ hinh_anh_chinh', async () => {
    const tx = {
      hinh_anh_mon: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn().mockResolvedValue({
          id: 9n,
          mon_an_id: 1n,
          duong_dan_anh: '/uploads/new.webp',
          alt_text: 'Ảnh mới',
          thu_tu: 0,
          la_anh_chinh: true,
        }),
      },
      mon_an: {
        update: jest.fn().mockResolvedValue({ id: 1n }),
      },
    } as any;

    const prisma = {
      mon_an: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce({
            ...monCoBan,
            hinh_anh_mon: [],
          })
          .mockResolvedValueOnce({
            ...monCoBan,
            hinh_anh_chinh: '/uploads/new.webp',
            hinh_anh_mon: [],
          }),
      },
      $transaction: jest.fn(
        async (callback: (client: any) => unknown) =>
          callback(tx),
      ),
    } as any;

    const nhatKy = {
      ghiNhan: jest.fn().mockResolvedValue(undefined),
    } as any;

    const service = new MonAnService(prisma, nhatKy);

    await service.themHinhAnh(
      '1',
      {
        duongDanAnh: '/uploads/new.webp',
        altText: 'Ảnh mới',
        laAnhChinh: true,
      },
      nguoiDung,
    );

    expect(tx.hinh_anh_mon.updateMany).toHaveBeenCalledWith({
      where: {
        mon_an_id: 1n,
      },
      data: {
        la_anh_chinh: false,
      },
    });

    expect(tx.mon_an.update).toHaveBeenCalledWith({
      where: {
        id: 1n,
      },
      data: {
        hinh_anh_chinh: '/uploads/new.webp',
      },
    });
  });

  it('xóa ảnh chính thì tự chọn ảnh còn lại làm ảnh chính', async () => {
    const tx = {
      hinh_anh_mon: {
        delete: jest.fn().mockResolvedValue({ id: 9n }),
        findFirst: jest.fn().mockResolvedValue({
          id: 10n,
          mon_an_id: 1n,
          duong_dan_anh: '/uploads/replacement.webp',
          alt_text: null,
          thu_tu: 1,
          la_anh_chinh: false,
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn().mockResolvedValue({ id: 10n }),
      },
      mon_an: {
        update: jest.fn().mockResolvedValue({ id: 1n }),
      },
    } as any;

    const prisma = {
      mon_an: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce({
            ...monCoBan,
            hinh_anh_mon: [],
          })
          .mockResolvedValueOnce({
            ...monCoBan,
            hinh_anh_chinh: '/uploads/replacement.webp',
            hinh_anh_mon: [],
          }),
      },
      hinh_anh_mon: {
        findFirst: jest.fn().mockResolvedValue({
          id: 9n,
          mon_an_id: 1n,
          duong_dan_anh: '/uploads/main.webp',
          alt_text: null,
          thu_tu: 0,
          la_anh_chinh: true,
        }),
      },
      $transaction: jest.fn(
        async (callback: (client: any) => unknown) =>
          callback(tx),
      ),
    } as any;

    const nhatKy = {
      ghiNhan: jest.fn().mockResolvedValue(undefined),
    } as any;

    const service = new MonAnService(prisma, nhatKy);

    await service.xoaHinhAnh(
      '1',
      '9',
      nguoiDung,
    );

    expect(tx.hinh_anh_mon.update).toHaveBeenCalledWith({
      where: {
        id: 10n,
      },
      data: {
        la_anh_chinh: true,
      },
    });

    expect(tx.mon_an.update).toHaveBeenCalledWith({
      where: {
        id: 1n,
      },
      data: {
        hinh_anh_chinh: '/uploads/replacement.webp',
      },
    });
  });
});
