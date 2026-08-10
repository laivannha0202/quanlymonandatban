# PHẦN 6 — KHU VỰC, BÀN ĂN VÀ ENGINE TÌM BÀN TRỐNG

Phần này **không thay đổi database**. Tiếp tục dùng 23 bảng đã import và `schema.prisma` mà máy hiện tại đã `prisma db pull` thành công.

## Những phần đã thêm

- `CauHinhModule`: đọc kiểu chuỗi/số/boolean, cache ngắn, cập nhật cấu hình.
- `GioHoatDongModule`: đọc/upsert/xóa ca hoạt động.
- `NgayDacBietModule`: ngày nghỉ hoặc giờ mở cửa đặc biệt.
- `KhuVucModule`: public list + admin CRUD + soft delete.
- `BanAnModule`: admin CRUD bàn, sơ đồ bàn, liên kết ghép bàn.
- `LichPhucVuService`: kiểm tra lịch phục vụ, thời gian đặt trước, sinh slot.
- `BanAnRepository`: tìm bàn vận hành được và loại bàn có booking giao nhau.
- `TimBanTrongService`: bàn đơn trước, ghép hai bàn liền kề khi không có bàn đơn đủ chỗ.
- Unit test cho lịch phục vụ và engine tìm bàn.
- Sửa wildcard middleware NestJS 11 từ `*` thành `{*splat}`.
- Sửa `VaiTroModule` import `XacThucModule` để `JwtGuard` lấy được `JwtService`.

## Cách áp dụng

Dừng server (`Ctrl+C`) rồi từ thư mục `quanlyquanan` giải nén patch, cho phép ghi đè file.

Sau đó:

```bash
cd ~/Downloads/quanlyquanan/may-chu
npm install
npm run prisma:generate
npm run build
npm test -- --runInBand
npm run start:dev
```

Không chạy `prisma:pull` lại chỉ vì patch này; patch không thay database. Nếu bạn đã thay database thủ công thì mới cần pull lại.

## API public mới

```http
GET /api/v1/khu-vuc
GET /api/v1/dat-ban/khung-gio?ngay=2026-08-20
GET /api/v1/ban-an/tim-ban-trong?ngay=2026-08-20&gioBatDau=19:00&soNguoi=4
```

Có thể thêm:

```text
&khuVucId=1
```

## API Admin mới

```http
GET    /api/v1/quan-tri/cau-hinh
PATCH  /api/v1/quan-tri/cau-hinh

GET    /api/v1/quan-tri/gio-hoat-dong
PUT    /api/v1/quan-tri/gio-hoat-dong
DELETE /api/v1/quan-tri/gio-hoat-dong/:thu/:caSo

GET    /api/v1/quan-tri/ngay-dac-biet
POST   /api/v1/quan-tri/ngay-dac-biet
PATCH  /api/v1/quan-tri/ngay-dac-biet/:id
DELETE /api/v1/quan-tri/ngay-dac-biet/:id

GET    /api/v1/quan-tri/khu-vuc
GET    /api/v1/quan-tri/khu-vuc/:id
POST   /api/v1/quan-tri/khu-vuc
PATCH  /api/v1/quan-tri/khu-vuc/:id
DELETE /api/v1/quan-tri/khu-vuc/:id

GET    /api/v1/quan-tri/ban-an
GET    /api/v1/quan-tri/ban-an/so-do
GET    /api/v1/quan-tri/ban-an/:id
POST   /api/v1/quan-tri/ban-an
PATCH  /api/v1/quan-tri/ban-an/:id
DELETE /api/v1/quan-tri/ban-an/:id

GET    /api/v1/quan-tri/ban-an/lien-ket
POST   /api/v1/quan-tri/ban-an/lien-ket
PATCH  /api/v1/quan-tri/ban-an/lien-ket/:id
DELETE /api/v1/quan-tri/ban-an/lien-ket/:id
```

## Nghiệp vụ tìm bàn

1. Kiểm tra `CHO_PHEP_DAT_BAN`.
2. Kiểm tra số khách tối đa.
3. Kiểm tra thời gian đặt trước tối thiểu/tối đa.
4. Ngày đặc biệt ghi đè lịch tuần.
5. Tính giờ kết thúc theo `THOI_LUONG_DAT_BAN_PHUT`.
6. Loại bàn bảo trì/ngừng sử dụng.
7. Loại bàn có booking trạng thái `CHO_XAC_NHAN`, `DA_XAC_NHAN`, `DA_CHECK_IN` bị giao nhau.
8. Ưu tiên bàn đơn ít dư ghế nhất.
9. Nếu không có bàn đơn đủ sức chứa, tìm cặp trong `lien_ket_ban`.

Phần 6 mới chỉ **tìm** và đề xuất bàn. Phần 7 sẽ tạo booking thật trong transaction, khóa hàng bàn và kiểm tra overlap lần cuối để chống double booking.
