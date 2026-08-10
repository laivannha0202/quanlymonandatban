import { TimBanTrongService } from './tim-ban-trong.service';

describe('TimBanTrongService', () => {
  const prisma = {
    khu_vuc: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
  } as any;
  const cauHinh = { layBoolean: jest.fn(), laySo: jest.fn() } as any;
  const lichPhucVu = {
    kiemTraQuyTacThoiGian: jest.fn(),
    tinhGioKetThuc: jest.fn(),
  } as any;
  const repository = {
    layTatCaBanCoTheDat: jest.fn(),
    layIdBanDangBiChiem: jest.fn(),
  } as any;
  const lienKetBan = { layCapCoTheGhep: jest.fn() } as any;

  let service: TimBanTrongService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TimBanTrongService(prisma, cauHinh, lichPhucVu, repository, lienKetBan);
    cauHinh.layBoolean.mockResolvedValue(true);
    cauHinh.laySo.mockResolvedValue(20);
    lichPhucVu.tinhGioKetThuc.mockResolvedValue('21:00');
    repository.layIdBanDangBiChiem.mockResolvedValue(new Set());
    prisma.khu_vuc.findMany.mockResolvedValue([{ id: 1n, ten_khu_vuc: 'Trong nhà' }]);
  });

  it('ưu tiên bàn đơn vừa đủ sức chứa', async () => {
    repository.layTatCaBanCoTheDat.mockResolvedValue([
      { id: 1n, ma_ban: 'A01', ten_ban: 'A01', khu_vuc_id: 1n, suc_chua: 4, suc_chua_toi_da: 4, trang_thai: 'TRONG' },
      { id: 2n, ma_ban: 'A02', ten_ban: 'A02', khu_vuc_id: 1n, suc_chua: 6, suc_chua_toi_da: 6, trang_thai: 'TRONG' },
    ]);

    const ketQua = await service.tim({ ngay: '2026-08-20', gioBatDau: '19:00', soNguoi: 4 });

    expect(ketQua.coBan).toBe(true);
    expect(ketQua.phuongAn[0].kieu).toBe('BAN_DON');
    expect(ketQua.phuongAn[0].banAns[0].ma_ban).toBe('A01');
  });

  it('gợi ý ghép hai bàn liền kề khi không có bàn đơn đủ chỗ', async () => {
    repository.layTatCaBanCoTheDat.mockResolvedValue([
      { id: 1n, ma_ban: 'A01', ten_ban: 'A01', khu_vuc_id: 1n, suc_chua: 4, suc_chua_toi_da: 4, trang_thai: 'TRONG' },
      { id: 2n, ma_ban: 'A02', ten_ban: 'A02', khu_vuc_id: 1n, suc_chua: 4, suc_chua_toi_da: 4, trang_thai: 'TRONG' },
    ]);
    lienKetBan.layCapCoTheGhep.mockResolvedValue([
      { id: 10n, ban_1_id: 1n, ban_2_id: 2n, co_the_ghep: true },
    ]);

    const ketQua = await service.tim({ ngay: '2026-08-20', gioBatDau: '19:00', soNguoi: 7 });

    expect(ketQua.coBan).toBe(true);
    expect(ketQua.phuongAn[0].kieu).toBe('GHEP_BAN');
    expect(ketQua.phuongAn[0].banAns).toHaveLength(2);
    expect(ketQua.phuongAn[0].tongSucChuaToiDa).toBe(8);
  });
});
