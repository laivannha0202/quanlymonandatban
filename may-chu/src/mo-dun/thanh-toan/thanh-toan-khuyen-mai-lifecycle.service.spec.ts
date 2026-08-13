import { ThanhToanService } from './thanh-toan.service';

describe('ThanhToanService - lifecycle quota khuyến mãi', () => {
  const service = Object.create(
    ThanhToanService.prototype,
  ) as ThanhToanService;

  it('chuyển quota DA_GIU sang DA_DUNG idempotent theo booking', async () => {
    const updateMany = jest
      .fn()
      .mockResolvedValue({ count: 1 });

    const tx = {
      su_dung_khuyen_mai: {
        updateMany,
      },
    };

    const result =
      await service.danhDauKhuyenMaiDaDungTrongTransaction(
        tx as never,
        123n,
      );

    expect(result).toBe(1);
    expect(updateMany).toHaveBeenCalledWith({
      where: {
        dat_ban_id: 123n,
        trang_thai: 'DA_GIU',
      },
      data: {
        trang_thai: 'DA_DUNG',
        thoi_gian_su_dung: expect.any(Date),
        thoi_gian_huy: null,
        ly_do_huy: null,
      },
    });
  });

  it('giải phóng chỉ quota DA_GIU và giữ lý do tối đa 255 ký tự', async () => {
    const updateMany = jest
      .fn()
      .mockResolvedValue({ count: 1 });

    const tx = {
      su_dung_khuyen_mai: {
        updateMany,
      },
    };

    const result =
      await service.giaiPhongKhuyenMaiTrongTransaction(
        tx as never,
        123n,
        `  ${'x'.repeat(300)}  `,
      );

    expect(result).toBe(1);
    expect(updateMany).toHaveBeenCalledTimes(1);

    const call = updateMany.mock.calls[0][0];

    expect(call.where).toEqual({
      dat_ban_id: 123n,
      trang_thai: 'DA_GIU',
    });
    expect(call.data.trang_thai).toBe('DA_HUY');
    expect(call.data.thoi_gian_huy).toEqual(
      expect.any(Date),
    );
    expect(call.data.thoi_gian_su_dung).toBeNull();
    expect(call.data.ly_do_huy).toHaveLength(255);
  });

  it('không khôi phục quota đã DA_DUNG khi hủy booking', async () => {
    const updateMany = jest
      .fn()
      .mockResolvedValue({ count: 0 });

    const tx = {
      su_dung_khuyen_mai: {
        updateMany,
      },
    };

    const result =
      await service.giaiPhongKhuyenMaiTrongTransaction(
        tx as never,
        123n,
        'Khách hủy sau khi đã dùng ưu đãi',
      );

    expect(result).toBe(0);
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          dat_ban_id: 123n,
          trang_thai: 'DA_GIU',
        },
      }),
    );
  });
});
