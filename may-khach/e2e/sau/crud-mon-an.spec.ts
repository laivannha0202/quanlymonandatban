import { expect, test } from '@playwright/test';
import { dangNhapQuanTri, layThongTinAdmin, maDuyNhat } from '../tro-giup';

const admin = layThongTinAdmin();

test.describe('CRUD món ăn qua UI', () => {
  test.skip(!admin, 'Thiếu thông tin Admin E2E');

  test('tạo → sửa → xóa món dùng danh mục hiện có', async ({ page }) => {
    const ma = maDuyNhat('E2EMON');
    const tenBanDau = `Món E2E ${ma}`;
    const tenSauSua = `${tenBanDau} sửa`;

    await dangNhapQuanTri(page);
    await page.goto('/quan-tri/mon-an');
    await expect(page.getByRole('heading', { name: 'Món ăn', exact: true })).toBeVisible();

    await page.getByRole('button', { name: /Thêm món ăn$/ }).click();
    let dialog = page.getByRole('dialog', { name: 'Thêm món ăn' });
    await dialog.getByLabel('Mã món', { exact: true }).fill(ma);
    await dialog.getByLabel('Tên món', { exact: true }).fill(tenBanDau);
    await dialog.getByLabel('Giá', { exact: true }).fill('55000');
    await dialog.getByLabel('Danh mục', { exact: true }).click();

    const option = page
      .locator('.ant-select-dropdown:visible .ant-select-item-option')
      .first();

    await option.click();
    const doiTaoMon = page.waitForResponse((res) => {
      const url = new URL(res.url());
      return res.request().method() === 'POST'
        && url.pathname.endsWith('/api/v1/quan-tri/mon-an');
    });

    await dialog.getByRole('button', { name: 'Lưu', exact: true }).click();

    const taoMonResponse = await doiTaoMon;
    if (!taoMonResponse.ok()) {
      throw new Error(
        `POST món ăn thất bại: ${taoMonResponse.status()} ${await taoMonResponse.text()}`,
      );
    }

    const timKiem = page.getByPlaceholder('Mã / tên món');

    const doiTimMon = page.waitForResponse((res) => {
      const url = new URL(res.url());
      return res.request().method() === 'GET'
        && url.pathname.endsWith('/api/v1/quan-tri/mon-an')
        && url.searchParams.get('tuKhoa') === ma;
    });

    await timKiem.fill(ma);
    await timKiem.press('Enter');

    const timMonResponse = await doiTimMon;
    if (!timMonResponse.ok()) {
      throw new Error(
        `GET tìm món thất bại: ${timMonResponse.status()} ${await timMonResponse.text()}`,
      );
    }

    const row = page.locator('tr').filter({ hasText: ma });
    await expect(row).toBeVisible({ timeout: 10_000 });
    await expect(row).toContainText(tenBanDau);

    await row.getByRole('button', { name: 'Sửa món' }).click();
    dialog = page.getByRole('dialog', { name: 'Sửa món ăn' });
    await dialog.getByLabel('Tên món', { exact: true }).fill(tenSauSua);
    await dialog.getByLabel('Giá', { exact: true }).fill('65000');
    await dialog.getByRole('button', { name: 'Lưu', exact: true }).click();
    await expect(row).toContainText(tenSauSua, { timeout: 10_000 });

    await row.getByRole('button', { name: 'Xóa món' }).click();
    const confirm = page.getByRole('dialog', { name: 'Xóa món ăn?' });
    await confirm.getByRole('button', { name: 'Xóa', exact: true }).click();
    await expect(row).toHaveCount(0, { timeout: 10_000 });
  });
});
