import { DanhGiaService } from './danh-gia.service';

describe('DanhGiaService - Prisma lifecycle', () => {
  const khachUser = {
    taiKhoanId: '10',
  } as any;

  const adminUser = {
    taiKhoanId: '20',
  } as any;

  const baseRow = {
    id: 1n,
    khach_hang_id: 5n,
    dat_ban_id: 9n,
    so_sao: 5,
    noi_dung: 'Rất ổn',
    phan_hoi: null,
    nguoi_phan_hoi_id: null,
    thoi_gian_phan_hoi: null,
    hien_thi: true,
    ngay_tao: new Date(
      '2026-08-12T00:00:00.000Z',
    ),
    ngay_cap_nhat: new Date(
      '2026-08-12T00:00:00.000Z',
    ),
    ngay_xoa: null,
    khach_hang: {
      ho_ten: 'Khách A',
    },
    nhan_vien: null,
  };

  it('public list dùng Prisma và chỉ lấy đánh giá đang hiển thị', async () => {
    const prisma = {
      danh_gia: {
        findMany: jest.fn().mockResolvedValue([
          baseRow,
        ]),
        count: jest.fn().mockResolvedValue(1),
      },
    } as any;

    const service = new DanhGiaService(
      prisma,
      {} as any,
    );

    const result =
      await service.danhSachCongKhai({
        trang: 1,
        kichThuoc: 20,
      } as any);

    expect(result.danhSach[0]).toEqual(
      expect.objectContaining({
        ho_ten: 'Khách A',
        nguoi_phan_hoi: null,
      }),
    );

    expect(prisma.danh_gia.findMany)
      .toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            ngay_xoa: null,
            hien_thi: true,
          },
        }),
      );
  });

  it('danh sách của tôi chỉ lấy review thuộc tài khoản hiện tại', async () => {
    const prisma = {
      danh_gia: {
        findMany: jest.fn().mockResolvedValue([
          baseRow,
        ]),
        count: jest.fn().mockResolvedValue(1),
      },
    } as any;

    const service = new DanhGiaService(
      prisma,
      {} as any,
    );

    const result =
      await service.danhSachCuaKhach(
        {
          trang: 1,
          kichThuoc: 30,
        } as any,
        khachUser,
      );

    expect(result.danhSach).toHaveLength(1);

    expect(prisma.danh_gia.findMany)
      .toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            ngay_xoa: null,
            khach_hang: {
              tai_khoan_id: 10n,
              ngay_xoa: null,
            },
          },
        }),
      );
  });

  it('chỉ cho tạo đánh giá khi booking thuộc khách và đã hoàn thành', async () => {
    const prisma = {
      khach_hang: {
        findFirst: jest.fn().mockResolvedValue({
          id: 5n,
        }),
      },
      dat_ban: {
        findFirst: jest.fn().mockResolvedValue({
          id: 9n,
          trang_thai: 'DA_XAC_NHAN',
        }),
      },
    } as any;

    const service = new DanhGiaService(
      prisma,
      {} as any,
    );

    await expect(
      service.taoCuaKhach(
        {
          datBanId: '9',
          soSao: 5,
        },
        khachUser,
      ),
    ).rejects.toMatchObject({
      maLoi: 'DANH_GIA_003',
    });
  });

  it('chặn đánh giá trùng còn hiệu lực', async () => {
    const prisma = {
      khach_hang: {
        findFirst: jest.fn().mockResolvedValue({
          id: 5n,
        }),
      },
      dat_ban: {
        findFirst: jest.fn().mockResolvedValue({
          id: 9n,
          trang_thai: 'DA_HOAN_THANH',
        }),
      },
      danh_gia: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1n,
          ngay_xoa: null,
        }),
      },
    } as any;

    const service = new DanhGiaService(
      prisma,
      {} as any,
    );

    await expect(
      service.taoCuaKhach(
        {
          datBanId: '9',
          soSao: 5,
        },
        khachUser,
      ),
    ).rejects.toMatchObject({
      maLoi: 'DANH_GIA_004',
    });
  });

  it('khôi phục review đã soft-delete thay vì đụng unique dat_ban_id', async () => {
    const restored = {
      ...baseRow,
      noi_dung: 'Đánh giá lại',
    };

    const prisma = {
      khach_hang: {
        findFirst: jest.fn().mockResolvedValue({
          id: 5n,
        }),
      },
      dat_ban: {
        findFirst: jest.fn().mockResolvedValue({
          id: 9n,
          trang_thai: 'DA_HOAN_THANH',
        }),
      },
      danh_gia: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1n,
          ngay_xoa: new Date(),
        }),
        update: jest.fn().mockResolvedValue({
          id: 1n,
        }),
        findFirst: jest.fn().mockResolvedValue(
          restored,
        ),
        create: jest.fn(),
      },
    } as any;

    const service = new DanhGiaService(
      prisma,
      {} as any,
    );

    await service.taoCuaKhach(
      {
        datBanId: '9',
        soSao: 4,
        noiDung: '  Đánh giá lại  ',
      },
      khachUser,
    );

    expect(prisma.danh_gia.create)
      .not.toHaveBeenCalled();

    expect(prisma.danh_gia.update)
      .toHaveBeenCalledWith({
        where: {
          id: 1n,
        },
        data: {
          khach_hang_id: 5n,
          so_sao: 4,
          noi_dung: 'Đánh giá lại',
          phan_hoi: null,
          nguoi_phan_hoi_id: null,
          thoi_gian_phan_hoi: null,
          hien_thi: true,
          ngay_xoa: null,
        },
        select: {
          id: true,
        },
      });
  });

  it('map P2002 về lỗi đánh giá trùng trong race tạo review', async () => {
    const prisma = {
      khach_hang: {
        findFirst: jest.fn().mockResolvedValue({
          id: 5n,
        }),
      },
      dat_ban: {
        findFirst: jest.fn().mockResolvedValue({
          id: 9n,
          trang_thai: 'DA_HOAN_THANH',
        }),
      },
      danh_gia: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockRejectedValue({
          code: 'P2002',
        }),
      },
    } as any;

    const service = new DanhGiaService(
      prisma,
      {} as any,
    );

    await expect(
      service.taoCuaKhach(
        {
          datBanId: '9',
          soSao: 5,
        },
        khachUser,
      ),
    ).rejects.toMatchObject({
      maLoi: 'DANH_GIA_004',
    });
  });

  it('customer update chỉ sửa review thuộc đúng tài khoản', async () => {
    const prisma = {
      danh_gia: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce({
            id: 1n,
          })
          .mockResolvedValueOnce({
            ...baseRow,
            so_sao: 4,
            noi_dung: null,
          }),
        update: jest.fn().mockResolvedValue({}),
      },
    } as any;

    const service = new DanhGiaService(
      prisma,
      {} as any,
    );

    await service.capNhatCuaKhach(
      '1',
      {
        soSao: 4,
        noiDung: '   ',
      },
      khachUser,
    );

    expect(prisma.danh_gia.findFirst)
      .toHaveBeenNthCalledWith(
        1,
        {
          where: {
            id: 1n,
            ngay_xoa: null,
            khach_hang: {
              tai_khoan_id: 10n,
              ngay_xoa: null,
            },
          },
          select: {
            id: true,
          },
        },
      );

    expect(prisma.danh_gia.update)
      .toHaveBeenCalledWith({
        where: {
          id: 1n,
        },
        data: {
          so_sao: 4,
          noi_dung: null,
        },
      });
  });

  it('customer delete là soft-delete và ẩn review', async () => {
    const prisma = {
      danh_gia: {
        findFirst: jest.fn().mockResolvedValue({
          id: 1n,
        }),
        update: jest.fn().mockResolvedValue({}),
      },
    } as any;

    const service = new DanhGiaService(
      prisma,
      {} as any,
    );

    await expect(
      service.xoaCuaKhach(
        '1',
        khachUser,
      ),
    ).resolves.toEqual({
      daXoa: true,
    });

    expect(prisma.danh_gia.update)
      .toHaveBeenCalledWith({
        where: {
          id: 1n,
        },
        data: {
          ngay_xoa: expect.any(Date),
          hien_thi: false,
        },
      });
  });

  it('admin reply cần hồ sơ nhân viên hoạt động và ghi audit', async () => {
    const replied = {
      ...baseRow,
      phan_hoi: 'Cảm ơn bạn',
      nguoi_phan_hoi_id: 7n,
      thoi_gian_phan_hoi: new Date(),
      nhan_vien: {
        ho_ten: 'Nhân viên B',
      },
    };

    const prisma = {
      danh_gia: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce(baseRow)
          .mockResolvedValueOnce(replied),
        update: jest.fn().mockResolvedValue({}),
      },
      nhan_vien: {
        findFirst: jest.fn().mockResolvedValue({
          id: 7n,
        }),
      },
    } as any;

    const nhatKy = {
      ghiNhan: jest.fn().mockResolvedValue(
        undefined,
      ),
    } as any;

    const service = new DanhGiaService(
      prisma,
      nhatKy,
    );

    const result = await service.phanHoi(
      '1',
      {
        phanHoi: '  Cảm ơn bạn  ',
      },
      adminUser,
      'req-test',
    );

    expect(result).toEqual(
      expect.objectContaining({
        phan_hoi: 'Cảm ơn bạn',
        nguoi_phan_hoi: 'Nhân viên B',
      }),
    );

    expect(prisma.danh_gia.update)
      .toHaveBeenCalledWith({
        where: {
          id: 1n,
        },
        data: {
          phan_hoi: 'Cảm ơn bạn',
          nguoi_phan_hoi_id: 7n,
          thoi_gian_phan_hoi:
            expect.any(Date),
        },
      });

    expect(nhatKy.ghiNhan)
      .toHaveBeenCalledTimes(1);
  });

  it('admin visibility update dùng Prisma và ghi audit', async () => {
    const hidden = {
      ...baseRow,
      hien_thi: false,
    };

    const prisma = {
      danh_gia: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce(baseRow)
          .mockResolvedValueOnce(hidden),
        update: jest.fn().mockResolvedValue({}),
      },
    } as any;

    const nhatKy = {
      ghiNhan: jest.fn().mockResolvedValue(
        undefined,
      ),
    } as any;

    const service = new DanhGiaService(
      prisma,
      nhatKy,
    );

    await service.capNhatHienThi(
      '1',
      {
        hienThi: false,
      },
      adminUser,
    );

    expect(prisma.danh_gia.update)
      .toHaveBeenCalledWith({
        where: {
          id: 1n,
        },
        data: {
          hien_thi: false,
        },
      });

    expect(nhatKy.ghiNhan)
      .toHaveBeenCalledTimes(1);
  });
});
