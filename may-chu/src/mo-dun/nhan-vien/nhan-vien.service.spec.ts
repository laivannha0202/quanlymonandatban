import * as argon2 from 'argon2';
import { NhanVienService } from './nhan-vien.service';

jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('HASHED_PASSWORD'),
}));

describe('NhanVienService - Prisma lifecycle', () => {
  const nguoiDung = {
    taiKhoanId: '99',
  } as any;

  const row = {
    id: 1n,
    tai_khoan_id: 10n,
    ma_nhan_vien: 'NV001',
    ho_ten: 'Nguyễn Văn A',
    so_dien_thoai: '0900000001',
    email: 'a@example.com',
    ngay_vao_lam: new Date('2026-08-10T00:00:00.000Z'),
    ghi_chu: null,
    trang_thai: 'HOAT_DONG',
    ngay_tao: new Date('2026-08-10T00:00:00.000Z'),
    ngay_cap_nhat: new Date('2026-08-10T00:00:00.000Z'),
    tai_khoan: {
      ten_dang_nhap: 'a@example.com',
      email: 'a@example.com',
      trang_thai: 'HOAT_DONG',
      bat_buoc_doi_mat_khau: false,
      lan_dang_nhap_cuoi: null,
      vai_tro: {
        id: 2n,
        ma_vai_tro: 'NHAN_VIEN',
        ten_vai_tro: 'Nhân viên',
      },
    },
  };

  it('danh sách dùng Prisma relation và trả ngày vào làm YYYY-MM-DD', async () => {
    const prisma = {
      nhan_vien: {
        findMany: jest.fn().mockResolvedValue([row]),
        count: jest.fn().mockResolvedValue(1),
      },
    } as any;

    const service = new NhanVienService(
      prisma,
      {} as any,
    );

    const result = await service.danhSach({
      trang: 1,
      kichThuoc: 20,
    } as any);

    expect(result.danhSach).toEqual([
      expect.objectContaining({
        ma_nhan_vien: 'NV001',
        ngay_vao_lam: '2026-08-10',
        email_tai_khoan: 'a@example.com',
        ma_vai_tro: 'NHAN_VIEN',
      }),
    ]);

    expect(prisma.nhan_vien.findMany)
      .toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            ngay_xoa: null,
            tai_khoan: expect.objectContaining({
              ngay_xoa: null,
            }),
          }),
        }),
      );
  });

  it('tạo nhân viên + tài khoản trong một transaction Prisma', async () => {
    const tx = {
      tai_khoan: {
        create: jest.fn().mockResolvedValue({
          id: 10n,
        }),
      },
      nhan_vien: {
        create: jest.fn().mockResolvedValue({
          id: 1n,
        }),
      },
    } as any;

    const prisma = {
      vai_tro: {
        findFirst: jest.fn().mockResolvedValue({
          id: 2n,
          ma_vai_tro: 'NHAN_VIEN',
        }),
      },
      nhan_vien: {
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue(row),
      },
      tai_khoan: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      $transaction: jest.fn(
        async (callback: (client: any) => unknown) =>
          callback(tx),
      ),
    } as any;

    const nhatKy = {
      ghiNhan: jest.fn().mockResolvedValue(undefined),
    } as any;

    const service = new NhanVienService(
      prisma,
      nhatKy,
    );

    await service.tao(
      {
        maNhanVien: 'NV001',
        hoTen: 'Nguyễn Văn A',
        email: 'a@example.com',
        matKhau: 'Password123',
        maVaiTro: 'NHAN_VIEN',
        ngayVaoLam: '2026-08-10',
        trangThai: 'TAM_NGHI',
      },
      nguoiDung,
    );

    expect(argon2.hash).toHaveBeenCalledWith(
      'Password123',
    );

    expect(tx.tai_khoan.create)
      .toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'a@example.com',
          ten_dang_nhap: 'a@example.com',
          vai_tro_id: 2n,
          trang_thai: 'BI_KHOA',
          bat_buoc_doi_mat_khau: true,
        }),
        select: {
          id: true,
        },
      });

    expect(tx.nhan_vien.create)
      .toHaveBeenCalledWith({
        data: expect.objectContaining({
          tai_khoan_id: 10n,
          ma_nhan_vien: 'NV001',
          ngay_vao_lam:
            new Date('2026-08-10T00:00:00.000Z'),
          trang_thai: 'TAM_NGHI',
        }),
        select: {
          id: true,
        },
      });
  });

  it('không cho gán vai trò KHACH_HANG cho nhân viên', async () => {
    const prisma = {
      vai_tro: {
        findFirst: jest.fn().mockResolvedValue({
          id: 3n,
          ma_vai_tro: 'KHACH_HANG',
        }),
      },
    } as any;

    const service = new NhanVienService(
      prisma,
      {} as any,
    );

    await expect(
      service.tao(
        {
          maNhanVien: 'NV002',
          hoTen: 'B',
          email: 'b@example.com',
          matKhau: 'Password123',
          maVaiTro: 'KHACH_HANG',
        },
        nguoiDung,
      ),
    ).rejects.toMatchObject({
      maLoi: 'NHAN_VIEN_002',
    });
  });

  it('không cho tự thay đổi vai trò của tài khoản đang đăng nhập', async () => {
    const selfRow = {
      ...row,
      tai_khoan_id: 99n,
    };

    const prisma = {
      nhan_vien: {
        findFirst: jest.fn().mockResolvedValue(selfRow),
      },
      tai_khoan: {
        update: jest.fn(),
      },
    } as any;

    const service = new NhanVienService(
      prisma,
      {} as any,
    );

    await expect(
      service.capNhat(
        '1',
        {
          maVaiTro: 'QUAN_LY',
        },
        nguoiDung,
      ),
    ).rejects.toMatchObject({
      maLoi: 'NHAN_VIEN_005',
    });
  });

  it('đặt lại mật khẩu thu hồi refresh token và reset khóa đăng nhập', async () => {
    const tx = {
      nhan_vien: {
        update: jest.fn().mockResolvedValue({}),
      },
      tai_khoan: {
        update: jest.fn().mockResolvedValue({}),
      },
    } as any;

    const prisma = {
      nhan_vien: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce(row)
          .mockResolvedValueOnce(row),
      },
      $transaction: jest.fn(
        async (callback: (client: any) => unknown) =>
          callback(tx),
      ),
    } as any;

    const nhatKy = {
      ghiNhan: jest.fn().mockResolvedValue(undefined),
    } as any;

    const service = new NhanVienService(
      prisma,
      nhatKy,
    );

    await service.capNhat(
      '1',
      {
        matKhauMoi: 'NewPassword123',
      },
      nguoiDung,
    );

    expect(tx.tai_khoan.update)
      .toHaveBeenCalledWith({
        where: {
          id: 10n,
        },
        data: expect.objectContaining({
          mat_khau: 'HASHED_PASSWORD',
          bat_buoc_doi_mat_khau: true,
          refresh_token_hash: null,
          so_lan_dang_nhap_sai: 0,
          khoa_den: null,
        }),
      });
  });

  it('không cho tự khóa chính mình', async () => {
    const selfRow = {
      ...row,
      tai_khoan_id: 99n,
    };

    const prisma = {
      nhan_vien: {
        findFirst: jest.fn().mockResolvedValue(selfRow),
      },
      $transaction: jest.fn(),
    } as any;

    const service = new NhanVienService(
      prisma,
      {} as any,
    );

    await expect(
      service.capNhatTrangThai(
        '1',
        {
          trangThai: 'TAM_NGHI',
        },
        nguoiDung,
      ),
    ).rejects.toMatchObject({
      maLoi: 'NHAN_VIEN_004',
    });

    expect(prisma.$transaction)
      .not.toHaveBeenCalled();
  });

  it('từ chối ngày vào làm không tồn tại trên lịch', async () => {
    const prisma = {
      vai_tro: {
        findFirst: jest.fn().mockResolvedValue({
          id: 2n,
          ma_vai_tro: 'NHAN_VIEN',
        }),
      },
      nhan_vien: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      tai_khoan: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    } as any;

    const service = new NhanVienService(
      prisma,
      {} as any,
    );

    await expect(
      service.tao(
        {
          maNhanVien: 'NV003',
          hoTen: 'C',
          email: 'c@example.com',
          matKhau: 'Password123',
          ngayVaoLam: '2026-02-31',
        },
        nguoiDung,
      ),
    ).rejects.toMatchObject({
      maLoi: 'NHAN_VIEN_006',
    });
  });
});
