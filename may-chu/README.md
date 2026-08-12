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
