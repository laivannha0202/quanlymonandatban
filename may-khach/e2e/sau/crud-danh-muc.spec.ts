import { expect, test } from '@playwright/test';
import { dangNhapQuanTri, layThongTinAdmin, maDuyNhat } from '../tro-giup';

const admin = layThongTinAdmin();

test.describe('CRUD danh mục món qua UI', () => {
  test.skip(!admin, 'Thiếu thông tin Admin E2E');

  test('tạo → sửa → xóa danh mục món', async ({ page }) => {
    const ma = maDuyNhat('E2EDM');
    const tenBanDau = `Danh mục E2E ${ma}`;
    const tenSauSua = `${tenBanDau} sửa`;

    await dangNhapQuanTri(page);
    await page.goto('/quan-tri/danh-muc-mon');
    await expect(page.getByRole('heading', { name: 'Danh mục món', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Thêm danh mục', exact: true }).click();
    let dialog = page.getByRole('dialog', { name: 'Thêm danh mục' });
    await dialog.getByLabel('Mã danh mục', { exact: true }).fill(ma);
    await dialog.getByLabel('Tên danh mục', { exact: true }).fill(tenBanDau);
    await dialog.getByLabel('Mô tả', { exact: true }).fill('Danh mục do Playwright tạo tự động.');
    await dialog.getByRole('button', { name: 'Lưu', exact: true }).click();

    const row = page.locator('tr').filter({ hasText: ma });
    await expect(row).toBeVisible({ timeout: 10_000 });
    await row.getByRole('button', { name: 'Sửa', exact: true }).click();

    dialog = page.getByRole('dialog', { name: 'Sửa danh mục' });
    await dialog.getByLabel('Tên danh mục', { exact: true }).fill(tenSauSua);
    await dialog.getByRole('button', { name: 'Lưu', exact: true }).click();
    await expect(row).toContainText(tenSauSua, { timeout: 10_000 });

    await row.getByRole('button', { name: 'Xóa', exact: true }).click();

    const confirm = page.getByRole('dialog', { name: 'Xóa danh mục?' });
    await expect(confirm).toBeVisible();

    await confirm
      .getByRole('button', { name: 'Xóa', exact: true })
      .click();

    await expect(row).toHaveCount(0, { timeout: 10_000 });
  });
});
