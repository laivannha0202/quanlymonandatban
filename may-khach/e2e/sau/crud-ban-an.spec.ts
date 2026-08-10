import { expect, test } from '@playwright/test';
import { dangNhapQuanTri, layThongTinAdmin, maDuyNhat } from '../tro-giup';

const admin = layThongTinAdmin();

test.describe('CRUD bàn ăn qua UI', () => {
  test.skip(!admin, 'Thiếu thông tin Admin E2E');

  test('tạo → sửa → xóa bàn dùng khu vực hiện có', async ({ page }) => {
    const ma = maDuyNhat('E2EB');
    const tenBanDau = `Bàn E2E ${ma}`;
    const tenSauSua = `${tenBanDau} sửa`;

    await dangNhapQuanTri(page);
    await page.goto('/quan-tri/ban-an');
    await expect(page.getByRole('heading', { name: 'Bàn ăn', exact: true })).toBeVisible();

    await page.getByRole('button', { name: /Thêm bàn$/ }).click();
    let dialog = page.getByRole('dialog', { name: 'Thêm bàn ăn' });
    await dialog.getByLabel('Mã bàn', { exact: true }).fill(ma);
    await dialog.getByLabel('Tên bàn', { exact: true }).fill(tenBanDau);
    await dialog.getByLabel('Khu vực', { exact: true }).click();

    const option = page
      .locator('.ant-select-dropdown:visible .ant-select-item-option:not(.ant-select-item-option-disabled)')
      .first();

    await option.click();
    await dialog.getByLabel('Sức chứa', { exact: true }).fill('2');
    await dialog.getByLabel('Sức chứa tối đa', { exact: true }).fill('4');
    await dialog.getByRole('button', { name: 'Lưu', exact: true }).click();

    const row = page.locator('tr').filter({ hasText: ma });
    await expect(row).toBeVisible({ timeout: 10_000 });

    await row.getByRole('button', { name: 'Sửa bàn' }).click();
    dialog = page.getByRole('dialog', { name: 'Sửa bàn ăn' });
    await dialog.getByLabel('Tên bàn', { exact: true }).fill(tenSauSua);
    await dialog.getByRole('button', { name: 'Lưu', exact: true }).click();
    await expect(row).toContainText(tenSauSua, { timeout: 10_000 });

    await row.getByRole('button', { name: 'Xóa bàn' }).click();
    const confirm = page.getByRole('dialog', { name: 'Xóa bàn?' });
    await confirm.getByRole('button', { name: 'Xóa', exact: true }).click();
    await expect(row).toHaveCount(0, { timeout: 10_000 });
  });
});
