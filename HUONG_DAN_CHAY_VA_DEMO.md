# Hướng dẫn chạy, demo và bàn giao

## 1. Yêu cầu máy

- Node.js 24 khuyến nghị.
- npm.
- MySQL 8.x.
- Chromium nếu chạy Playwright.

## 2. Tạo database từ source chuẩn

Từ thư mục gốc:

```bash
mysql -u root -p < co-so-du-lieu/quan_ly_nha_hang_mysql.sql
```

Không cần chạy `prisma pull` trong quy trình thông thường. Prisma schema đã được quản lý cùng source và phải bám SQL chuẩn.

## 3. Cấu hình Backend

```bash
cd may-chu
cp .env.example .env
```

Ví dụ các biến bắt buộc:

```env
NODE_ENV=development
PORT=8080
DATABASE_URL=mysql://root:MAT_KHAU@127.0.0.1:3306/quan_ly_nha_hang

JWT_ACCESS_SECRET=CHUOI_NGAU_NHIEN_DAI_IT_NHAT_32_KY_TU
JWT_REFRESH_SECRET=CHUOI_NGAU_NHIEN_KHAC_DAI_IT_NHAT_32_KY_TU

SEED_ADMIN_EMAIL=admin@example.local
SEED_ADMIN_PASSWORD=MAT_KHAU_ADMIN_MANH
SEED_ADMIN_HO_TEN=Quan tri vien
```

Không commit file `.env` thật.

## 4. Cài và chạy Backend

```bash
cd may-chu
npm ci
npm run prisma:generate
npm run seed
npm run start:dev
```

Kiểm tra:

```text
API      http://localhost:8080/api/v1
Swagger  http://localhost:8080/api/tai-lieu
Health   http://localhost:8080/api/v1/suc-khoe
```

## 5. Cài và chạy Frontend

Terminal khác:

```bash
cd may-khach
cp .env.example .env
npm ci
npm run dev
```

`.env` frontend mặc định:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_TEN_NHA_HANG=Nhà hàng
```

Mở `http://localhost:5173`.

## 6. Seed dữ liệu trình diễn

Backend `.env` phải trỏ MySQL local.

```bash
cd may-chu
DEMO_SEED_CONFIRM=YES npm run seed:demo
```

Tùy chọn nếu muốn public chỉ hiện bộ dữ liệu demo:

```bash
DEMO_SEED_CONFIRM=YES \
DEMO_ISOLATE_PUBLIC_MENU=YES \
DEMO_ISOLATE_PUBLIC_BOOKING=YES \
npm run seed:demo
```

Các chế độ isolate không xóa lịch sử; chúng chỉ chuyển dữ liệu cũ khỏi trạng thái public/phục vụ.

## 7. Kịch bản demo đề xuất

Thứ tự ngắn gọn:

1. Trang chủ và thực đơn public.
2. Đặt bàn: chọn ngày, khung giờ, số người và bàn.
3. Đăng ký/đăng nhập khách; xem lịch sử đặt bàn, hồ sơ, đánh giá và thông báo.
4. Đăng nhập Admin.
5. Dashboard.
6. Quản lý booking và chuyển trạng thái.
7. Khu vực/bàn/danh mục/món/khuyến mãi.
8. Khách hàng/nhân viên/RBAC.
9. Đánh giá và phản hồi.
10. Báo cáo và nhật ký.

## 8. Kiểm tra trước khi nộp

```bash
cd may-chu
npm run prisma:generate
npm run build
npm test -- --runInBand
npm run security:audit

cd ../may-khach
npm run typecheck
npm run build
npm run security:audit
```

Khi Backend đang chạy:

```bash
cd ../may-chu
npm run test:smoke
npm run test:concurrency
```

Full E2E:

```bash
cd ../may-khach
npm run build
npm run test:e2e
```

## 9. Những điều không làm

- Không commit `.env`, mật khẩu thật hoặc token.
- Không chạy seed demo trên production.
- Không dùng `prisma pull` như bước khởi động hằng ngày.
- Không sửa SQL và Prisma lệch nhau.
- Không thêm backend thứ hai.
- Không đưa field `snake_case` từ database sang frontend.
- Không lưu refresh token trong JSON/localStorage; refresh token dùng HttpOnly cookie.
- Không bỏ qua lỗi test/build trước khi bàn giao.

## 10. CI

Repository có ba workflow:

- `quality-gate.yml`: backend build + unit và frontend build.
- `security-audit.yml`: npm audit cho backend/frontend.
- `integration-e2e.yml`: MySQL 8.4 + seed + API smoke + booking concurrency + Playwright.

Đây là gate tham chiếu khi merge vào `main`.
