import { expect, test } from '@playwright/test';
import {
  dangNhapQuanTriQuaGiaoDien,
  layThongTinAdmin,
} from '../tro-giup';

test.describe('Refresh token HttpOnly cookie', () => {
  test.skip(
    !layThongTinAdmin(),
    'Thiếu thông tin Admin E2E.',
  );

  test('login không lưu refresh token ở localStorage và tự refresh khi access token hỏng', async ({ page }) => {
    await dangNhapQuanTriQuaGiaoDien(page);

    const phienSauDangNhap =
      await page.evaluate(() => {
        const raw =
          window.localStorage.getItem(
            'nha_hang_phien_v1',
          );

        return raw
          ? JSON.parse(raw)
          : null;
      });

    expect(
      phienSauDangNhap?.accessToken,
    ).toBeTruthy();

    expect(
      phienSauDangNhap,
    ).not.toHaveProperty('refreshToken');

    const cookies =
      await page.context().cookies();

    const refreshCookie =
      cookies.find(
        (cookie) =>
          cookie.name ===
          'nha_hang_refresh_v1',
      );

    expect(refreshCookie).toBeTruthy();
    expect(refreshCookie?.httpOnly).toBe(true);
    expect(refreshCookie?.sameSite).toBe('Lax');

    // Chỉ làm hỏng access token khi document MỚI bắt đầu tải.
    // Không sửa token ngay trên dashboard đang chạy vì các query nền của
    // document cũ có thể tranh nhau refresh đúng lúc navigation xảy ra.
    await page.addInitScript(() => {
      const khoa =
        'nha_hang_phien_v1';
      const coDaLamHong =
        'e2e_da_lam_hong_access_token';

      if (
        window.sessionStorage.getItem(
          coDaLamHong,
        )
      ) {
        return;
      }

      const raw =
        window.localStorage.getItem(khoa);

      if (!raw) {
        return;
      }

      const phien = JSON.parse(raw);
      phien.accessToken =
        'access-token-khong-hop-le';

      window.localStorage.setItem(
        khoa,
        JSON.stringify(phien),
      );

      window.sessionStorage.setItem(
        coDaLamHong,
        '1',
      );
    });

    const choRefresh =
      page.waitForResponse(
        (response) =>
          response
            .url()
            .includes(
              '/api/v1/xac-thuc/lam-moi-token',
            ) &&
          response
            .request()
            .method() === 'POST',
        {
          timeout: 15_000,
        },
      );

    await page.reload({
      waitUntil: 'domcontentloaded',
    });

    const refreshResponse =
      await choRefresh;

    expect(
      refreshResponse.ok(),
      `Refresh endpoint trả HTTP ${refreshResponse.status()}`,
    ).toBe(true);

    await expect(
      page.getByText(
        'Tổng quan',
        { exact: true },
      ).first(),
    ).toBeVisible({
      timeout: 15_000,
    });

    const accessMoi =
      await page.evaluate(() => {
        const raw =
          window.localStorage.getItem(
            'nha_hang_phien_v1',
          );

        return raw
          ? JSON.parse(raw).accessToken
          : null;
      });

    expect(accessMoi).toBeTruthy();
    expect(accessMoi).not.toBe(
      'access-token-khong-hop-le',
    );

    const phienMoi =
      await page.evaluate(() => {
        const raw =
          window.localStorage.getItem(
            'nha_hang_phien_v1',
          );

        return raw
          ? JSON.parse(raw)
          : null;
      });

    expect(
      phienMoi,
    ).not.toHaveProperty('refreshToken');

    await page.getByRole(
      'button',
      {
        name: 'Đăng xuất',
        exact: true,
      },
    ).click();

    await page.waitForURL(
      /\/dang-nhap$/,
      {
        timeout: 10_000,
      },
    );

    const cookiesSauDangXuat =
      await page.context().cookies();

    expect(
      cookiesSauDangXuat.some(
        (cookie) =>
          cookie.name ===
          'nha_hang_refresh_v1',
      ),
    ).toBe(false);
  });
});
