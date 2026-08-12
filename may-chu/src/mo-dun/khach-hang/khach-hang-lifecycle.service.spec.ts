import { LoiNghiepVuException } from '../../dung-chung/exception/loi-nghiep-vu.exception';
import { KhachHangLifecycleService } from './khach-hang-lifecycle.service';

describe('KhachHangLifecycleService', () => {
  const service = new KhachHangLifecycleService();

  function txMock() {
    return {
      khach_hang: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    } as any;
  }

  it('tạo khách mới khi đặt bàn và chuẩn hóa mã theo ID', async () => {
    const tx = txMock();

    tx.khach_hang.findUnique.mockResolvedValue(null);
    tx.khach_hang.create.mockResolvedValue({
      id: 42n,
      ma_khach_hang: 'TMP',
    });
    tx.khach_hang.update.mockResolvedValue({
      id: 42n,
      ma_khach_hang: 'HV_KH042',
      trang_thai: 'HOAT_DONG',
    });

    const result =
      await service.damBaoKhachChoDatBan(tx, {
        hoTen: '  Nguyễn Văn A  ',
        soDienThoai: ' 0912345678 ',
        email: ' a@example.com ',
      });

    expect(
      tx.khach_hang.create,
    ).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ho_ten: 'Nguyễn Văn A',
        so_dien_thoai: '0912345678',
        email: 'a@example.com',
        trang_thai: 'HOAT_DONG',
      }),
    });

    expect(
      tx.khach_hang.update,
    ).toHaveBeenCalledWith({
      where: { id: 42n },
      data: { ma_khach_hang: 'HV_KH042' },
    });

    expect(result.ma_khach_hang).toBe(
      'HV_KH042',
    );
  });

  it('chặn khách đang khóa khi đặt bàn', async () => {
    const tx = txMock();

    tx.khach_hang.findUnique.mockResolvedValue({
      id: 5n,
      tai_khoan_id: null,
      trang_thai: 'BI_KHOA',
      ngay_xoa: null,
    });

    await expect(
      service.damBaoKhachChoDatBan(tx, {
        hoTen: 'A',
        soDienThoai: '0912345678',
      }),
    ).rejects.toMatchObject({
      maLoi: 'KHACH_HANG_004',
    });
  });

  it('khôi phục khách soft-delete chưa có tài khoản khi đăng ký', async () => {
    const tx = txMock();

    tx.khach_hang.findUnique.mockResolvedValue({
      id: 7n,
      tai_khoan_id: null,
      trang_thai: 'NGUNG_HOAT_DONG',
      ngay_xoa: new Date(),
    });

    tx.khach_hang.update.mockResolvedValue({
      id: 7n,
      tai_khoan_id: 99n,
      trang_thai: 'HOAT_DONG',
      ngay_xoa: null,
    });

    await service.ganTaiKhoanKhiDangKy(tx, {
      taiKhoanId: 99n,
      hoTen: 'Nguyễn A',
      soDienThoai: '0912345678',
      email: 'a@example.com',
    });

    expect(
      tx.khach_hang.update,
    ).toHaveBeenCalledWith({
      where: { id: 7n },
      data: {
        tai_khoan_id: 99n,
        ho_ten: 'Nguyễn A',
        email: 'a@example.com',
        trang_thai: 'HOAT_DONG',
        ngay_xoa: null,
      },
    });
  });

  it('không cho đăng ký nếu số điện thoại đã gắn tài khoản', async () => {
    const tx = txMock();

    tx.khach_hang.findUnique.mockResolvedValue({
      id: 8n,
      tai_khoan_id: 10n,
      trang_thai: 'HOAT_DONG',
      ngay_xoa: null,
    });

    await expect(
      service.ganTaiKhoanKhiDangKy(tx, {
        taiKhoanId: 99n,
        hoTen: 'Nguyễn A',
        soDienThoai: '0912345678',
        email: 'a@example.com',
      }),
    ).rejects.toMatchObject({
      maLoi: 'XAC_THUC_009',
    });
  });

  it('dùng mã lỗi riêng cho khách không hoạt động khi đăng ký', async () => {
    const tx = txMock();

    tx.khach_hang.findUnique.mockResolvedValue({
      id: 9n,
      tai_khoan_id: null,
      trang_thai: 'NGUNG_HOAT_DONG',
      ngay_xoa: null,
    });

    try {
      await service.ganTaiKhoanKhiDangKy(
        tx,
        {
          taiKhoanId: 99n,
          hoTen: 'Nguyễn A',
          soDienThoai: '0912345678',
          email: 'a@example.com',
        },
      );
      throw new Error('Expected rejection');
    } catch (error) {
      expect(
        error,
      ).toBeInstanceOf(LoiNghiepVuException);

      expect(
        (error as LoiNghiepVuException).maLoi,
      ).toBe('XAC_THUC_015');
    }
  });
});
