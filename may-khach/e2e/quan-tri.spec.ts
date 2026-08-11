import { expect, test } from '@playwright/test';
import { dangNhapQuanTriQuaGiaoDien, layThongTinAdmin } from './tro-giup';

const admin = layThongTinAdmin();

test.describe('Khu quản trị', () => {
  test.skip(!admin, 'Thiếu thông tin Admin E2E và không đọc được ../may-chu/.env');

  test('admin đăng nhập và mở dashboard', async ({ page }) => {
    await dangNhapQuanTriQuaGiaoDien(page);
    await expect(
      page.getByRole('heading', { name: 'Hôm nay tại nhà hàng', exact: true }),
    ).toBeVisible();
    await expect(page.getByText(/đặt bàn/i).first()).toBeVisible();
  });
});
