# Hệ thống quản lý nhà hàng và đặt bàn

Đồ án web quản lý nhà hàng gồm Backend NestJS, Frontend React và MySQL. Repository này chứa một hệ thống thống nhất; không có backend/frontend thay thế song song.

## Cấu trúc chính

```text
quanlyquanan/
├── co-so-du-lieu/
│   └── quan_ly_nha_hang_mysql.sql
├── may-chu/       # NestJS + Prisma + MySQL
├── may-khach/     # React + TypeScript + Vite + Ant Design
└── .github/
    └── workflows/
```

Nguồn chuẩn của database là `co-so-du-lieu/quan_ly_nha_hang_mysql.sql`. Prisma schema trong `may-chu/prisma/schema.prisma` phải đồng nhất với SQL.

## Công nghệ

- Backend: NestJS 11, Prisma 7, MySQL 8.x, Argon2, JWT, Swagger.
- Frontend: React 19, TypeScript, Vite 8, Ant Design 6, TanStack Query.
- Kiểm thử: Jest, Playwright.
- CI: build/unit, security audit, MySQL integration + E2E.

Khuyến nghị dùng Node.js 24 và npm đi kèm.

## Khởi động nhanh

### 1. Database

```bash
cd ~/Downloads/quanlyquanan
mysql -u root -p < co-so-du-lieu/quan_ly_nha_hang_mysql.sql
```

### 2. Backend

```bash
cd ~/Downloads/quanlyquanan/may-chu
cp .env.example .env
```

Sửa tối thiểu trong `.env`:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`

Sau đó:

```bash
npm ci
npm run prisma:generate
npm run seed
npm run start:dev
```

Backend mặc định:

- API: `http://localhost:8080/api/v1`
- Swagger: `http://localhost:8080/api/tai-lieu`
- Health: `http://localhost:8080/api/v1/suc-khoe`

### 3. Frontend

Mở terminal khác:

```bash
cd ~/Downloads/quanlyquanan/may-khach
cp .env.example .env
npm ci
npm run dev
```

Frontend mặc định: `http://localhost:5173`.

## Dữ liệu demo

Chỉ chạy trên MySQL local, không dùng cho production:

```bash
cd ~/Downloads/quanlyquanan/may-chu
DEMO_SEED_CONFIRM=YES npm run seed:demo
```

Seed demo có kiểm tra an toàn và từ chối production, database CI hoặc MySQL không phải localhost.

## Quality gate

Backend:

```bash
cd may-chu
npm run prisma:generate
npm run build
npm test -- --runInBand
npm run security:audit
```

Frontend:

```bash
cd may-khach
npm run typecheck
npm run build
npm run security:audit
```

Runtime smoke/concurrency khi backend đang chạy:

```bash
cd may-chu
npm run test:smoke
npm run test:concurrency
```

Full browser E2E:

```bash
cd may-khach
npm run build
npm run test:e2e
```

## Nghiệp vụ chính

Hệ thống hiện có:

- xác thực, refresh cookie HttpOnly, đổi/quên/đặt lại mật khẩu;
- RBAC vai trò/quyền;
- khách hàng và nhân viên;
- khu vực, bàn ăn, ghép/tìm bàn;
- giờ hoạt động và ngày đặc biệt;
- đặt bàn, workflow trạng thái và chống double-booking;
- danh mục món, món ăn và tải ảnh;
- khuyến mãi;
- đánh giá và phản hồi;
- thông báo;
- dashboard, báo cáo và nhật ký hoạt động;
- giao diện public, tài khoản khách hàng và quản trị.

<!-- PHASE10_FINANCE_HANDOFF -->
## Luồng đặt bàn có món và thanh toán

Luồng public hiện hỗ trợ đặt bàn thuần hoặc chọn món trước:

```text
Thông tin & thời gian
→ Chọn bàn
→ Chọn món trước (tùy chọn)
→ Ưu đãi & thanh toán
→ Hoàn tất
```

Các nguyên tắc chính:

- giá món, mã ưu đãi, tiền cọc và tổng thanh toán trước do Backend tính lại; Frontend không phải nguồn quyết định số tiền;
- mã ưu đãi áp dụng trên giá trị món đặt trước, không áp dụng cho booking chỉ giữ bàn;
- booking có số tiền cần thu sẽ sinh payment intent;
- môi trường demo hỗ trợ phương thức `MO_PHONG`; production không tự bật mô phỏng thanh toán;
- thanh toán thành công có idempotency và tự xác nhận booking đang chờ;
- payment quá hạn được hủy và giải phóng bàn;
- hủy booking đủ điều kiện có thể sinh hoàn tiền; `MO_PHONG` hoàn ngay, gateway thật có thể để trạng thái chờ xử lý;
- Dashboard/Báo cáo dùng thời điểm thu/hoàn tiền thực tế và quy đổi ngày theo múi giờ Việt Nam.

Database hiện có 27 model/table, bao gồm `chi_tiet_dat_mon`, `thanh_toan` và `hoan_tien`. Với database đã tồn tại từ bản cũ, dùng migration `co-so-du-lieu/20260813_phase10a_dat_mon_thanh_toan.sql`; với database mới, import trực tiếp SQL chuẩn.

## Quy ước contract

- MySQL dùng `snake_case`.
- API response được chuẩn hóa sang `camelCase`.
- ID `BIGINT` đi ra API/frontend dưới dạng `string`.
- Frontend không dùng field DB `snake_case`.
- Các trạng thái hữu hạn dùng union type, không dùng `string` tùy ý.
- Không dùng `$queryRawUnsafe` hoặc `$executeRawUnsafe`.

## Tài liệu lịch sử

Các file tên `PHẦN ...`, `PHAN_...` là tài liệu/spec theo từng giai đoạn phát triển và có thể mô tả trạng thái cũ. Khi có khác biệt, ưu tiên theo thứ tự:

1. SQL hiện tại.
2. Prisma schema và source hiện tại.
3. README này và `HUONG_DAN_CHAY_VA_DEMO.md`.
4. Tài liệu lịch sử.

Xem hướng dẫn trình diễn và bàn giao tại `HUONG_DAN_CHAY_VA_DEMO.md`.


### Phase 10Q — quota sử dụng khuyến mãi

Khuyến mãi hỗ trợ `so_luot_toi_da` (tổng lượt) và
`so_luot_moi_khach` (giới hạn theo số điện thoại). Bảng
`su_dung_khuyen_mai` lưu ledger `DA_GIU` / `DA_DUNG` / `DA_HUY`;
`DA_GIU` và `DA_DUNG` cùng chiếm quota, còn `DA_HUY` đã trả lượt.

Khi tạo booking, backend khóa promotion row bằng `FOR UPDATE` trước khi
giữ quota, vì vậy hai khách tranh lượt cuối chỉ một booking được giữ.
Thanh toán thành công chuyển `DA_GIU -> DA_DUNG`; timeout hoặc hủy trước
khi sử dụng chuyển `DA_GIU -> DA_HUY`. Quote chỉ kiểm tra quota để báo
sớm cho giao diện; transaction tạo booking vẫn là nguồn quyết định cuối
cùng. Schema hiện có **27 Prisma models / 27 bảng MySQL**.
