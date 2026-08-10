import { expect, test } from '@playwright/test';

test('mobile mở được menu Drawer và đi tới trang đặt bàn', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'), 'Chỉ chạy ở project mobile');
  await page.goto('/');
  const nutMenu = page.getByRole('button', { name: 'Mở menu' });
  await expect(nutMenu).toBeVisible();
  await nutMenu.click();
  await expect(page.getByText('Đặt bàn', { exact: true }).last()).toBeVisible();
  await page.getByText('Đặt bàn', { exact: true }).last().click();
  await expect(page).toHaveURL(/\/dat-ban/);
});
