import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Request, Response } from 'express';

@Injectable()
export class PhienCookieService {
  readonly tenCookie = 'nha_hang_refresh_v1';

  constructor(private readonly config: ConfigService) {}

  layRefreshToken(request: Request): string | null {
    const giaTri = request.cookies?.[this.tenCookie];
    return typeof giaTri === 'string' && giaTri.trim()
      ? giaTri.trim()
      : null;
  }

  ganRefreshToken(response: Response, refreshToken: string): void {
    response.cookie(
      this.tenCookie,
      refreshToken,
      this.tuyChonCookie(true),
    );
  }

  xoaRefreshToken(response: Response): void {
    response.clearCookie(
      this.tenCookie,
      this.tuyChonCookie(false),
    );
  }

  private tuyChonCookie(coThoiHan: boolean): CookieOptions {
    const production =
      this.config.get<string>('NODE_ENV', 'development') === 'production';

    const refreshExpires = Number(
      this.config.get<string>(
        'JWT_REFRESH_EXPIRES_SECONDS',
        '2592000',
      ),
    );

    return {
      httpOnly: true,
      secure: production,
      sameSite: 'lax',
      path: '/api/v1/xac-thuc',
      ...(coThoiHan
        ? {
            maxAge:
              Math.max(60, refreshExpires) * 1000,
          }
        : {}),
    };
  }
}
