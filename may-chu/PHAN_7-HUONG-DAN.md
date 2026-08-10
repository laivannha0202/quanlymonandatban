# PHẦN 7 — ĐẶT BÀN THẬT + TRANSACTION + WORKFLOW

Patch này chỉ chứa file mới/thay đổi, KHÔNG chứa một project `may-chu` thứ hai.

## Cài patch

Đứng trong Backend canonical:

```bash
cd ~/Downloads/quanlyquanan/may-chu
unzip -o ~/Downloads/phan7_dat_ban_patch.zip -d .
```

Sau đó:

```bash
npm run prisma:generate
npm run build
npm test -- --runInBand
npm run start:dev
```

Không chạy `prisma:pull` vì Phần 7 không thay database.

## API mới

Public:
- `POST /api/v1/dat-ban`
- `POST /api/v1/dat-ban/tra-cuu`

Khách đã đăng nhập:
- `GET /api/v1/khach-hang/dat-ban`
- `GET /api/v1/khach-hang/dat-ban/:id`
- `PATCH /api/v1/khach-hang/dat-ban/:id/huy`

Admin/Nhân viên:
- `GET /api/v1/quan-tri/dat-ban`
- `POST /api/v1/quan-tri/dat-ban`
- `GET /api/v1/quan-tri/dat-ban/:id`
- `PATCH /api/v1/quan-tri/dat-ban/:id`
- `PATCH /api/v1/quan-tri/dat-ban/:id/sap-ban`
- `PATCH /api/v1/quan-tri/dat-ban/:id/xac-nhan`
- `PATCH /api/v1/quan-tri/dat-ban/:id/check-in`
- `PATCH /api/v1/quan-tri/dat-ban/:id/hoan-thanh`
- `PATCH /api/v1/quan-tri/dat-ban/:id/huy`
- `PATCH /api/v1/quan-tri/dat-ban/:id/khong-den`

## Double booking

Luồng tạo booking khóa hàng `ban_an` bằng `SELECT ... FOR UPDATE`, sau đó kiểm tra lại booking giao nhau bằng locking read ngay trong cùng transaction. Hai request cùng tranh một bàn sẽ bị tuần tự hóa; request thứ hai phải nhận HTTP 409 `DAT_BAN_002` sau khi request thứ nhất commit.

## Test tay concurrency

1. Dùng `/ban-an/tim-ban-trong` tìm một bàn còn trống ở ngày/giờ tương lai.
2. Tạo hai file JSON cùng `banAnIds` nhưng số điện thoại khác nhau.
3. Gửi song song:

```bash
curl -s -o /tmp/a.out -w "%{http_code}" -X POST http://localhost:8080/api/v1/dat-ban \
  -H 'Content-Type: application/json' --data @/tmp/a.json &

curl -s -o /tmp/b.out -w "%{http_code}" -X POST http://localhost:8080/api/v1/dat-ban \
  -H 'Content-Type: application/json' --data @/tmp/b.json &

wait
cat /tmp/a.out
cat /tmp/b.out
```

Kỳ vọng: một request thành công, request còn lại trả `409` với `DAT_BAN_002`.
