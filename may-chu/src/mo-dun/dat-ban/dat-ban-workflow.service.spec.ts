import { DatBanWorkflowService } from './dat-ban-workflow.service';

function wallClockVietNam(instantMs: number): string {
  return new Date(instantMs + 7 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ');
}

describe('DatBanWorkflowService - concurrency guard', () => {
  it('chặn check-in nếu mapping bàn đổi trong lúc chờ khóa booking', async () => {
    const now = Date.now();
    const datBanCoBan = {
      id: 99n,
      ma_dat_ban: 'DBTEST',
      khach_hang_id: 7n,
      khu_vuc_id: 1n,
      ho_ten: 'Khách test',
      so_dien_thoai: '0912345678',
      email: null,
      ngay_dat: wallClockVietNam(now).slice(0, 10),
      gio_bat_dau: wallClockVietNam(now - 5 * 60_000),
      gio_ket_thuc: wallClockVietNam(now + 60 * 60_000),
      so_nguoi: 2,
      trang_thai: 'DA_XAC_NHAN',
      nguon_dat: 'WEBSITE',
      kieu_xep_ban: 'KHACH_CHON_BAN',
      ghi_chu_khach: null,
      ghi_chu_noi_bo: null,
    };

    const tx = {
      $queryRaw: jest.fn().mockResolvedValue([
        { id: 1n, trang_thai: 'TRONG' },
      ]),
      chi_tiet_dat_ban: {
        findMany: jest.fn().mockResolvedValue([
          { ban_an_id: 2n },
        ]),
      },
    } as any;

    const prisma = {
      chi_tiet_dat_ban: {
        findMany: jest.fn().mockResolvedValue([
          { ban_an_id: 1n },
        ]),
      },
      $transaction: jest.fn(
        async (callback: (client: any) => unknown) => callback(tx),
      ),
    } as any;

    const repository = {
      layChiTietTheoId: jest.fn().mockResolvedValue(datBanCoBan),
      layChiTietDayDu: jest.fn().mockResolvedValue(datBanCoBan),
      khoaDatBan: jest.fn().mockResolvedValue(datBanCoBan),
    } as any;

    const cauHinh = {
      laySo: jest.fn().mockResolvedValue(30),
    } as any;

    const service = new DatBanWorkflowService(
      prisma,
      repository,
      cauHinh,
      { taoChoDatBan: jest.fn() } as any,
      { ghiNhan: jest.fn() } as any,
    );

    await expect(
      service.checkIn(
        '99',
        { taiKhoanId: '10' } as any,
      ),
    ).rejects.toMatchObject({
      maLoi: 'DAT_BAN_020',
    });

    expect(tx.chi_tiet_dat_ban.findMany).toHaveBeenCalledWith({
      where: { dat_ban_id: 99n },
      orderBy: { ban_an_id: 'asc' },
      select: { ban_an_id: true },
    });
  });
});
