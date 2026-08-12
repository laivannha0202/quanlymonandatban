import { DanhMucMonService } from './danh-muc-mon.service';

describe('DanhMucMonService - Prisma CRUD', () => {
  const nguoiDung = { taiKhoanId: '10' } as any;

  it('danh sách công khai chỉ đếm món đang hoạt động', async () => {
    const prisma = {
      danh_muc_mon: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 1n,
            ma_danh_muc: 'DM01',
            ten_danh_muc: 'Món chính',
            duong_dan: 'mon-chinh',
            _count: { mon_an: 3 },
          },
        ]),
      },
    } as any;

    const service = new DanhMucMonService(prisma, {} as any);
    const result = await service.danhSachCongKhai();

    expect(result).toEqual([
      expect.objectContaining({
        ma_danh_muc: 'DM01',
        so_mon: 3,
      }),
    ]);
    expect(result[0]).not.toHaveProperty('_count');
  });

  it('không cho đổi mã danh mục sau khi tạo', async () => {
    const cu = {
      id: 1n,
      ma_danh_muc: 'DM01',
      ten_danh_muc: 'Món chính',
      duong_dan: 'mon-chinh',
      mo_ta: null,
      thu_tu: 0,
      trang_thai: 'HOAT_DONG',
      ngay_xoa: null,
    };
    const prisma = {
      danh_muc_mon: {
        findFirst: jest.fn().mockResolvedValue(cu),
        update: jest.fn(),
      },
    } as any;

    const service = new DanhMucMonService(prisma, {} as any);

    await expect(
      service.capNhat('1', { maDanhMuc: 'DM02' } as any, nguoiDung),
    ).rejects.toMatchObject({ maLoi: 'DANH_MUC_MON_004' });

    expect(prisma.danh_muc_mon.update).not.toHaveBeenCalled();
  });

  it('chặn xóa nếu danh mục còn món chưa xóa', async () => {
    const cu = {
      id: 1n,
      ma_danh_muc: 'DM01',
      ten_danh_muc: 'Món chính',
      duong_dan: 'mon-chinh',
      ngay_xoa: null,
    };
    const prisma = {
      danh_muc_mon: {
        findFirst: jest.fn().mockResolvedValue(cu),
        update: jest.fn(),
      },
      mon_an: {
        count: jest.fn().mockResolvedValue(2),
      },
    } as any;

    const service = new DanhMucMonService(prisma, {} as any);

    await expect(service.xoa('1', nguoiDung)).rejects.toMatchObject({
      maLoi: 'DANH_MUC_MON_003',
    });
    expect(prisma.danh_muc_mon.update).not.toHaveBeenCalled();
  });

  it('soft-delete danh mục rỗng và ghi nhật ký', async () => {
    const cu = {
      id: 1n,
      ma_danh_muc: 'DM01',
      ten_danh_muc: 'Món chính',
      duong_dan: 'mon-chinh',
      ngay_xoa: null,
    };
    const prisma = {
      danh_muc_mon: {
        findFirst: jest.fn().mockResolvedValue(cu),
        update: jest.fn().mockResolvedValue({
          ...cu,
          ngay_xoa: new Date(),
          trang_thai: 'NGUNG_HOAT_DONG',
        }),
      },
      mon_an: {
        count: jest.fn().mockResolvedValue(0),
      },
    } as any;
    const nhatKy = {
      ghiNhan: jest.fn().mockResolvedValue(undefined),
    } as any;

    const service = new DanhMucMonService(prisma, nhatKy);
    await expect(service.xoa('1', nguoiDung)).resolves.toEqual({
      daXoa: true,
    });

    expect(prisma.danh_muc_mon.update).toHaveBeenCalledWith({
      where: { id: 1n },
      data: {
        ngay_xoa: expect.any(Date),
        trang_thai: 'NGUNG_HOAT_DONG',
      },
    });
    expect(nhatKy.ghiNhan).toHaveBeenCalledTimes(1);
  });
});
