import { DatBanWorkflowService } from './dat-ban-workflow.service';

function wallClockVietNam(instantMs: number): string {
  return new Date(instantMs + 7 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ');
}

describe('DatBanWorkflowService - chính sách hủy quản trị', () => {
  function taoService(gioBatDau: string) {
    const repository = {
      layChiTietTheoId: jest.fn().mockResolvedValue({
        id: 99n,
        ma_dat_ban: 'DBTEST',
        gio_bat_dau: gioBatDau,
        trang_thai: 'DA_XAC_NHAN',
      }),
    };

    const cauHinh = {
      laySo: jest.fn(async (key: string) => {
        if (key === 'THOI_GIAN_HUY_TRUOC_PHUT') return 60;
        if (key === 'TY_LE_HOAN_TIEN_HUY_DUNG_HAN') return 80;
        return 0;
      }),
    };

    const service = new DatBanWorkflowService(
      {} as never,
      repository as never,
      cauHinh as never,
      {} as never,
      {} as never,
      {} as never,
    );

    const chuyen = jest
      .spyOn(service as never, 'chuyenTrangThai' as never)
      .mockResolvedValue({ id: 99n } as never);

    return {
      service,
      repository,
      cauHinh,
      chuyen,
    };
  }

  it('nhà hàng chủ động hủy luôn tạo chính sách hoàn 100%', async () => {
    const { service, chuyen, cauHinh } = taoService(
      wallClockVietNam(Date.now() + 5 * 60 * 60_000),
    );

    await service.huyQuanTri(
      '99',
      {
        nguonHuy: 'NHA_HANG_CHU_DONG',
        lyDo: 'Nhà hàng có sự cố',
      },
      {
        taiKhoanId: '10',
        vaiTroId: '1',
        maVaiTro: 'QUAN_TRI_VIEN',
      } as never,
    );

    expect(cauHinh.laySo).not.toHaveBeenCalled();
    expect(chuyen).toHaveBeenCalledWith(
      '99',
      'DA_HUY',
      'NHA_HANG_HUY',
      expect.anything(),
      'Nhà hàng chủ động hủy: Nhà hàng có sự cố',
      undefined,
      100,
    );
  });

  it('nhân viên không được ghi nhận nhà hàng chủ động hủy', async () => {
    const { service, chuyen, cauHinh } = taoService(
      wallClockVietNam(Date.now() + 5 * 60 * 60_000),
    );

    await expect(
      service.huyQuanTri(
        '99',
        {
          nguonHuy: 'NHA_HANG_CHU_DONG',
          lyDo: 'Không đủ nhân sự',
        },
        {
          taiKhoanId: '20',
          vaiTroId: '2',
          maVaiTro: 'NHAN_VIEN',
        } as never,
      ),
    ).rejects.toMatchObject({
      maLoi: 'DAT_BAN_025',
    });

    expect(cauHinh.laySo).not.toHaveBeenCalled();
    expect(chuyen).not.toHaveBeenCalled();
  });

  it('khách yêu cầu hủy đủ sớm dùng tỷ lệ hoàn theo cấu hình', async () => {
    const { service, chuyen } = taoService(
      wallClockVietNam(Date.now() + 2 * 60 * 60_000),
    );

    await service.huyQuanTri(
      '99',
      {
        nguonHuy: 'KHACH_YEU_CAU',
        lyDo: 'Đổi lịch',
      },
      {
        taiKhoanId: '10',
        vaiTroId: '2',
      } as never,
    );

    expect(chuyen).toHaveBeenCalledWith(
      '99',
      'DA_HUY',
      'NHAN_VIEN_HUY_THEO_YEU_CAU_KHACH',
      expect.anything(),
      'Khách yêu cầu hủy qua nhân viên: Đổi lịch',
      undefined,
      80,
    );
  });

  it('khách yêu cầu hủy quá sát giờ vẫn được hủy nhưng tỷ lệ hoàn là 0%', async () => {
    const { service, chuyen } = taoService(
      wallClockVietNam(Date.now() + 30 * 60_000),
    );

    await service.huyQuanTri(
      '99',
      {
        nguonHuy: 'KHACH_YEU_CAU',
      },
      {
        taiKhoanId: '10',
        vaiTroId: '2',
      } as never,
    );

    expect(chuyen).toHaveBeenCalledWith(
      '99',
      'DA_HUY',
      'NHAN_VIEN_HUY_THEO_YEU_CAU_KHACH',
      expect.anything(),
      'Khách yêu cầu hủy qua nhân viên',
      undefined,
      0,
    );
  });
});
