# PHẦN 9 — HOÀN THIỆN BACKEND CUỐI

Patch này **không tạo `may-chu` thứ hai**. Giải nén/copy trực tiếp vào `~/Downloads/quanlyquanan/may-chu`.

## Mục tiêu

1. Hoàn thiện xác thực: đổi mật khẩu, quên mật khẩu, đặt lại mật khẩu.
2. Hoàn thiện RBAC: danh mục quyền, chi tiết vai trò, gán lại quyền cho vai trò.
3. Chuẩn hóa response cuối: camelCase, bigint ID -> string, các trường số nghiệp vụ -> number, cờ 0/1 -> boolean.
4. Fail-fast cấu hình môi trường khi thiếu biến quan trọng.
5. Liveness/readiness health checks.
6. Log lỗi hệ thống + ánh xạ một số lỗi Prisma phổ biến thành HTTP nghiệp vụ.
7. Thêm smoke test và test chống double-booking đồng thời chạy bằng API thật.

## Patch KHÔNG đụng vào các fix thủ công quan trọng trước đó

Không ghi đè:
- `src/co-so-du-lieu/prisma.service.ts` (`allowPublicKeyRetrieval: true`)
- `prisma/seed.ts` (`allowPublicKeyRetrieval: true`)
- `src/mo-dun/dat-ban/dat-ban-workflow.service.ts` (rule check-in sớm/no-show)
- `src/mo-dun/dat-ban/dat-ban.repository.ts` (fix BigInt nội bộ)
- `src/mo-dun/mon-an/mon-an.service.ts` (fix type `MonAnChiTiet`)

## Cài đặt

```bash
cd ~/Downloads/quanlyquanan
cp -a may-chu may-chu-backup-truoc-phan9
cd may-chu
unzip -o ~/Downloads/phan9_backend_final_patch.zip -d .
```

Không cần `prisma:pull`. Database không thay đổi.

```bash
npm install
npm run prisma:generate
npm run build
npm test -- --runInBand
```

Nếu xanh:

```bash
npm run start:dev
```

## Smoke test

Giữ server chạy ở terminal 1, terminal 2:

```bash
cd ~/Downloads/quanlyquanan/may-chu
npm run test:smoke
```

Kỳ vọng:

```text
SMOKE_PHAN_9_OK
```

## Test concurrency thật

Test này tự:
- đăng nhập Admin,
- tìm slot và bàn trống trong 7 ngày tới,
- gửi 2 request cùng lúc vào cùng một bàn,
- bắt buộc đúng 1 request thành công và đúng 1 request nhận `409 DAT_BAN_002`,
- hủy booking test thành công để trả lại slot.

```bash
npm run test:concurrency
```

Kỳ vọng:

```text
CONCURRENCY_PHAN_9_OK ...
```

## API mới

### Xác thực

```text
POST /api/v1/xac-thuc/doi-mat-khau
POST /api/v1/xac-thuc/quen-mat-khau
POST /api/v1/xac-thuc/dat-lai-mat-khau
```

`quen-mat-khau` không tiết lộ email có tồn tại hay không. Trong `development`, response có `tokenDatLaiMatKhau` để test local; `production` không trả token thô.

Biến tùy chọn:

```env
RESET_PASSWORD_EXPIRES_MINUTES=30
```

### RBAC

```text
GET /api/v1/quan-tri/quyen
GET /api/v1/quan-tri/vai-tro/:id
PUT /api/v1/quan-tri/vai-tro/:id/quyen
```

Payload gán quyền:

```json
{
  "maQuyens": ["DAT_BAN_XEM", "DAT_BAN_XAC_NHAN", "BAN_AN_XEM"]
}
```

Vai trò `QUAN_TRI_VIEN` được khóa không cho sửa quyền để tránh tự khóa hệ thống.

### Health

```text
GET /api/v1/suc-khoe/song
GET /api/v1/suc-khoe/san-sang
GET /api/v1/suc-khoe
```

## Response cuối

Ví dụ trước đây:

```json
{
  "so_nguoi": "2",
  "suc_chua": "2",
  "la_mon_noi_bat": 1,
  "tai_khoan_id": "1"
}
```

Sau Phần 9:

```json
{
  "soNguoi": 2,
  "sucChua": 2,
  "laMonNoiBat": true,
  "taiKhoanId": "1"
}
```

ID vẫn là string có chủ đích.

## Sau khi mọi test xanh

```bash
cd ~/Downloads/quanlyquanan
rm -rf phan9_backend_final_patch
```

Giữ `may-chu-backup-truoc-phan9` tới khi Frontend kết nối ổn.
