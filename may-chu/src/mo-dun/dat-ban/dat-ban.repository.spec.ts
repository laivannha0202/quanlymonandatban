import { DatBanRepository } from './dat-ban.repository';

describe('DatBanRepository - chống trùng lịch', () => {
  it('trả DAT_BAN_002 khi bàn đã có booking giao nhau', async () => {
    const tx = {
      $queryRawUnsafe: jest
        .fn()
        .mockResolvedValueOnce([
          { id: 1n, ma_ban: 'A01', ten_ban: 'Bàn A01', khu_vuc_id: 1n, suc_chua: 4, suc_chua_toi_da: 4, trang_thai: 'TRONG' },
        ])
        .mockResolvedValueOnce([
          { id: 99n, ma_dat_ban: 'DBTEST', ban_an_id: 1n },
        ]),
      lien_ket_ban: { findFirst: jest.fn() },
    } as any;
    const repo = new DatBanRepository({} as any);

    await expect(
      repo.khoaVaKiemTraBan(tx, [1n], '2026-08-20 19:00:00', '2026-08-20 21:00:00', 4),
    ).rejects.toMatchObject({ maLoi: 'DAT_BAN_002' });
  });
});
