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
      {
        danhDauKhuyenMaiDaDungTrongTransaction: jest.fn().mockResolvedValue(1),
        giaiPhongKhuyenMaiTrongTransaction: jest.fn().mockResolvedValue(1),
        hoanTienDatBanTrongTransaction: jest.fn(),
      } as any,
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


describe('DatBanWorkflowService - trạng thái bàn', () => {
  function taoDatBan(trangThai = 'DA_CHECK_IN') {
    return {
      id: 99n,
      ma_dat_ban: 'DBTEST',
      khach_hang_id: 7n,
      khu_vuc_id: 1n,
      ho_ten: 'Khách test',
      so_dien_thoai: '0912345678',
      email: null,
      ngay_dat: '2026-08-20',
      gio_bat_dau: '2026-08-20 19:00:00',
      gio_ket_thuc: '2026-08-20 20:30:00',
      so_nguoi: 2,
      trang_thai: trangThai,
      nguon_dat: 'WEBSITE',
      kieu_xep_ban: 'KHACH_CHON_BAN',
      ghi_chu_khach: null,
      ghi_chu_noi_bo: null,
    };
  }

  function taoBoPhuThuoc(trangThaiBan: string) {
    const cu = taoDatBan('DA_CHECK_IN');
    const moi = taoDatBan('DA_HOAN_THANH');

    const tx = {
      $queryRaw: jest.fn().mockResolvedValue([
        {
          id: 1n,
          trang_thai: trangThaiBan,
        },
      ]),
      chi_tiet_dat_ban: {
        findMany: jest.fn().mockResolvedValue([
          { ban_an_id: 1n },
        ]),
      },
      ban_an: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      dat_ban: {
        update: jest.fn().mockResolvedValue({ id: 99n }),
      },
      lich_su_dat_ban: {
        create: jest.fn().mockResolvedValue({ id: 1n }),
      },
      nhan_vien: {
        findUnique: jest.fn(),
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
      layChiTietDayDu: jest
        .fn()
        .mockResolvedValueOnce(cu)
        .mockResolvedValueOnce(moi),
      khoaDatBan: jest.fn().mockResolvedValue(cu),
    } as any;

    const nhatKy = {
      ghiNhan: jest.fn().mockResolvedValue(undefined),
    } as any;

    const service = new DatBanWorkflowService(
      prisma,
      repository,
      { laySo: jest.fn() } as any,
      { taoChoDatBan: jest.fn() } as any,
      { hoanTienDatBanTrongTransaction: jest.fn() } as any,
      nhatKy,
    );

    return {
      service,
      tx,
      nhatKy,
    };
  }

  it('không hoàn thành nếu bàn không còn DANG_SU_DUNG', async () => {
    const { service, tx, nhatKy } = taoBoPhuThuoc('BAO_TRI');

    await expect(
      service.hoanThanh(
        '99',
        { taiKhoanId: '10' } as any,
      ),
    ).rejects.toMatchObject({
      maLoi: 'DAT_BAN_017',
    });

    expect(tx.ban_an.updateMany).not.toHaveBeenCalled();
    expect(tx.dat_ban.update).not.toHaveBeenCalled();
    expect(tx.lich_su_dat_ban.create).not.toHaveBeenCalled();
    expect(nhatKy.ghiNhan).not.toHaveBeenCalled();
  });

  it('hoàn thành chỉ giải phóng bàn đang DANG_SU_DUNG', async () => {
    const { service, tx, nhatKy } = taoBoPhuThuoc('DANG_SU_DUNG');

    await service.hoanThanh(
      '99',
      { taiKhoanId: '10' } as any,
    );

    expect(tx.ban_an.updateMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: [1n],
        },
      },
      data: {
        trang_thai: 'TRONG',
      },
    });

    expect(tx.dat_ban.update).toHaveBeenCalledWith({
      where: { id: 99n },
      data: expect.objectContaining({
        trang_thai: 'DA_HOAN_THANH',
        thoi_gian_hoan_thanh: expect.any(Date),
      }),
    });

    expect(tx.lich_su_dat_ban.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        dat_ban_id: 99n,
        trang_thai_cu: 'DA_CHECK_IN',
        trang_thai_moi: 'DA_HOAN_THANH',
        hanh_dong: 'HOAN_THANH',
      }),
    });

    expect(nhatKy.ghiNhan).toHaveBeenCalledTimes(1);
  });
});
