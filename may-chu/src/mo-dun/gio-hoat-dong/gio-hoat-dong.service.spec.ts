import { GioHoatDongService } from './gio-hoat-dong.service';

describe('GioHoatDongService - Prisma wall-clock', () => {
  it('đọc TIME thành HH:mm mà không lệch giờ', async () => {
    const prisma = {
      gio_hoat_dong: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 1n,
            thu_trong_tuan: 1,
            ca_so: 1,
            gio_mo_cua: new Date('1970-01-01T10:00:00.000Z'),
            gio_dong_cua: new Date('1970-01-01T14:30:00.000Z'),
            hoat_dong: true,
            ghi_chu: null,
          },
        ]),
      },
    } as any;

    const service = new GioHoatDongService(prisma);
    await expect(service.danhSach()).resolves.toEqual([
      expect.objectContaining({
        gio_mo_cua: '10:00',
        gio_dong_cua: '14:30',
      }),
    ]);
  });

  it('upsert lịch tuần bằng Prisma và TIME carrier', async () => {
    const tx = {
      gio_hoat_dong: {
        upsert: jest.fn().mockResolvedValue({}),
      },
    } as any;
    const prisma = {
      gio_hoat_dong: {
        findMany: jest
          .fn()
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([]),
      },
      $transaction: jest.fn(
        async (callback: (client: any) => unknown) => callback(tx),
      ),
    } as any;

    const service = new GioHoatDongService(prisma);
    await service.capNhat({
      danhSach: [
        {
          thuTrongTuan: 1,
          caSo: 1,
          gioMoCua: '10:00',
          gioDongCua: '22:00',
          hoatDong: true,
        },
      ],
    } as any);

    expect(tx.gio_hoat_dong.upsert).toHaveBeenCalledWith({
      where: {
        thu_trong_tuan_ca_so: {
          thu_trong_tuan: 1,
          ca_so: 1,
        },
      },
      create: expect.objectContaining({
        thu_trong_tuan: 1,
        ca_so: 1,
        gio_mo_cua: new Date('1970-01-01T10:00:00.000Z'),
        gio_dong_cua: new Date('1970-01-01T22:00:00.000Z'),
      }),
      update: expect.objectContaining({
        gio_mo_cua: new Date('1970-01-01T10:00:00.000Z'),
        gio_dong_cua: new Date('1970-01-01T22:00:00.000Z'),
      }),
    });
  });
});


describe('GioHoatDongService - invariant booking tương lai', () => {
  it('chặn thu hẹp ca nếu làm booking tương lai nằm ngoài giờ phục vụ', async () => {
    const prisma = {
      gio_hoat_dong: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 1n,
            thu_trong_tuan: 1,
            ca_so: 1,
            gio_mo_cua: new Date('1970-01-01T10:00:00.000Z'),
            gio_dong_cua: new Date('1970-01-01T22:00:00.000Z'),
            hoat_dong: true,
            ghi_chu: null,
          },
        ]),
      },
      dat_ban: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 77n,
            ngay_dat: new Date('2026-08-17T00:00:00.000Z'),
            gio_bat_dau: new Date('2026-08-17T20:30:00.000Z'),
            gio_ket_thuc: new Date('2026-08-17T21:30:00.000Z'),
          },
        ]),
      },
      ngay_nghi_dac_biet: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest.fn(),
    } as any;

    const service = new GioHoatDongService(prisma);

    await expect(
      service.capNhat({
        danhSach: [
          {
            thuTrongTuan: 1,
            caSo: 1,
            gioMoCua: '10:00',
            gioDongCua: '21:00',
            hoatDong: true,
          },
        ],
      } as any),
    ).rejects.toMatchObject({ maLoi: 'GIO_HOAT_DONG_005' });

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
