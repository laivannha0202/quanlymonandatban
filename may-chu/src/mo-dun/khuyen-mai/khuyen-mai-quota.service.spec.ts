import { KhuyenMaiService } from './khuyen-mai.service';

describe('KhuyenMaiService - quota hiển thị', () => {
  const ngayBatDau = new Date(Date.now() - 60_000);
  const ngayKetThuc = new Date(Date.now() + 60_000);

  function row(
    id: bigint,
    ma: string,
    soLuotToiDa: number | null,
  ) {
    return {
      id,
      ma_khuyen_mai: ma,
      ten_khuyen_mai: ma,
      mo_ta: null,
      loai_giam: 'PHAN_TRAM',
      gia_tri: 10,
      gia_tri_don_toi_thieu: 0,
      giam_toi_da: null,
      so_luot_toi_da: soLuotToiDa,
      so_luot_moi_khach: 1,
      ngay_bat_dau: ngayBatDau,
      ngay_ket_thuc: ngayKetThuc,
      trang_thai: 'HOAT_DONG',
      ngay_tao: ngayBatDau,
      ngay_cap_nhat: ngayBatDau,
      ngay_xoa: null,
    };
  }

  it('public ẩn mã đã hết tổng quota và trả đúng số lượt còn lại', async () => {
    const prisma = {
      khuyen_mai: {
        findMany: jest.fn().mockResolvedValue([
          row(1n, 'HETLUOT', 1),
          row(2n, 'CONLUOT', 10),
        ]),
      },
      su_dung_khuyen_mai: {
        groupBy: jest.fn().mockResolvedValue([
          {
            khuyen_mai_id: 1n,
            trang_thai: 'DA_DUNG',
            _count: { _all: 1 },
          },
          {
            khuyen_mai_id: 2n,
            trang_thai: 'DA_GIU',
            _count: { _all: 2 },
          },
          {
            khuyen_mai_id: 2n,
            trang_thai: 'DA_DUNG',
            _count: { _all: 3 },
          },
        ]),
      },
    };

    const service = new KhuyenMaiService(
      prisma as never,
      { ghiNhan: jest.fn() } as never,
    );

    const result = await service.dangApDung();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      ma_khuyen_mai: 'CONLUOT',
      so_luot_toi_da: 10,
      so_luot_moi_khach: 1,
      so_luot_da_giu: 2,
      so_luot_da_dung: 3,
      so_luot_con_lai: 5,
    });
  });

  it('quota null được hiểu là không giới hạn', async () => {
    const prisma = {
      khuyen_mai: {
        findMany: jest.fn().mockResolvedValue([
          row(3n, 'UNLIMITED', null),
        ]),
      },
      su_dung_khuyen_mai: {
        groupBy: jest.fn().mockResolvedValue([
          {
            khuyen_mai_id: 3n,
            trang_thai: 'DA_DUNG',
            _count: { _all: 99 },
          },
        ]),
      },
    };

    const service = new KhuyenMaiService(
      prisma as never,
      { ghiNhan: jest.fn() } as never,
    );

    const result = await service.dangApDung();

    expect(result[0]).toMatchObject({
      so_luot_toi_da: null,
      so_luot_da_dung: 99,
      so_luot_con_lai: null,
    });
  });
});
