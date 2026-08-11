import { expect, test, type Page } from '@playwright/test';

type NguoiDungMock = {
  id: string;
  tenDangNhap: string;
  email: string | null;
  trangThai: string;
  batBuocDoiMatKhau: boolean;
  lanDangNhapCuoi: string | null;
  vaiTro: {
    id: string;
    maVaiTro: string;
  };
  quyen: string[];
};

async function taoPhienGia(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'nha_hang_phien_v1',
      JSON.stringify({
        accessToken: 'access-e2e-rbac',
        refreshToken: 'refresh-e2e-rbac',
        loaiToken: 'Bearer',
        accessHetHanSauGiay: 900,
      }),
    );
  });
}

async function mockHienTai(
  page: Page,
  nguoiDung: NguoiDungMock,
) {
  await page.route(
    '**/api/v1/xac-thuc/thong-tin-hien-tai',
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          thanhCong: true,
          duLieu: nguoiDung,
        }),
      });
    },
  );
}

test.describe('RBAC frontend và bắt buộc đổi mật khẩu', () => {
  test('nhân viên chỉ thấy menu được cấp quyền và route bị chặn trả 403', async ({ page }) => {
    await taoPhienGia(page);

    await mockHienTai(page, {
      id: '200',
      tenDangNhap: 'nhan-vien-e2e',
      email: 'nhan-vien-e2e@example.local',
      trangThai: 'HOAT_DONG',
      batBuocDoiMatKhau: false,
      lanDangNhapCuoi: null,
      vaiTro: {
        id: '2',
        maVaiTro: 'NHAN_VIEN',
      },
      quyen: ['KHACH_HANG_XEM'],
    });

    await page.route(
      '**/api/v1/quan-tri/khach-hang**',
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            thanhCong: true,
            duLieu: {
              danhSach: [],
              phanTrang: {
                trang: 1,
                kichThuoc: 100,
                tong: 0,
                tongTrang: 0,
              },
            },
          }),
        });
      },
    );

    await page.goto('/quan-tri/khach-hang');

    await expect(
      page.getByRole('heading', {
        name: 'Khách hàng',
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      page.getByText('Khách hàng', { exact: true }).first(),
    ).toBeVisible();

    await expect(
      page.getByText('Cấu hình', { exact: true }),
    ).toHaveCount(0);

    await expect(
      page.getByText('Nhân viên', { exact: true }),
    ).toHaveCount(0);

    await page.goto('/quan-tri/cau-hinh');

    await expect(
      page.getByText(
        'Không có quyền truy cập chức năng này.',
        { exact: true },
      ),
    ).toBeVisible();
  });

  test('tài khoản bắt buộc đổi mật khẩu bị chuyển hướng và logout sau khi đổi thành công', async ({ page }) => {
    await taoPhienGia(page);

    await mockHienTai(page, {
      id: '201',
      tenDangNhap: 'doi-mat-khau-e2e',
      email: 'doi-mat-khau-e2e@example.local',
      trangThai: 'HOAT_DONG',
      batBuocDoiMatKhau: true,
      lanDangNhapCuoi: null,
      vaiTro: {
        id: '2',
        maVaiTro: 'NHAN_VIEN',
      },
      quyen: ['DASHBOARD_XEM'],
    });

    await page.route(
      '**/api/v1/xac-thuc/doi-mat-khau',
      async (route) => {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            thanhCong: true,
            duLieu: {
              thongBao:
                'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.',
            },
          }),
        });
      },
    );

    await page.route(
      '**/api/v1/xac-thuc/dang-xuat',
      async (route) => {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            thanhCong: true,
            duLieu: {
              thongBao: 'Đăng xuất thành công.',
            },
          }),
        });
      },
    );

    await page.goto('/quan-tri');

    await page.waitForURL(
      /\/tai-khoan\/doi-mat-khau$/,
      { timeout: 10_000 },
    );

    await expect(
      page.getByText(
        'Bạn phải đổi mật khẩu trước khi tiếp tục sử dụng hệ thống.',
        { exact: true },
      ),
    ).toBeVisible();

    await page
      .getByLabel('Mật khẩu hiện tại', { exact: true })
      .fill('MatKhauCu123!');

    await page
      .getByLabel('Mật khẩu mới', { exact: true })
      .fill('MatKhauMoi456!');

    await page
      .getByLabel('Nhập lại mật khẩu mới', { exact: true })
      .fill('MatKhauMoi456!');

    await page
      .getByRole('button', {
        name: 'Lưu mật khẩu mới',
        exact: true,
      })
      .click();

    await page.waitForURL(
      /\/dang-nhap$/,
      { timeout: 10_000 },
    );

    const phien = await page.evaluate(() =>
      window.localStorage.getItem(
        'nha_hang_phien_v1',
      ),
    );

    expect(phien).toBeNull();
  });
});

// RBAC_ACTIONS_PHASE17
test.describe('RBAC thao tác chi tiết', () => {
  test('quyền chỉ xem khu vực không hiển thị nút tạo sửa xóa', async ({ page }) => {
    await taoPhienGia(page);

    await mockHienTai(page, {
      id: '202',
      tenDangNhap: 'khu-vuc-readonly',
      email: 'khu-vuc-readonly@example.local',
      trangThai: 'HOAT_DONG',
      batBuocDoiMatKhau: false,
      lanDangNhapCuoi: null,
      vaiTro: {
        id: '20',
        maVaiTro: 'NHAN_VIEN',
      },
      quyen: ['KHU_VUC_XEM'],
    });

    await page.route(
      '**/api/v1/quan-tri/khu-vuc**',
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            thanhCong: true,
            duLieu: [{
              id: '1',
              maKhuVuc: 'KV_E2E',
              tenKhuVuc: 'Khu vực E2E',
              thuTu: 1,
              trangThai: 'HOAT_DONG',
            }],
          }),
        });
      },
    );

    await page.goto('/quan-tri/khu-vuc');

    await expect(
      page.getByRole('heading', {
        name: 'Khu vực',
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      page.getByRole('button', {
        name: 'Thêm khu vực',
        exact: true,
      }),
    ).toHaveCount(0);

    await expect(
      page.getByRole('button', {
        name: 'Sửa khu vực',
        exact: true,
      }),
    ).toHaveCount(0);

    await expect(
      page.getByRole('button', {
        name: 'Xóa khu vực',
        exact: true,
      }),
    ).toHaveCount(0);
  });

  test('quyền sửa khách hàng không tự cấp quyền khóa khách hàng', async ({ page }) => {
    await taoPhienGia(page);

    await mockHienTai(page, {
      id: '203',
      tenDangNhap: 'khach-hang-editor',
      email: 'khach-hang-editor@example.local',
      trangThai: 'HOAT_DONG',
      batBuocDoiMatKhau: false,
      lanDangNhapCuoi: null,
      vaiTro: {
        id: '21',
        maVaiTro: 'NHAN_VIEN',
      },
      quyen: [
        'KHACH_HANG_XEM',
        'KHACH_HANG_SUA',
      ],
    });

    await page.route(
      '**/api/v1/quan-tri/khach-hang**',
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            thanhCong: true,
            duLieu: {
              danhSach: [{
                id: '10',
                maKhachHang: 'KH_E2E',
                hoTen: 'Khách E2E',
                soDienThoai: '0900000000',
                email: 'khach@example.local',
                trangThai: 'HOAT_DONG',
                tongDatBan: 0,
                tongHoanThanh: 0,
                tongHuy: 0,
                tongKhongDen: 0,
              }],
              phanTrang: {
                trang: 1,
                kichThuoc: 100,
                tong: 1,
                tongTrang: 1,
              },
            },
          }),
        });
      },
    );

    await page.goto('/quan-tri/khach-hang');

    await expect(
      page.getByRole('button', {
        name: 'Sửa khách hàng Khách E2E',
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      page.getByLabel(
        'Trạng thái Khách E2E',
        { exact: true },
      ),
    ).toHaveCount(0);
  });
});
