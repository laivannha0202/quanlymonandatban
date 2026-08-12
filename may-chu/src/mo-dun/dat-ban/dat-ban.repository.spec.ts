import { DatBanRepository } from './dat-ban.repository';

describe('DatBanRepository - chống trùng lịch', () => {
  it('trả DAT_BAN_002 khi bàn đã có booking giao nhau', async () => {
    const tx = {
      $queryRaw: jest
        .fn()
        .mockResolvedValueOnce([
          {
            id: 1n,
            ma_ban: 'A01',
            ten_ban: 'Bàn A01',
            khu_vuc_id: 1n,
            suc_chua: 4,
            suc_chua_toi_da: 4,
            trang_thai: 'TRONG',
          },
        ])
        .mockResolvedValueOnce([
          {
            id: 99n,
            ma_dat_ban: 'DBTEST',
            ban_an_id: 1n,
          },
        ]),
      lien_ket_ban: {
        findFirst: jest.fn(),
      },
    } as any;

    const repo =
      new DatBanRepository({} as any);

    await expect(
      repo.khoaVaKiemTraBan(
        tx,
        [1n],
        '2026-08-20 19:00:00',
        '2026-08-20 21:00:00',
        4,
      ),
    ).rejects.toMatchObject({
      maLoi: 'DAT_BAN_002',
    });
  });
});

describe('DatBanRepository - Prisma read', () => {
  it('giữ đúng wall-clock và ghép mã bàn ở danh sách quản trị', async () => {
    const prisma = {
      dat_ban: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            {
              id: 1n,
              ma_dat_ban:
                'DB20260820-000001',
              ho_ten: 'Nguyễn A',
              so_dien_thoai:
                '0912345678',
              email: 'a@example.com',
              ngay_dat:
                new Date(
                  '2026-08-20T00:00:00.000Z',
                ),
              gio_bat_dau:
                new Date(
                  '2026-08-20T19:00:00.000Z',
                ),
              gio_ket_thuc:
                new Date(
                  '2026-08-20T20:30:00.000Z',
                ),
              so_nguoi: 4,
              trang_thai:
                'DA_XAC_NHAN',
              nguon_dat: 'WEBSITE',
              khu_vuc: {
                ten_khu_vuc:
                  'Tầng 1',
              },
              chi_tiet_dat_ban: [
                {
                  ban_an: {
                    ma_ban: 'B02',
                  },
                },
                {
                  ban_an: {
                    ma_ban: 'B01',
                  },
                },
              ],
            },
          ]),
        count: jest
          .fn()
          .mockResolvedValue(1),
      },
    } as any;

    const repo =
      new DatBanRepository(prisma);

    const result =
      await repo.danhSachQuanTri({
        trang: 1,
        kichThuoc: 20,
      } as any);

    expect(result.danhSach[0]).toEqual(
      expect.objectContaining({
        ngay_dat: '2026-08-20',
        gio_bat_dau: '19:00',
        gio_ket_thuc: '20:30',
        ten_khu_vuc: 'Tầng 1',
        danh_sach_ma_ban:
          'B01, B02',
      }),
    );

    expect(result.phanTrang).toEqual({
      trang: 1,
      kichThuoc: 20,
      tong: 1,
      tongTrang: 1,
    });
  });

  it('kiểm tra sở hữu bằng Prisma thay vì raw SQL', async () => {
    const prisma = {
      khach_hang: {
        findUnique: jest
          .fn()
          .mockResolvedValue({
            id: 7n,
          }),
      },
      dat_ban: {
        findFirst: jest
          .fn()
          .mockResolvedValue({
            id: 99n,
          }),
      },
    } as any;

    const repo =
      new DatBanRepository(prisma);

    await expect(
      repo.khachSoHuuDatBan(
        10n,
        99n,
      ),
    ).resolves.toBe(true);

    expect(
      prisma.dat_ban.findFirst,
    ).toHaveBeenCalledWith({
      where: {
        id: 99n,
        khach_hang_id: 7n,
      },
      select: { id: true },
    });
  });
});
