# Backend — Quản lý nhà hàng và đặt bàn

Backend NestJS + Prisma + MySQL cho hệ thống quản lý nhà hàng.

## Yêu cầu

- Node.js 24 khuyến nghị.
- npm.
- MySQL 8.x.

## Database

Nguồn chuẩn:

```text
../co-so-du-lieu/quan_ly_nha_hang_mysql.sql
```

Import database:

```bash
mysql -u root -p < ../co-so-du-lieu/quan_ly_nha_hang_mysql.sql
```

Không chạy `prisma pull` như một bước khởi động thông thường. `prisma/schema.prisma` được quản lý cùng source và phải đồng nhất với SQL.

## Cài đặt

```bash
cp .env.example .env
npm ci
npm run prisma:generate
npm run seed
```

Điền `DATABASE_URL`, JWT secrets và tài khoản Admin seed trong `.env`.

## Chạy

```bash
npm run start:dev
```

- API: `http://localhost:8080/api/v1`
- Swagger: `http://localhost:8080/api/tai-lieu`
- Health: `http://localhost:8080/api/v1/suc-khoe`

## Kiểm thử

```bash
npm run prisma:generate
npm run build
npm test -- --runInBand
npm run security:audit
```

Khi API đang chạy:

```bash
npm run test:smoke
npm run test:concurrency
```

## Seed demo local

```bash
DEMO_SEED_CONFIRM=YES npm run seed:demo
```

Script từ chối production, DB CI và MySQL ngoài localhost.

<!-- PHASE10_FINANCE_HANDOFF -->
## Booking, payment và refund

Backend hỗ trợ:

- quote tiền server-side cho món đặt trước + mã ưu đãi + cọc;
- snapshot món/giá/khuyến mãi vào booking;
- payment intent và idempotent payment confirmation;
- payment timeout giải phóng booking/bàn;
- admin payment list, manual confirmation và refund confirmation theo RBAC;
- tự hoàn tiền cho payment `MO_PHONG` khi hủy đủ điều kiện;
- KPI tài chính trên Dashboard/Báo cáo dựa vào thời điểm giao dịch thực tế;
- ngày tài chính quy đổi theo Việt Nam (`UTC+07`) trước khi gom theo ngày.

Production entrypoint sau build là:

```bash
npm run build
npm run start:prod
```

`start:prod` phải trỏ compiled entrypoint `dist/src/main.js` của cấu trúc hiện tại.

Với database đã có từ trước Phase 10, áp dụng migration:

```text
../co-so-du-lieu/20260813_phase10a_dat_mon_thanh_toan.sql
```

## Kiến trúc

Backend hiện có:

- ValidationPipe whitelist/transform.
- Global response normalizer.
- Global exception filter và Prisma error mapping.
- BigInt ID -> string.
- Helmet + CORS + throttling.
- JWT access token.
- rotating refresh token qua HttpOnly cookie.
- Argon2.
- RBAC role/permission.
- Prisma cho CRUD nghiệp vụ.
- tagged `$queryRaw` chỉ ở truy vấn aggregate/readiness phù hợp.
- Swagger.
- upload ảnh.
- unit test + smoke + concurrency test.

Không dùng `$queryRawUnsafe` hoặc `$executeRawUnsafe`.
