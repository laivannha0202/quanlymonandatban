import { expect, test } from '@playwright/test';
import {
  dangNhapQuanTri,
  layThongTinAdmin,
  soDienThoaiDuyNhat,
  timKhungGioConBan,
} from '../tro-giup';

const admin = layThongTinAdmin();

test.describe('Đặt bàn E2E xuyên Public → Admin', () => {
  test.skip(!admin, 'Thiếu thông tin Admin E2E');

  test('khách tạo booking → admin xác nhận → admin hủy', async ({ page, request }) => {
    const khung = await timKhungGioConBan(request);
    test.skip(!khung, 'Không tìm được khung giờ còn bàn trong 14 ngày tới.');

    const hoTen = `Khách E2E ${Date.now().toString(36)}`;
    const soDienThoai = soDienThoaiDuyNhat();

    await page.goto('/dat-ban');
    await page.getByLabel('Họ tên', { exact: true }).fill(hoTen);
    await page.getByLabel('Số điện thoại', { exact: true }).fill(soDienThoai);

    const doiKhungGio = page.waitForResponse((res) => res.url().includes('/dat-ban/khung-gio') && res.ok());
    await page.getByLabel('Ngày', { exact: true }).fill(khung!.ngay);
    await doiKhungGio;

    const chonGio = page.getByLabel('Giờ', { exact: true });
    await chonGio.click();

    const dropdownGio = page.locator('.ant-select-dropdown:visible');
    await expect(dropdownGio).toBeVisible();

    const optionGio = dropdownGio
      .locator('.ant-select-item-option')
      .filter({ hasText: khung!.gio })
      .first();

    await optionGio.click();
    await page.getByLabel('Số người', { exact: true }).fill('2');
    await page.getByRole('button', { name: 'Xác nhận đặt bàn', exact: true }).click();

    await expect(page.getByText('Đã nhận yêu cầu đặt bàn', { exact: true })).toBeVisible({ timeout: 10_000 });
    const maText = await page.getByText(/Mã đặt bàn:/).textContent();
    const maDatBan = maText?.match(/DB[A-Z0-9-]+/i)?.[0];
    expect(maDatBan, `Không đọc được mã đặt bàn từ: ${maText}`).toBeTruthy();

    await dangNhapQuanTri(page);
    await page.goto('/quan-tri/dat-ban');
    const timKiem = page.getByPlaceholder('Mã / tên / số điện thoại');
    await timKiem.fill(maDatBan!);
    await timKiem.press('Enter');

    const row = page.locator('tr').filter({ hasText: maDatBan! });
    await expect(row).toBeVisible({ timeout: 10_000 });
    await expect(row).toContainText('Chờ xác nhận');

    await row.getByRole('button', { name: 'Xác nhận', exact: true }).click();
    await expect(row).toContainText('Đã xác nhận', { timeout: 10_000 });

    await row.getByRole('button', { name: 'Hủy', exact: true }).click();
    const confirm = page.getByRole('dialog', { name: 'Hủy đặt bàn?' });
    await confirm.getByRole('button', { name: 'Hủy đặt bàn', exact: true }).click();
    await expect(row).toContainText('Đã hủy', { timeout: 10_000 });
  });
});
