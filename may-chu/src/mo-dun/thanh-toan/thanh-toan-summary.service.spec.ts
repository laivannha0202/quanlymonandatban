import { ThanhToanService } from './thanh-toan.service';

describe('ThanhToanService - tổng hợp danh sách quản trị', () => {
  it('tính KPI trên toàn bộ bộ lọc, không phụ thuộc page rows', async () => {
    const prisma = {
      thanh_toan: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 1n,
            ma_thanh_toan: 'TT1',
            dat_ban_id: 10n,
            so_tien: 100000,
            phuong_thuc: 'TIEN_MAT',
            trang_thai: 'DA_THANH_TOAN',
            ma_giao_dich_cong: null,
            khoa_idempotency: null,
            thoi_gian_thanh_toan: new Date(),
            ngay_tao: new Date(),
            ngay_cap_nhat: new Date(),
            dat_ban: {
              ma_dat_ban: 'DB1',
              ho_ten: 'Khách A',
              so_dien_thoai: '0900000000',
              ngay_dat: new Date(),
              gio_bat_dau: new Date(),
              trang_thai: 'DA_XAC_NHAN',
            },
            hoan_tien: [],
          },
        ]),
        count: jest
          .fn()
          .mockResolvedValueOnce(25)
          .mockResolvedValueOnce(3),
        aggregate: jest.fn().mockResolvedValue({
          _sum: {
            so_tien: 2500000,
          },
        }),
      },
      hoan_tien: {
        aggregate: jest.fn().mockResolvedValue({
          _sum: {
            so_tien: 300000,
          },
        }),
        count: jest.fn().mockResolvedValue(2),
      },
    };

    const service = new ThanhToanService(
      prisma as never,
      {} as never,
      {} as never,
      {} as never,
    );

    const result = await service.danhSachQuanTri({
      trang: 2,
      kichThuoc: 20,
    });

    expect(result.danhSach).toHaveLength(1);
    expect(result.phanTrang.tong).toBe(25);
    expect(result.tongHop).toEqual({
      tongGiaoDich: 25,
      tongDaThu: 2500000,
      tongDaHoan: 300000,
      thucThu: 2200000,
      choThanhToan: 3,
      choHoanTien: 2,
    });
  });
});
