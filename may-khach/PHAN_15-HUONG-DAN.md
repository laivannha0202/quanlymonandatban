# Phần 15 — E2E sâu CRUD + booking workflow

Patch này bắt đầu trực tiếp từ root `may-khach/`, không chứa `may-khach/` lồng và không đụng Backend.

## Mục tiêu

- Tự đọc Admin E2E từ `../may-chu/.env`, không cần copy/paste mật khẩu vào terminal.
- Test route guard quản trị khi chưa đăng nhập.
- Test validation form đặt bàn.
- CRUD thật qua UI cho khu vực, danh mục món, món ăn, bàn ăn.
- Luồng xuyên hệ thống: khách tạo booking public → Admin tìm booking → xác nhận → hủy.
- Dữ liệu CRUD được xóa ngay cuối test. Booking test kết thúc ở `DA_HUY` vì hệ thống không có API xóa booking lịch sử.
- Test sâu chỉ chạy desktop để tránh hai project cùng tranh một slot/bàn; mobile vẫn giữ suite responsive/public riêng.

## Gộp patch

```bash
cd ~/Downloads/quanlyquanan
cp -a phan15_frontend_deep_e2e_patch/. may-khach/
rm -rf phan15_frontend_deep_e2e_patch
rm -f ~/Downloads/phan15_frontend_deep_e2e_patch.zip
cd may-khach
```

Không cần `npm install` vì không thêm dependency.

## Kiểm tra

```bash
npm run build
```

Backend phải đang chạy ở terminal khác:

```bash
cd ~/Downloads/quanlyquanan/may-chu
npm run start:dev
```

Sau đó chạy suite sâu:

```bash
cd ~/Downloads/quanlyquanan/may-khach
npm run test:e2e:deep
```

Nếu muốn chạy toàn bộ Public + Mobile + Admin + Deep:

```bash
npm run test:e2e
```

## Lưu ý dữ liệu

Các test CRUD dùng mã `E2E...` duy nhất và tự xóa sau khi pass. Test booking tạo một booking thật rồi chuyển đến `DA_HUY` để giữ đúng audit/history của hệ thống; không xóa lịch sử booking.
