import * as argon2 from 'argon2';
import { XacThucService } from './xac-thuc.service';

jest.mock('argon2', () => ({
  hash: jest.fn(),
  verify: jest.fn(),
}));

describe('XacThucService - reset password Prisma flow', () => {
  const jwt = {} as any;
  const lifecycle = {} as any;

  const config = {
    get: jest.fn(
      (key: string, fallback?: string) => {
        if (key === 'RESET_PASSWORD_EXPIRES_MINUTES') {
          return '30';
        }
        if (key === 'NODE_ENV') {
          return 'development';
        }
        return fallback;
      },
    ),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('quenMatKhau vô hiệu token cũ và tạo token mới bằng Prisma', async () => {
    const tx = {
      token_dat_lai_mat_khau: {
        updateMany: jest.fn().mockResolvedValue({
          count: 1,
        }),
        create: jest.fn().mockResolvedValue({
          id: 9n,
        }),
      },
    };

    const prisma = {
      tai_khoan: {
        findFirst: jest.fn().mockResolvedValue({
          id: 5n,
        }),
      },
      $transaction: jest.fn(
        async (fn: (client: typeof tx) => unknown) =>
          fn(tx),
      ),
    } as any;

    const service = new XacThucService(
      prisma,
      jwt,
      config,
      lifecycle,
    );

    const result = await service.quenMatKhau({
      email: 'a@example.com',
    });

    expect(
      tx.token_dat_lai_mat_khau.updateMany,
    ).toHaveBeenCalledWith({
      where: {
        tai_khoan_id: 5n,
        da_su_dung: false,
      },
      data: {
        da_su_dung: true,
        ngay_su_dung: expect.any(Date),
      },
    });

    expect(
      tx.token_dat_lai_mat_khau.create,
    ).toHaveBeenCalledWith({
      data: {
        tai_khoan_id: 5n,
        token_hash: expect.any(String),
        het_han_luc: expect.any(Date),
        da_su_dung: false,
      },
    });

    expect(
      result.tokenDatLaiMatKhau,
    ).toEqual(expect.any(String));
  });

  it('datLaiMatKhau claim token atomically rồi vô hiệu toàn bộ token còn lại', async () => {
    (
      argon2.hash as jest.Mock
    ).mockResolvedValue('new-hash');

    (
      argon2.verify as jest.Mock
    ).mockResolvedValue(false);

    const tx = {
      token_dat_lai_mat_khau: {
        findUnique: jest.fn().mockResolvedValue({
          id: 9n,
          tai_khoan_id: 5n,
          da_su_dung: false,
          het_han_luc: new Date(
            Date.now() + 60_000,
          ),
        }),
        updateMany: jest
          .fn()
          .mockResolvedValueOnce({
            count: 1,
          })
          .mockResolvedValueOnce({
            count: 2,
          }),
      },
      tai_khoan: {
        findUnique: jest.fn().mockResolvedValue({
          id: 5n,
          mat_khau: 'old-hash',
          ngay_xoa: null,
          trang_thai: 'HOAT_DONG',
        }),
        update: jest.fn().mockResolvedValue({}),
      },
    };

    const prisma = {
      $transaction: jest.fn(
        async (fn: (client: typeof tx) => unknown) =>
          fn(tx),
      ),
    } as any;

    const service = new XacThucService(
      prisma,
      jwt,
      config,
      lifecycle,
    );

    await expect(
      service.datLaiMatKhau({
        token: 'runtime-token',
        matKhauMoi: 'NewPassword123!',
      }),
    ).resolves.toEqual({
      thongBao:
        'Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.',
    });

    expect(
      tx.token_dat_lai_mat_khau.updateMany,
    ).toHaveBeenNthCalledWith(
      1,
      {
        where: {
          id: 9n,
          da_su_dung: false,
          het_han_luc: {
            gt: expect.any(Date),
          },
        },
        data: {
          da_su_dung: true,
          ngay_su_dung: expect.any(Date),
        },
      },
    );

    expect(
      tx.tai_khoan.update,
    ).toHaveBeenCalledWith({
      where: {
        id: 5n,
      },
      data: {
        mat_khau: 'new-hash',
        bat_buoc_doi_mat_khau: false,
        refresh_token_hash: null,
        so_lan_dang_nhap_sai: 0,
        khoa_den: null,
      },
    });
  });

  it('race claim token thất bại được map về XAC_THUC_013', async () => {
    (
      argon2.hash as jest.Mock
    ).mockResolvedValue('new-hash');

    (
      argon2.verify as jest.Mock
    ).mockResolvedValue(false);

    const tx = {
      token_dat_lai_mat_khau: {
        findUnique: jest.fn().mockResolvedValue({
          id: 9n,
          tai_khoan_id: 5n,
          da_su_dung: false,
          het_han_luc: new Date(
            Date.now() + 60_000,
          ),
        }),
        updateMany: jest.fn().mockResolvedValue({
          count: 0,
        }),
      },
      tai_khoan: {
        findUnique: jest.fn().mockResolvedValue({
          id: 5n,
          mat_khau: 'old-hash',
          ngay_xoa: null,
          trang_thai: 'HOAT_DONG',
        }),
        update: jest.fn(),
      },
    };

    const prisma = {
      $transaction: jest.fn(
        async (fn: (client: typeof tx) => unknown) =>
          fn(tx),
      ),
    } as any;

    const service = new XacThucService(
      prisma,
      jwt,
      config,
      lifecycle,
    );

    await expect(
      service.datLaiMatKhau({
        token: 'runtime-token',
        matKhauMoi: 'NewPassword123!',
      }),
    ).rejects.toMatchObject({
      maLoi: 'XAC_THUC_013',
    });

    expect(
      tx.tai_khoan.update,
    ).not.toHaveBeenCalled();
  });
});
