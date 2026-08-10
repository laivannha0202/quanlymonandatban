# PHẦN 12 — Chuẩn hóa thư viện UI và giảm code tay

Patch này được gộp trực tiếp vào `may-khach/`. Không có thư mục `may-khach` lồng bên trong.

## Thư viện thêm

- `@ant-design/icons`: icon chính thức của Ant Design.
- `@tanstack/react-query`: quản lý server-state, cache, loading/error/refetch.
- `dayjs`: chuẩn hóa định dạng ngày giờ.

Không thêm `@ant-design/pro-components` ở giai đoạn này vì frontend đang dùng Ant Design 6; ProComponents 3 hiện tài liệu/changelog chính thức vẫn tập trung tương thích Ant Design 5. Tránh ép dependency chỉ để giảm vài dòng code nhưng tạo rủi ro style/runtime.

## Thay đổi

- QueryClientProvider toàn ứng dụng.
- Theme Ant Design gom về một cấu hình duy nhất.
- Dashboard và Thực đơn chuyển sang TanStack Query.
- Menu Admin/Public dùng Ant Design Icons thay cho text thuần.
- Chuẩn hóa format ngày giờ bằng Day.js.
- Làm sạch và nâng chất lượng visual bằng token + CSS mỏng, vẫn ưu tiên component Ant Design.

## Cài

Sau khi gộp patch vào `may-khach`:

```bash
npm install
npm run build
```

Nếu build xanh:

```bash
npm run dev
```
