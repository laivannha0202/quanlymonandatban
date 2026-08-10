import { expect, test } from '@playwright/test';

test.describe('Luồng công khai', () => {
  test('trang chủ và điều hướng chính hoạt động', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/nhà hàng|bún|quản lý/i);
    await expect(page.locator('body')).not.toContainText('Something went wrong');

    const menuLink = page.getByRole('link', { name: 'Thực đơn' });
    if (await menuLink.isVisible().catch(() => false)) {
      await menuLink.click();
    } else {
      await page.goto('/thuc-don');
    }
    await expect(page).toHaveURL(/\/thuc-don/);
    await expect(page.getByText(/thực đơn/i).first()).toBeVisible();
  });

  test('thực đơn tải dữ liệu Backend và mở được chi tiết món', async ({ page }) => {
    await page.goto('/thuc-don');
    await expect(page.getByText(/thực đơn/i).first()).toBeVisible();

    const monCard = page.locator('.dish-card').first();
    await expect(monCard).toBeVisible();
    await monCard.click();
    await expect(page).toHaveURL(/\/thuc-don\/.+/);
    await expect(page.locator('h1, h2, h3').first()).toBeVisible();
  });

  test('khuyến mãi không làm vỡ trang khi danh sách rỗng', async ({ page }) => {
    await page.goto('/khuyen-mai');
    await expect(page.getByText('Khuyến mãi đang áp dụng')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Something went wrong');
  });

  test('route không tồn tại hiển thị trang 404', async ({ page }) => {
    await page.goto('/duong-dan-khong-ton-tai-e2e');
    await expect(page.getByText(/404|không tìm thấy/i).first()).toBeVisible();
  });
});
