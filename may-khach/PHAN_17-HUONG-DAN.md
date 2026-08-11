# Phần 17 — RBAC Frontend + bắt buộc đổi mật khẩu

## 17A Backend

- `/xac-thuc/thong-tin-hien-tai` trả `quyen: string[]`.
- `JwtGuard` chặn API nghiệp vụ khi `bat_buoc_doi_mat_khau = true`.
- Chỉ cho phép thông tin hiện tại, đổi mật khẩu và đăng xuất trong trạng thái bắt buộc đổi mật khẩu.
- Unit test cho `JwtGuard`.
- Smoke test xác nhận Admin nhận quyền `DASHBOARD_XEM`.

## 17B Frontend core

- `NguoiDungHienTai.quyen`.
- `useXacThuc().coQuyen()`.
- `useXacThuc().coTatCaQuyen()`.
- Menu quản trị lọc theo quyền.
- Route quản trị trả 403 trước khi mount trang không có quyền.
- Sau đăng nhập, tài khoản bắt buộc đổi mật khẩu đi thẳng tới `/tai-khoan/doi-mat-khau`.
- Mọi protected route khác redirect tới trang đổi mật khẩu khi cờ bắt buộc đang bật.
- Đổi mật khẩu thành công sẽ xóa phiên và yêu cầu đăng nhập lại.
- E2E mock quyền hạn chế và forced-password flow.

## Kiểm tra

```bash
cd ~/Downloads/quanlyquanan/may-khach
npm run build

npx playwright test \
  --project=chromium-desktop \
  --workers=1 \
  e2e/sau/rbac-va-doi-mat-khau.spec.ts

npm run test:e2e:deep
npx playwright test --workers=1
```
