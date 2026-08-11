import type { ExecutionContext } from '@nestjs/common';
import { JwtGuard } from './jwt.guard';

function taoContext(request: Record<string, unknown>): ExecutionContext {
  class ControllerThu {}
  const handler = () => undefined;

  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => undefined,
      getNext: () => undefined,
    }),
    getHandler: () => handler,
    getClass: () => ControllerThu,
  } as unknown as ExecutionContext;
}

function taoGuard({
  batBuocDoiMatKhau,
  choPhep,
}: {
  batBuocDoiMatKhau: boolean;
  choPhep: boolean;
}) {
  const jwt = {
    verifyAsync: jest.fn().mockResolvedValue({
      sub: '1',
      loai: 'access',
    }),
  };

  const config = {
    getOrThrow: jest.fn().mockReturnValue('secret-test'),
  };

  const prisma = {
    tai_khoan: {
      findUnique: jest.fn().mockResolvedValue({
        id: 1n,
        ngay_xoa: null,
        trang_thai: 'HOAT_DONG',
        vai_tro_id: 2n,
        bat_buoc_doi_mat_khau: batBuocDoiMatKhau,
      }),
    },
    vai_tro: {
      findUnique: jest.fn().mockResolvedValue({
        id: 2n,
        ma_vai_tro: 'NHAN_VIEN',
        trang_thai: 'HOAT_DONG',
      }),
    },
  };

  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(choPhep),
  };

  return new JwtGuard(
    jwt as never,
    config as never,
    prisma as never,
    reflector as never,
  );
}

describe('JwtGuard - bắt buộc đổi mật khẩu', () => {
  it('chặn API nghiệp vụ khi tài khoản đang bị bắt buộc đổi mật khẩu', async () => {
    const request = {
      header: jest.fn().mockReturnValue('Bearer access-test'),
    };
    const guard = taoGuard({
      batBuocDoiMatKhau: true,
      choPhep: false,
    });

    await expect(
      guard.canActivate(taoContext(request)),
    ).rejects.toMatchObject({
      maLoi: 'XAC_THUC_014',
    });
  });

  it('cho phép endpoint được đánh dấu để người dùng đổi mật khẩu hoặc đăng xuất', async () => {
    const request: Record<string, any> = {
      header: jest.fn().mockReturnValue('Bearer access-test'),
    };
    const guard = taoGuard({
      batBuocDoiMatKhau: true,
      choPhep: true,
    });

    await expect(
      guard.canActivate(taoContext(request)),
    ).resolves.toBe(true);

    expect(request.nguoiDung).toEqual({
      taiKhoanId: '1',
      vaiTroId: '2',
      maVaiTro: 'NHAN_VIEN',
    });
  });
});
