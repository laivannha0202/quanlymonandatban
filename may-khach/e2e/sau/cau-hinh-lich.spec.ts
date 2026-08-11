import { expect, test } from '@playwright/test';
import { dangNhapQuanTri, layThongTinAdmin, maDuyNhat } from '../tro-giup';

const admin = layThongTinAdmin();

function ngayDacBietE2E(): string {
  const date = new Date(Date.UTC(2050, 0, 1));
  date.setUTCDate(date.getUTCDate() + (Date.now() % 8000));
  return date.toISOString().slice(0, 10);
}

test.describe('Cấu hình vận hành', () => {
  test.skip(!admin, 'Thiếu thông tin Admin E2E');

  test('sửa rồi khôi phục tên nhà hàng', async ({ page }) => {
    await dangNhapQuanTri(page);
    await page.goto('/quan-tri/cau-hinh');
    await expect(page.getByRole('heading', { name: 'Cấu hình hệ thống', exact: true })).toBeVisible();

    const input = page.getByLabel('Tên hiển thị của nhà hàng', { exact: true });
    const giaTriGoc = await input.inputValue();
    const giaTriTam = `${giaTriGoc || 'Nhà hàng'} E2E`;

    await input.fill(giaTriTam);
    await page.getByRole('button', { name: 'Lưu cấu hình', exact: true }).click();
    await expect(page.getByText('Đã lưu cấu hình', { exact: true }).last()).toBeVisible();

    await input.fill(giaTriGoc);
    await page.getByRole('button', { name: 'Lưu cấu hình', exact: true }).click();
    await expect(page.getByText('Đã lưu cấu hình', { exact: true }).last()).toBeVisible();
  });

  test('sửa ghi chú ca hoạt động rồi khôi phục', async ({ page }) => {
    await dangNhapQuanTri(page);
    await page.goto('/quan-tri/gio-hoat-dong');
    await expect(page.getByRole('heading', { name: 'Giờ hoạt động', exact: true })).toBeVisible();

    const row = page.locator('tbody tr.ant-table-row').first();
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: 'Sửa', exact: true }).click();

    let dialog = page.getByRole('dialog', { name: 'Sửa ca hoạt động' });
    const ghiChu = dialog.getByLabel('Ghi chú', { exact: true });
    const giaTriGoc = await ghiChu.inputValue();

    await ghiChu.fill(`${giaTriGoc} E2E`.trim());
    await dialog.getByRole('button', { name: 'Lưu', exact: true }).click();
    await expect(page.getByText('Đã lưu ca hoạt động', { exact: true }).last()).toBeVisible();

    await row.getByRole('button', { name: 'Sửa', exact: true }).click();
    dialog = page.getByRole('dialog', { name: 'Sửa ca hoạt động' });
    await dialog.getByLabel('Ghi chú', { exact: true }).fill(giaTriGoc);
    await dialog.getByRole('button', { name: 'Lưu', exact: true }).click();
    await expect(page.getByText('Đã lưu ca hoạt động', { exact: true }).last()).toBeVisible();
  });

  test('CRUD ngày đặc biệt không để lại dữ liệu test', async ({ page }) => {
    const ngay = ngayDacBietE2E();
    const ten = `Ngày E2E ${maDuyNhat('NDB')}`;
    const tenSua = `${ten} sửa`;

    await dangNhapQuanTri(page);
    await page.goto('/quan-tri/ngay-dac-biet');
    await expect(page.getByRole('heading', { name: 'Ngày đặc biệt', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Thêm ngày đặc biệt', exact: true }).click();
    let dialog = page.getByRole('dialog', { name: 'Thêm ngày đặc biệt' });
    await dialog.getByLabel('Ngày', { exact: true }).fill(ngay);
    await dialog.getByLabel('Tên sự kiện', { exact: true }).fill(ten);
    await dialog.getByRole('button', { name: 'Lưu', exact: true }).click();

    const row = page.locator('tr').filter({ hasText: ten });
    await expect(row).toBeVisible({ timeout: 10_000 });

    await row.getByRole('button', { name: 'Sửa', exact: true }).click();
    dialog = page.getByRole('dialog', { name: 'Sửa ngày đặc biệt' });
    await dialog.getByLabel('Tên sự kiện', { exact: true }).fill(tenSua);
    await dialog.getByRole('button', { name: 'Lưu', exact: true }).click();
    await expect(row).toContainText(tenSua, { timeout: 10_000 });

    await row.getByRole('button', { name: `Xóa ngày đặc biệt ${ngay}`, exact: true }).click();
    const confirm = page.getByRole('dialog', { name: 'Xóa ngày đặc biệt?' });
    await confirm.getByRole('button', { name: 'Xóa', exact: true }).click();
    await expect(row).toHaveCount(0, { timeout: 10_000 });
  });
});
