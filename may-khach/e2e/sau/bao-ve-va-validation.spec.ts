import { expect, test } from '@playwright/test';

test.describe('Bảo vệ tuyến và validation', () => {
  test('khách chưa đăng nhập bị đưa về trang đăng nhập khi vào quản trị', async ({ page }) => {
    await page.goto('/quan-tri');
    await page.waitForURL(/\/dang-nhap$/);
    await expect(page.getByRole('heading', { name: 'Đăng nhập', exact: true })).toBeVisible();
  });

  test('form đặt bàn hiển thị lỗi bắt buộc thay vì gửi dữ liệu rỗng', async ({ page }) => {
    await page.goto('/dat-ban');
    await page.getByRole('button', { name: 'Xác nhận đặt bàn', exact: true }).click();
    await expect(page.getByText('Nhập họ tên', { exact: true })).toBeVisible();
    await expect(page.getByText('Nhập số điện thoại', { exact: true })).toBeVisible();
    await expect(page.getByText('Chọn ngày', { exact: true })).toBeVisible();
    await expect(page.getByText('Chọn giờ', { exact: true })).toBeVisible();
  });
});
