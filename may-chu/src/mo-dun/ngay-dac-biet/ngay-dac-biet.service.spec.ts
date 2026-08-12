import { NgayDacBietService } from './ngay-dac-biet.service';

describe('NgayDacBietService - Prisma wall-clock', () => {
  it('đọc DATE/TIME thành chuỗi nghiệp vụ không lệch', async () => {
    const prisma = {
      ngay_nghi_dac_biet: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 1n,
            ngay: new Date('2026-09-02T00:00:00.000Z'),
            ten_su_kien: 'Quốc khánh',
            dong_cua_ca_ngay: false,
            gio_mo_cua: new Date('1970-01-01T17:00:00.000Z'),
            gio_dong_cua: new Date('1970-01-01T22:00:00.000Z'),
            ghi_chu: null,
          },
        ]),
      },
    } as any;

    const service = new NgayDacBietService(prisma);
    await expect(service.danhSach()).resolves.toEqual([
      expect.objectContaining({
        ngay: '2026-09-02',
        gio_mo_cua: '17:00',
        gio_dong_cua: '22:00',
      }),
    ]);
  });

  it('tạo ngày đóng cửa bằng Prisma với giờ null', async () => {
    const row = {
      id: 2n,
      ngay: new Date('2026-09-03T00:00:00.000Z'),
      ten_su_kien: 'Nghỉ bảo trì',
      dong_cua_ca_ngay: true,
      gio_mo_cua: null,
      gio_dong_cua: null,
      ghi_chu: null,
    };
    const prisma = {
      ngay_nghi_dac_biet: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(row),
      },
    } as any;

    const service = new NgayDacBietService(prisma);
    const result = await service.tao({
      ngay: '2026-09-03',
      tenSuKien: 'Nghỉ bảo trì',
      dongCuaCaNgay: true,
    });

    expect(prisma.ngay_nghi_dac_biet.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ngay: new Date('2026-09-03T00:00:00.000Z'),
        dong_cua_ca_ngay: true,
        gio_mo_cua: null,
        gio_dong_cua: null,
      }),
    });
    expect(result.ngay).toBe('2026-09-03');
  });
});


describe('NgayDacBietService - invariant booking tương lai', () => {
  it('chặn tạo ngày đóng cửa nếu đã có booking tương lai', async () => {
    const prisma = {
      ngay_nghi_dac_biet: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      },
      dat_ban: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 88n,
            gio_bat_dau: new Date('2026-09-03T18:00:00.000Z'),
            gio_ket_thuc: new Date('2026-09-03T19:30:00.000Z'),
          },
        ]),
      },
      gio_hoat_dong: {
        findMany: jest.fn(),
      },
    } as any;

    const service = new NgayDacBietService(prisma);

    await expect(
      service.tao({
        ngay: '2026-09-03',
        tenSuKien: 'Nghỉ đột xuất',
        dongCuaCaNgay: true,
      }),
    ).rejects.toMatchObject({ maLoi: 'NGAY_DAC_BIET_008' });

    expect(prisma.ngay_nghi_dac_biet.create).not.toHaveBeenCalled();
  });

  it('cho xóa ngày đặc biệt nếu lịch tuần vẫn bao phủ booking', async () => {
    const prisma = {
      ngay_nghi_dac_biet: {
        findUnique: jest.fn().mockResolvedValue({
          id: 2n,
          ngay: new Date('2026-08-17T00:00:00.000Z'),
          ten_su_kien: 'Mở muộn',
          dong_cua_ca_ngay: false,
          gio_mo_cua: new Date('1970-01-01T12:00:00.000Z'),
          gio_dong_cua: new Date('1970-01-01T20:00:00.000Z'),
          ghi_chu: null,
        }),
        delete: jest.fn().mockResolvedValue({ id: 2n }),
      },
      dat_ban: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 89n,
            gio_bat_dau: new Date('2026-08-17T13:00:00.000Z'),
            gio_ket_thuc: new Date('2026-08-17T14:30:00.000Z'),
          },
        ]),
      },
      gio_hoat_dong: {
        findMany: jest.fn().mockResolvedValue([
          {
            gio_mo_cua: new Date('1970-01-01T10:00:00.000Z'),
            gio_dong_cua: new Date('1970-01-01T22:00:00.000Z'),
          },
        ]),
      },
    } as any;

    const service = new NgayDacBietService(prisma);
    await expect(service.xoa('2')).resolves.toEqual({ daXoa: true });
    expect(prisma.ngay_nghi_dac_biet.delete).toHaveBeenCalledWith({
      where: { id: 2n },
    });
  });
});
