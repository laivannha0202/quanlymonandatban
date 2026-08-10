import { expect, test } from '@playwright/test';
import { dangNhapQuanTri, layThongTinAdmin, maDuyNhat } from '../tro-giup';

const admin = layThongTinAdmin();

test.describe('CRUD khu vực qua UI', () => {
  test.skip(!admin, 'Thiếu thông tin Admin E2E');

  test('tạo → sửa → xóa khu vực không để lại dữ liệu test', async ({ page }) => {
    const ma = maDuyNhat('E2EKV');
    const tenBanDau = `Khu E2E ${ma}`;
    const tenSauSua = `${tenBanDau} sửa`;

    await dangNhapQuanTri(page);
    await page.goto('/quan-tri/khu-vuc');
    await expect(page.getByRole('heading', { name: 'Khu vực', exact: true })).toBeVisible();

    await page.getByRole('button', { name: /Thêm khu vực$/ }).click();
    let dialog = page.getByRole('dialog', { name: 'Thêm khu vực' });
    await dialog.getByLabel('Mã khu vực', { exact: true }).fill(ma);
    await dialog.getByLabel('Tên khu vực', { exact: true }).fill(tenBanDau);
    await dialog.getByLabel('Mô tả', { exact: true }).fill('Dữ liệu E2E tự động, sẽ được xóa sau test.');
    await dialog.getByRole('button', { name: 'Lưu', exact: true }).click();

    const row = page.locator('tr').filter({ hasText: ma });
    await expect(row).toBeVisible({ timeout: 10_000 });
    await expect(row).toContainText(tenBanDau);

    await row.getByRole('button', { name: 'Sửa khu vực' }).click();
    dialog = page.getByRole('dialog', { name: 'Sửa khu vực' });
    await dialog.getByLabel('Tên khu vực', { exact: true }).fill(tenSauSua);
    await dialog.getByRole('button', { name: 'Lưu', exact: true }).click();
    await expect(row).toContainText(tenSauSua, { timeout: 10_000 });

    await row.getByRole('button', { name: 'Xóa khu vực' }).click();
    const confirm = page.getByRole('dialog', { name: 'Xóa khu vực?' });
    await confirm.getByRole('button', { name: 'Xóa', exact: true }).click();
    await expect(row).toHaveCount(0, { timeout: 10_000 });
  });
});
