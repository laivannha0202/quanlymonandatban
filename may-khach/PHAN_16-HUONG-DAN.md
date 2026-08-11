# Phần 16 — Cấu hình vận hành + quản trị khách hàng/nhân viên

## Hoàn thiện

- Cấu hình hệ thống.
- Giờ hoạt động nhiều ca và chặn ca chồng lấn.
- CRUD ngày đặc biệt.
- Khách hàng: lọc, sửa hồ sơ, khóa/mở khóa/ngừng hoạt động.
- Nhân viên: tạo tài khoản, sửa hồ sơ, vai trò, mật khẩu, trạng thái.
- Đồng bộ email khách hàng với tài khoản liên kết.
- Chặn người quản trị tự hạ vai trò của chính tài khoản đang đăng nhập.
- E2E cho các bề mặt Phần 16.

## Kiểm tra

```bash
cd ~/Downloads/quanlyquanan/may-chu
npm run build
npm test -- --runInBand
```

Giữ Backend chạy rồi:

```bash
cd ~/Downloads/quanlyquanan/may-khach
npm run build
npm run test:e2e:deep
npx playwright test --workers=1
```
