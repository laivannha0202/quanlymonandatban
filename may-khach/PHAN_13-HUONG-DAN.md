# PHẦN 13 — UI/UX + CRUD vận hành cốt lõi

Patch này áp trực tiếp vào `may-khach/`, KHÔNG chứa thư mục `may-khach` lồng bên trong và KHÔNG thay Backend.

## Mục tiêu

- Responsive navigation cho trang khách và khu quản trị bằng Ant Design Drawer/Menu/Grid.
- Error Boundary toàn ứng dụng và trang 403 rõ ràng.
- Breadcrumb quản trị.
- Component dùng chung: tiêu đề trang, cảnh báo lỗi, định dạng tiền.
- TanStack Query cho các màn vận hành cốt lõi thay cho `useEffect + loading/error state` thủ công.
- CRUD khu vực.
- CRUD bàn ăn.
- Quản lý cặp bàn được phép ghép.
- CRUD món ăn.
- Quản lý gallery món bằng URL/path theo đúng API Backend hiện có.
- Trang chi tiết món public `/thuc-don/:duongDan`.
- Thực đơn public click được vào chi tiết món.
- Chuẩn hóa lại trang đặt bàn Admin, khách hàng và nhân viên sang Query pattern.

## Không thêm dependency

Phần 13 chỉ dùng các thư viện đã cài từ Phần 12:

- Ant Design 6
- @ant-design/icons
- TanStack Query
- Day.js
- React Router

Do đó KHÔNG cần chạy `npm install` chỉ vì patch này.

## Gộp patch

Từ root project:

```bash
cd ~/Downloads/quanlyquanan
cp -a phan13_frontend_crud_ui_patch/. may-khach/
rm -rf phan13_frontend_crud_ui_patch
rm -f ~/Downloads/phan13_frontend_crud_ui_patch.zip
```

Sau đó:

```bash
cd ~/Downloads/quanlyquanan/may-khach
npm run build
```

Nếu build sạch:

```bash
npm run dev
```

Backend phải đang chạy tại port 8080 để test API thật.

## Route mới

- `/thuc-don/:duongDan`
- `/quan-tri/khu-vuc`

## Test UI nhanh sau khi chạy

1. Mở trang khách trên desktop và mobile width; menu mobile phải mở bằng Drawer.
2. `/thuc-don` → bấm một món → vào trang chi tiết món.
3. `/quan-tri/khu-vuc` → xem danh sách, mở form thêm/sửa.
4. `/quan-tri/ban-an` → tab Bàn ăn và Liên kết ghép bàn.
5. `/quan-tri/mon-an` → thêm/sửa món; mở quản lý ảnh; thêm URL ảnh.
6. `/quan-tri/dat-ban` → workflow đặt bàn vẫn hoạt động.

## Lưu ý hình ảnh

Backend hiện quản lý hình món bằng URL/path (`duongDanAnh`) chứ chưa có endpoint upload file/binary lên storage. Frontend vì vậy KHÔNG giả upload file. Khi Backend có storage endpoint (local/S3/Cloudinary...), có thể nối Ant Design Upload ở vòng sau.
