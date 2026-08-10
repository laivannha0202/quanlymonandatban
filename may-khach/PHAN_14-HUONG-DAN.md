# PHẦN 14 — E2E regression + giảm code fetch tay

Patch áp trực tiếp vào `may-khach/`. Không chứa `may-khach` lồng bên trong và không thay Backend.

## Mục tiêu

- Bổ sung Playwright để test trình duyệt thật thay vì chỉ nhìn UI bằng tay.
- Có regression test desktop + mobile.
- Có test thực đơn gọi Backend thật và mở chi tiết món.
- Có test 404 và Drawer mobile.
- Có test đăng nhập Admin/dashboard nếu cung cấp biến môi trường E2E.
- Chuyển trang khuyến mãi, lịch đặt bàn khách hàng và thông báo sang TanStack Query.
- Gom query key dùng chung để invalidate/refetch chính xác hơn.
- Chuẩn hóa hiển thị ngày giờ bằng Day.js helper hiện có.

## Gộp patch

```bash
cd ~/Downloads/quanlyquanan
cp -a phan14_frontend_e2e_polish_patch/. may-khach/
rm -rf phan14_frontend_e2e_polish_patch
rm -f ~/Downloads/phan14_frontend_e2e_polish_patch.zip
cd may-khach
```

Phần này thêm Playwright nên chạy:

```bash
npm install
npm run build
```

Nếu build sạch, cài Chromium cho Playwright một lần:

```bash
npm run test:e2e:install
```

Backend phải đang chạy ở `http://localhost:8080` trước khi chạy E2E.

Sau đó:

```bash
npm run test:e2e
```

Playwright tự chạy bản production preview của Frontend ở `127.0.0.1:4173`.

## Test Admin tùy chọn

Không lưu mật khẩu thật vào git. Có thể chạy trực tiếp:

```bash
E2E_ADMIN_EMAIL="email-admin" E2E_ADMIN_PASSWORD="mat-khau-admin" npm run test:e2e -- --project=chromium-desktop e2e/quan-tri.spec.ts
```

Nếu không truyền hai biến này, test Admin sẽ SKIP chứ không fail.

## Kỳ vọng

- `npm run build` xanh.
- Public E2E desktop/mobile xanh.
- Test Admin xanh khi truyền đúng credentials.
- `playwright-report/` và `test-results/` chỉ là output test, không phải source.
