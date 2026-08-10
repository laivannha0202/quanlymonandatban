# PHẦN 8 — MODULE QUẢN TRỊ / THỰC ĐƠN / BÁO CÁO

Patch này cài trực tiếp vào backend canonical `~/Downloads/quanlyquanan/may-chu`.

## Nguyên tắc

- Không có thư mục `may-chu` thứ hai trong patch.
- Không thay `.env`, `prisma/schema.prisma`, `generated/`, `node_modules/`, `dist/`.
- Không thay các file transaction/workflow đặt bàn Phần 7.
- Không cần import lại SQL và không cần `prisma:pull` vì không thay schema database.
- Không thêm dependency npm mới.

## Cài đặt

```bash
cd ~/Downloads/quanlyquanan
cp -a may-chu may-chu-backup-truoc-phan8

cd may-chu
unzip -o ~/Downloads/phan8_backend_patch.zip -d .

npm run prisma:generate
npm run build
npm test -- --runInBand
npm run start:dev
```

## Module thêm trong Phần 8

### Khách hàng

- `GET /api/v1/khach-hang/ho-so`
- `PATCH /api/v1/khach-hang/ho-so`
- `GET /api/v1/quan-tri/khach-hang`
- `GET /api/v1/quan-tri/khach-hang/:id`
- `PATCH /api/v1/quan-tri/khach-hang/:id`
- `PATCH /api/v1/quan-tri/khach-hang/:id/trang-thai`

### Nhân viên

- `GET /api/v1/quan-tri/nhan-vien`
- `GET /api/v1/quan-tri/nhan-vien/:id`
- `POST /api/v1/quan-tri/nhan-vien`
- `PATCH /api/v1/quan-tri/nhan-vien/:id`
- `PATCH /api/v1/quan-tri/nhan-vien/:id/trang-thai`

Tạo nhân viên đồng thời tạo `tai_khoan`, hash mật khẩu bằng Argon2 và bắt buộc đổi mật khẩu.

### Danh mục món / món ăn / hình ảnh

Public:

- `GET /api/v1/thuc-don/danh-muc`
- `GET /api/v1/thuc-don/mon-an`
- `GET /api/v1/thuc-don/mon-an/:duongDan`

Admin:

- CRUD `/api/v1/quan-tri/danh-muc-mon`
- CRUD `/api/v1/quan-tri/mon-an`
- `POST /api/v1/quan-tri/mon-an/:id/hinh-anh`
- `PATCH /api/v1/quan-tri/mon-an/:id/hinh-anh/:hinhId`
- `DELETE /api/v1/quan-tri/mon-an/:id/hinh-anh/:hinhId`

Hình ảnh hiện quản lý bằng URL/path theo đúng schema `hinh_anh_mon`; upload file vật lý sẽ làm ở lớp storage riêng nếu cần.

### Khuyến mãi

- `GET /api/v1/khuyen-mai/dang-ap-dung`
- CRUD `/api/v1/quan-tri/khuyen-mai`

Có kiểm tra thời gian, loại `PHAN_TRAM` / `SO_TIEN`, giới hạn phần trăm và soft-delete.

### Đánh giá

Public:

- `GET /api/v1/danh-gia`

Khách hàng:

- `POST /api/v1/khach-hang/danh-gia`
- `PATCH /api/v1/khach-hang/danh-gia/:id`
- `DELETE /api/v1/khach-hang/danh-gia/:id`

Chỉ đặt bàn `DA_HOAN_THANH` thuộc chính khách hàng mới được đánh giá và mỗi booking chỉ có một đánh giá.

Admin:

- `GET /api/v1/quan-tri/danh-gia`
- `GET /api/v1/quan-tri/danh-gia/:id`
- `PATCH /api/v1/quan-tri/danh-gia/:id/phan-hoi`
- `PATCH /api/v1/quan-tri/danh-gia/:id/hien-thi`

### Thông báo

- `GET /api/v1/thong-bao`
- `GET /api/v1/thong-bao/chua-doc`
- `PATCH /api/v1/thong-bao/doc-tat-ca`
- `PATCH /api/v1/thong-bao/:id/da-doc`

Mỗi tài khoản chỉ đọc/cập nhật thông báo của chính mình.

### Dashboard

- `GET /api/v1/quan-tri/dashboard?ngay=YYYY-MM-DD`

Tổng hợp trạng thái booking, lượng khách, trạng thái bàn, khách hàng và đánh giá.

### Báo cáo

- `GET /api/v1/quan-tri/bao-cao/dat-ban?tuNgay=YYYY-MM-DD&denNgay=YYYY-MM-DD`
- `GET /api/v1/quan-tri/bao-cao/khach-hang?tuNgay=YYYY-MM-DD&denNgay=YYYY-MM-DD`
- `GET /api/v1/quan-tri/bao-cao/danh-gia?tuNgay=YYYY-MM-DD&denNgay=YYYY-MM-DD`

Khoảng báo cáo tối đa 366 ngày. Database hiện chưa có bảng hóa đơn/đơn hàng/thanh toán, vì vậy Phần 8 không bịa báo cáo doanh thu.

### Nhật ký hoạt động

- `GET /api/v1/quan-tri/nhat-ky`

Có filter theo hành động, đối tượng, tài khoản và request ID.

## Chuẩn response

Phần 8 mang theo bản chuẩn hóa response Phần 7:

- DB/raw SQL `snake_case` -> API `camelCase`.
- `BigInt` ID -> string.
- Prisma `Decimal` giữ cách serialize an toàn, không bung cấu trúc nội bộ `d/e/s`.

Ví dụ:

```json
{
  "maDatBan": "DB20260810-000002",
  "khachHangId": "2",
  "soNguoi": 2
}
```

## Smoke test nhanh

Public:

```bash
curl http://localhost:8080/api/v1/thuc-don/danh-muc
curl "http://localhost:8080/api/v1/thuc-don/mon-an?trang=1&kichThuoc=20"
curl http://localhost:8080/api/v1/khuyen-mai/dang-ap-dung
curl "http://localhost:8080/api/v1/danh-gia?trang=1&kichThuoc=10"
```

Admin, sau khi có `$TOKEN`:

```bash
curl -sS -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/quan-tri/dashboard
curl -sS -H "Authorization: Bearer $TOKEN" "http://localhost:8080/api/v1/quan-tri/khach-hang?trang=1&kichThuoc=20"
curl -sS -H "Authorization: Bearer $TOKEN" "http://localhost:8080/api/v1/quan-tri/nhan-vien?trang=1&kichThuoc=20"
curl -sS -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/quan-tri/danh-muc-mon
curl -sS -H "Authorization: Bearer $TOKEN" "http://localhost:8080/api/v1/quan-tri/mon-an?trang=1&kichThuoc=20"
curl -sS -H "Authorization: Bearer $TOKEN" "http://localhost:8080/api/v1/quan-tri/bao-cao/dat-ban?tuNgay=2026-08-01&denNgay=2026-08-10"
curl -sS -H "Authorization: Bearer $TOKEN" "http://localhost:8080/api/v1/quan-tri/nhat-ky?trang=1&kichThuoc=20"
```

Swagger vẫn ở `/api/tai-lieu`.
