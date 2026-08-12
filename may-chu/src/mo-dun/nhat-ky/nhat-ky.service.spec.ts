import { NhatKyService } from './nhat-ky.service';

describe('NhatKyService - Prisma audit log', () => {
  it('list dùng Prisma filters, pagination và email tài khoản', async () => {
    const prisma = {
      nhat_ky_hoat_dong: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 1n,
            tai_khoan_id: 10n,
            hanh_dong: 'CAP_NHAT',
            doi_tuong: 'DAT_BAN',
            doi_tuong_id: '5',
            du_lieu_cu: null,
            du_lieu_moi: null,
            dia_chi_ip: null,
            user_agent: null,
            ma_yeu_cau: 'REQ-1',
            thoi_gian: new Date(),
            tai_khoan: {
              email: 'admin@example.com',
            },
          },
        ]),
        count: jest.fn().mockResolvedValue(1),
      },
    } as any;

    const service = new NhatKyService(
      prisma,
    );

    const result =
      await service.danhSach({
        trang: 1,
        kichThuoc: 20,
        hanhDong: 'CAP_NHAT',
        doiTuong: 'DAT_BAN',
        taiKhoanId: '10',
        maYeuCau: 'REQ-1',
      } as any);

    expect(
      prisma.nhat_ky_hoat_dong.findMany,
    ).toHaveBeenCalledWith({
      where: {
        hanh_dong: 'CAP_NHAT',
        doi_tuong: 'DAT_BAN',
        tai_khoan_id: 10n,
        ma_yeu_cau: 'REQ-1',
      },
      orderBy: {
        thoi_gian: 'desc',
      },
      skip: 0,
      take: 20,
      include: {
        tai_khoan: {
          select: {
            email: true,
          },
        },
      },
    });

    expect(result).toEqual(
      expect.objectContaining({
        danhSach: [
          expect.objectContaining({
            email_tai_khoan:
              'admin@example.com',
          }),
        ],
        phanTrang: {
          trang: 1,
          kichThuoc: 20,
          tong: 1,
          tongTrang: 1,
        },
      }),
    );
  });

  it('ghi audit serialize BigInt mà không cần any', async () => {
    const prisma = {
      nhat_ky_hoat_dong: {
        create: jest.fn().mockResolvedValue({
          id: 1n,
        }),
      },
    } as any;

    const service = new NhatKyService(
      prisma,
    );

    await service.ghiNhan({
      taiKhoanId: '10',
      hanhDong: 'TEST',
      doiTuong: 'TEST',
      doiTuongId: '7',
      duLieuMoi: {
        id: 7n,
      },
    });

    expect(
      prisma.nhat_ky_hoat_dong.create,
    ).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tai_khoan_id: 10n,
        du_lieu_moi: {
          id: '7',
        },
      }),
    });
  });
});
