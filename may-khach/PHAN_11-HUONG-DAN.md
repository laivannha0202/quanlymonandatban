# PHẦN 11 — Frontend nghiệp vụ mở rộng + code splitting

Patch này được áp dụng **trực tiếp vào `may-khach/`**. Không tạo thêm thư mục `may-khach` thứ hai.

## Nội dung

- Lazy loading toàn bộ route bằng `React.lazy` + `Suspense` để giảm bundle khởi động.
- Trang public khuyến mãi.
- Đặt lại mật khẩu.
- Tài khoản khách hàng: thông báo, đổi mật khẩu, tạo đánh giá sau lượt đặt đã hoàn thành.
- Admin: danh mục món CRUD.
- Admin: khuyến mãi CRUD.
- Admin: quản trị đánh giá, phản hồi và ẩn/hiện.
- Admin: báo cáo đặt bàn / khách hàng / đánh giá.
- Admin: vai trò & phân quyền.
- Admin: nhật ký hoạt động.
- Mở rộng menu public và menu admin.
- Bổ sung CSS responsive cho các màn hình mới.

## Cài đặt

Tại root project:

```bash
cd ~/Downloads/quanlyquanan
cp -a phan11_frontend_patch/. may-khach/
rm -rf phan11_frontend_patch
cd may-khach
npm run build
```

Không cần `npm install` vì Phần 11 không thêm dependency.

Nếu build xanh:

```bash
npm run dev
```

Backend phải đang chạy ở port 8080.

## Route mới

Public:
- `/khuyen-mai`
- `/dat-lai-mat-khau`

Khách hàng:
- `/tai-khoan/danh-gia`
- `/tai-khoan/thong-bao`
- `/tai-khoan/doi-mat-khau`

Admin:
- `/quan-tri/danh-muc-mon`
- `/quan-tri/khuyen-mai`
- `/quan-tri/danh-gia`
- `/quan-tri/bao-cao`
- `/quan-tri/vai-tro`
- `/quan-tri/nhat-ky`

## Lưu ý

- `QUAN_TRI_VIEN` không được chỉnh quyền từ backend; UI cũng khóa thao tác này.
- Trang đánh giá của khách chỉ cho gửi đánh giá trên booking `DA_HOAN_THANH`; backend vẫn là lớp xác thực nghiệp vụ cuối cùng.
- Link thông báo booking được quy về trang lịch đặt bàn hiện tại vì Frontend chưa có màn chi tiết booking riêng.
