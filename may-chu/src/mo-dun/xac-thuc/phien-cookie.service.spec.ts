import { PhienCookieService } from './phien-cookie.service';

function taoService(nodeEnv = 'development') {
  const config = {
    get: jest.fn((key: string, fallback: string) => {
      if (key === 'NODE_ENV') return nodeEnv;
      if (key === 'JWT_REFRESH_EXPIRES_SECONDS') return '2592000';
      return fallback;
    }),
  };

  return new PhienCookieService(config as never);
}

describe('PhienCookieService', () => {
  it('đọc refresh token từ cookie HttpOnly đã parse', () => {
    const service = taoService();

    expect(
      service.layRefreshToken({
        cookies: {
          nha_hang_refresh_v1: 'refresh-test',
        },
      } as never),
    ).toBe('refresh-test');

    expect(
      service.layRefreshToken({
        cookies: {},
      } as never),
    ).toBeNull();
  });

  it('cookie dev dùng HttpOnly + SameSite=Lax và giới hạn path xác thực', () => {
    const service = taoService();
    const response = {
      cookie: jest.fn(),
    };

    service.ganRefreshToken(
      response as never,
      'refresh-test',
    );

    expect(response.cookie).toHaveBeenCalledWith(
      'nha_hang_refresh_v1',
      'refresh-test',
      expect.objectContaining({
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/api/v1/xac-thuc',
        maxAge: 2_592_000_000,
      }),
    );
  });

  it('cookie production luôn bật Secure và clear cùng path', () => {
    const service = taoService('production');
    const response = {
      clearCookie: jest.fn(),
    };

    service.xoaRefreshToken(response as never);

    expect(response.clearCookie).toHaveBeenCalledWith(
      'nha_hang_refresh_v1',
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/api/v1/xac-thuc',
      }),
    );
  });
});
