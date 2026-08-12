import { KhuVucService } from './khu-vuc.service';

describe('KhuVucService - invariant quản trị', () => {
  function taoKhuVuc() {
    return {
      id: 1n,
      ma_khu_vuc: 'KV_TANG_1',
      ten_khu_vuc: 'Tầng 1',
      mo_ta: null,
      hinh_anh: null,
      thu_tu: 0,
      trang_thai: 'HOAT_DONG',
      ngay_xoa: null,
    };
  }

  it('không cho đổi mã khu vực sau khi tạo', async () => {
    const prisma = {
      khu_vuc: {
        findFirst: jest.fn().mockResolvedValue(taoKhuVuc()),
        update: jest.fn(),
      },
    } as any;

    const service = new KhuVucService(prisma);

    await expect(
      service.capNhat('1', {
        maKhuVuc: 'KV_MOI',
      } as any),
    ).rejects.toMatchObject({
      maLoi: 'KHU_VUC_004',
    });

    expect(prisma.khu_vuc.update).not.toHaveBeenCalled();
  });

  it('chặn ngừng hoạt động khi khu vực còn booking hiệu lực', async () => {
    const prisma = {
      khu_vuc: {
        findFirst: jest.fn().mockResolvedValue(taoKhuVuc()),
        update: jest.fn(),
      },
      dat_ban: {
        count: jest.fn().mockResolvedValue(1),
      },
    } as any;

    const service = new KhuVucService(prisma);

    await expect(
      service.capNhat('1', {
        trangThai: 'NGUNG_HOAT_DONG',
      } as any),
    ).rejects.toMatchObject({
      maLoi: 'KHU_VUC_005',
    });

    expect(prisma.khu_vuc.update).not.toHaveBeenCalled();
  });

  it('cho phép ngừng hoạt động khi không còn booking hiệu lực', async () => {
    const khuVuc = taoKhuVuc();
    const prisma = {
      khu_vuc: {
        findFirst: jest.fn().mockResolvedValue(khuVuc),
        update: jest.fn().mockResolvedValue({
          ...khuVuc,
          trang_thai: 'NGUNG_HOAT_DONG',
        }),
      },
      dat_ban: {
        count: jest.fn().mockResolvedValue(0),
      },
    } as any;

    const service = new KhuVucService(prisma);

    await expect(
      service.capNhat('1', {
        trangThai: 'NGUNG_HOAT_DONG',
      } as any),
    ).resolves.toEqual(
      expect.objectContaining({
        trang_thai: 'NGUNG_HOAT_DONG',
      }),
    );
  });

  it('chặn xóa khu vực nếu còn booking hiệu lực trước khi kiểm tra bàn', async () => {
    const prisma = {
      khu_vuc: {
        findFirst: jest.fn().mockResolvedValue(taoKhuVuc()),
        update: jest.fn(),
      },
      dat_ban: {
        count: jest.fn().mockResolvedValue(1),
      },
      ban_an: {
        count: jest.fn(),
      },
    } as any;

    const service = new KhuVucService(prisma);

    await expect(service.xoa('1')).rejects.toMatchObject({
      maLoi: 'KHU_VUC_005',
    });

    expect(prisma.ban_an.count).not.toHaveBeenCalled();
    expect(prisma.khu_vuc.update).not.toHaveBeenCalled();
  });
});
