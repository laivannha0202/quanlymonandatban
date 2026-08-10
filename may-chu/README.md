# Backend quản lý nhà hàng — Phần 5

Bộ khung chạy NestJS + Prisma ORM 7 + MySQL, bám theo file SQL `../co-so-du-lieu/quan_ly_nha_hang_mysql.sql`.

## 1. Yêu cầu

- Node.js 22/24
- npm
- MySQL 8.x

## 2. Import database

```bash
mysql -u root -p < ../co-so-du-lieu/quan_ly_nha_hang_mysql.sql
```

## 3. Cài package

```bash
npm install
```

## 4. Environment

```bash
cp .env.example .env
```

Điền `DATABASE_URL`, JWT secrets và `SEED_ADMIN_PASSWORD`.

## 5. Introspect database và sinh Prisma Client

```bash
npm run prisma:pull
npm run prisma:generate
```

**Không viết model Prisma khác SQL bằng tay.** Database SQL là nguồn chuẩn.

## 6. Seed Admin

```bash
npm run seed
```

## 7. Chạy development

```bash
npm run start:dev
```

- API: `http://localhost:8080/api/v1`
- Swagger: `http://localhost:8080/api/tai-lieu`
- Health: `http://localhost:8080/api/v1/suc-khoe`

## 8. Endpoint đã có trong Phần 5

```text
POST /api/v1/xac-thuc/dang-ky
POST /api/v1/xac-thuc/dang-nhap
POST /api/v1/xac-thuc/lam-moi-token
POST /api/v1/xac-thuc/dang-xuat
GET  /api/v1/xac-thuc/thong-tin-hien-tai
GET  /api/v1/quan-tri/vai-tro
GET  /api/v1/suc-khoe
```

## 9. Kiến trúc đã cài

- Global ValidationPipe
- Global response wrapper
- Global exception filter
- BigInt -> string serializer
- Request/correlation ID
- Helmet
- CORS
- Global rate limit
- JWT access token
- Rotating refresh token hash
- Argon2 password hash
- Login failure temporary lock
- Permission decorator + guard
- Swagger Bearer auth
- Seed Admin an toàn từ `.env`

## 10. Phần tiếp theo

Phần 6 sẽ thêm:

1. `CauHinhService`
2. `GioHoatDongService`
3. `NgayDacBietService`
4. `KhuVucService`
5. `BanAnService`
6. `TimBanTrongService`
7. `GhepBanService`
8. Unit test engine tìm bàn

Sau đó Phần 7 mới triển khai transaction đặt bàn và chống double-booking.
