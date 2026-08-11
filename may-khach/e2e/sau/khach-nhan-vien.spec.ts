import { expect, test } from '@playwright/test';
import { dangNhapQuanTri, layThongTinAdmin } from '../tro-giup';

const admin = layThongTinAdmin();

test.describe('Quản trị khách hàng và nhân viên', () => {
  test.skip(!admin, 'Thiếu thông tin Admin E2E');

  test('trang khách hàng có lọc và bề mặt chỉnh sửa', async ({ page }) => {
    await dangNhapQuanTri(page);
    await page.goto('/quan-tri/khach-hang');
    await expect(page.getByRole('heading', { name: 'Khách hàng', exact: true })).toBeVisible();
    await expect(page.getByPlaceholder('Tên / SĐT / email / mã khách')).toBeVisible();
    await expect(page.locator('.ant-table')).toBeVisible();
  });

  test('trang nhân viên mở được form tạo tài khoản', async ({ page }) => {
    await dangNhapQuanTri(page);
    await page.goto('/quan-tri/nhan-vien');
    await expect(page.getByRole('heading', { name: 'Nhân viên', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Thêm nhân viên', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Thêm nhân viên' });

    await expect(dialog.getByLabel('Mã nhân viên', { exact: true })).toBeVisible();
    await expect(dialog.getByLabel('Mật khẩu ban đầu', { exact: true })).toBeVisible();
    await dialog.getByRole('button', { name: 'Đóng', exact: true }).click();
  });
});
