# PHẦN 4 — ĐẶC TẢ FULL BACKEND NESTJS

# 1. Stack Backend

```text
Node.js
NestJS
TypeScript
Prisma ORM
MySQL 8.x

Swagger / OpenAPI

JWT Access Token
Refresh Token

Argon2 hoặc bcrypt
class-validator
class-transformer

Helmet
CORS
Rate Limiting

Jest
Supertest
```

NestJS có module Swagger chính thức thông qua `@nestjs/swagger`, có thể sinh OpenAPI từ controller và DTO.

Authentication và Authorization sẽ dùng Guard. NestJS thiết kế Guard để quyết định request có được phép đi tới route handler hay không và tài liệu chính thức cũng mô tả RBAC bằng Guards.

---

# 2. Nguyên tắc quan trọng

Database SQL là:

```text
SOURCE OF TRUTH
```

Không làm:

```text
SQL một kiểu
Prisma một kiểu
Backend tự đoán kiểu thứ ba
```

Database hiện tại đã xác định:

```text
23 bảng
RBAC
Booking nhiều bàn
Soft delete
Audit
Giờ hoạt động
Ngày đặc biệt
Khả năng ghép bàn
```

Booking liên kết nhiều bàn qua:

```text
dat_ban
    ↓
chi_tiet_dat_ban
    ↓
ban_an
```



---

# 3. Chiến lược Prisma

Vì database SQL đã được thiết kế trước, không nên viết lại toàn bộ `schema.prisma` bằng tay.

Quy trình:

```text
Import MySQL SQL
        ↓
Tạo database thật
        ↓
Prisma kết nối MySQL
        ↓
prisma db pull
        ↓
schema.prisma sinh từ database
        ↓
Kiểm tra relation / naming
        ↓
prisma generate
```

Prisma hỗ trợ introspection database hiện có bằng `prisma db pull`, sinh model dựa trên bảng và quan hệ trong database.

---

# 4. Hai View hiện tại

Database đã có:

```text
v_dat_ban_tong_quan
v_thong_ke_khach_hang
```



Prisma hiện hỗ trợ khai báo/introspect database view, nhưng view không nên trở thành nơi thực hiện mutation của hệ thống.

Hai view này chủ yếu dùng:

```text
Admin list
Dashboard
Report
```

---

# 5. Quy ước BIGINT

SQL dùng:

```text
BIGINT UNSIGNED
```

cho primary key.

Ví dụ:

```text
tai_khoan.id
khach_hang.id
dat_ban.id
ban_an.id
```

Không convert tùy tiện thành:

```typescript
number
```

API trả:

```json
{
  "id": "125"
}
```

thay vì:

```json
{
  "id": 125
}
```

Backend tạo interceptor:

```text
BigInt
→
string
```

---

# 6. Cấu trúc Backend

```text
may-chu/
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
├── src/
│   │
│   ├── app.module.ts
│   ├── main.ts
│   │
│   ├── co-so-du-lieu/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   │
│   ├── dung-chung/
│   │   ├── decorator/
│   │   ├── dto/
│   │   ├── enum/
│   │   ├── exception/
│   │   ├── filter/
│   │   ├── guard/
│   │   ├── interceptor/
│   │   ├── middleware/
│   │   ├── response/
│   │   ├── types/
│   │   └── tien-ich/
│   │
│   └── mo-dun/
│       │
│       ├── xac-thuc/
│       ├── tai-khoan/
│       ├── vai-tro/
│       ├── khach-hang/
│       ├── nhan-vien/
│       │
│       ├── khu-vuc/
│       ├── ban-an/
│       ├── dat-ban/
│       │
│       ├── danh-muc-mon/
│       ├── mon-an/
│       │
│       ├── khuyen-mai/
│       ├── danh-gia/
│       ├── thong-bao/
│       │
│       ├── gio-hoat-dong/
│       ├── ngay-dac-biet/
│       ├── cau-hinh/
│       │
│       ├── dashboard/
│       ├── bao-cao/
│       └── nhat-ky/
│
├── test/
│
├── .env
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

---

# 7. Module tổng

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    PrismaModule,

    XacThucModule,
    TaiKhoanModule,
    VaiTroModule,

    KhachHangModule,
    NhanVienModule,

    KhuVucModule,
    BanAnModule,
    DatBanModule,

    DanhMucMonModule,
    MonAnModule,

    KhuyenMaiModule,
    DanhGiaModule,

    ThongBaoModule,

    GioHoatDongModule,
    NgayDacBietModule,
    CauHinhModule,

    DashboardModule,
    BaoCaoModule,
    NhatKyModule,
  ],
})
export class AppModule {}
```

---

# 8. main.ts

Cấu hình:

```text
API prefix
Validation
Swagger
CORS
Helmet
BigInt serializer
Global error filter
Global response interceptor
Request ID
```

Base API:

```text
/api/v1
```

Swagger:

```text
/api/tai-lieu
```

---

# 9. ValidationPipe

Toàn hệ thống bật:

```text
whitelist
transform
forbidNonWhitelisted
```

Mục tiêu:

Request:

```json
{
  "hoTen": "A",
  "thuocTinhLa": "hack"
}
```

không được âm thầm chấp nhận field:

```text
thuocTinhLa
```

---

# 10. Chuẩn Response

## Thành công

```json
{
  "thanhCong": true,
  "thongBao": "Lấy dữ liệu thành công",
  "duLieu": {}
}
```

## Danh sách

```json
{
  "thanhCong": true,
  "duLieu": [],
  "phanTrang": {
    "trang": 1,
    "kichThuoc": 20,
    "tongBanGhi": 100,
    "tongTrang": 5
  }
}
```

## Lỗi

```json
{
  "thanhCong": false,
  "maLoi": "BAN_KHONG_CON_TRONG",
  "thongBao": "Bàn vừa được khách khác đặt.",
  "chiTiet": null,
  "maYeuCau": "req_xxx"
}
```

---

# 11. Error Filter

Tạo:

```text
bo-loc-loi-toan-cuc.ts
```

Nhiệm vụ:

```text
HttpException
Prisma error
Validation error
Unknown error
```

đều được convert về một format.

Không trả:

```text
stack trace
SQL
DATABASE_URL
internal path
```

cho frontend.

---

# 12. Mã lỗi nghiệp vụ

```text
XAC_THUC_001
TAI_KHOAN_KHONG_TON_TAI

XAC_THUC_002
MAT_KHAU_KHONG_DUNG

XAC_THUC_003
TAI_KHOAN_BI_KHOA

XAC_THUC_004
TOKEN_KHONG_HOP_LE

XAC_THUC_005
TOKEN_HET_HAN
```

Booking:

```text
DAT_BAN_001
DAT_BAN_KHONG_TON_TAI

DAT_BAN_002
BAN_KHONG_CON_TRONG

DAT_BAN_003
NGOAI_GIO_HOAT_DONG

DAT_BAN_004
VUOT_SO_NGUOI_TOI_DA

DAT_BAN_005
DAT_QUA_SOM

DAT_BAN_006
DAT_QUA_XA

DAT_BAN_007
KHONG_DUOC_HUY_DAT_BAN

DAT_BAN_008
CHUYEN_TRANG_THAI_KHONG_HOP_LE

DAT_BAN_009
BAN_KHONG_DU_SUC_CHUA

DAT_BAN_010
NHA_HANG_TAM_NGUNG_DAT_BAN
```

---

# 13. Correlation / Request ID

Mỗi HTTP request sinh:

```text
maYeuCau
```

Ví dụ:

```text
req_01J5XXX
```

Lưu vào:

```text
request context
log
nhat_ky_hoat_dong.ma_yeu_cau
response error
```

Database đã có field:

```text
ma_yeu_cau
```

cho audit log.

---

# 14. Authentication Module

```text
xac-thuc/
│
├── dto/
│   ├── dang-nhap.dto.ts
│   ├── dang-ky.dto.ts
│   ├── lam-moi-token.dto.ts
│   ├── quen-mat-khau.dto.ts
│   └── dat-lai-mat-khau.dto.ts
│
├── guards/
│   └── jwt.guard.ts
│
├── strategies/
│
├── xac-thuc.controller.ts
├── xac-thuc.service.ts
└── xac-thuc.module.ts
```

---

# 15. Đăng nhập

Luồng:

```text
Email / username
        ↓
Tìm tài khoản
        ↓
Kiểm tra deleted
        ↓
Kiểm tra trạng thái
        ↓
Kiểm tra khóa tạm
        ↓
Verify password
        ↓
Sai?
 ┌──────┴─────┐
 Có           Không
 │              │
Tăng lỗi       Reset lỗi
 │              │
Khóa nếu       Tạo token
vượt ngưỡng
```

---

# 16. Password

Không lưu password thô.

SQL đã quy định:

```text
mat_khau = password hash
```



Service:

```typescript
xacThucMatKhau()
bamMatKhau()
```

Không đặt logic hash trong Controller.

---

# 17. Access Token

JWT payload tối thiểu:

```json
{
  "sub": "15",
  "vaiTro": "NHAN_VIEN"
}
```

Không nhét:

```text
toàn bộ profile
toàn bộ 30 quyền
thông tin nhạy cảm
```

vào token nếu không cần.

---

# 18. Refresh Token

Database có:

```text
refresh_token_hash
```



Backend:

```text
Sinh refresh token
      ↓
Hash refresh token
      ↓
Lưu hash DB
      ↓
Gửi token thật cho client
```

Không lưu refresh token plain text trong DB.

---

# 19. Logout

```text
POST /xac-thuc/dang-xuat
```

Backend:

```text
refresh_token_hash = NULL
```

Token refresh cũ mất hiệu lực.

---

# 20. Đăng nhập sai

SQL đã có:

```text
so_lan_dang_nhap_sai
khoa_den
```



Ví dụ nghiệp vụ:

```text
Sai 5 lần
→ khóa 15 phút
```

Con số này nên đưa vào cấu hình Backend.

---

# 21. Seed Admin đầu tiên

Không đưa mật khẩu cố định vào SQL.

SQL đã chủ động để phần Admin cho Backend seed.

`seed.ts`:

```text
Đọc ADMIN_EMAIL từ env
Đọc ADMIN_PASSWORD từ env

Tìm role QUAN_TRI_VIEN

Hash password

Upsert tai_khoan

Upsert nhan_vien
```

`.env`:

```env
SEED_ADMIN_EMAIL=
SEED_ADMIN_PASSWORD=
```

---

# 22. RBAC

Database:

```text
vai_tro
quyen
vai_tro_quyen
```

đã được thiết kế dạng many-to-many.

Không hard-code toàn bộ permission kiểu:

```typescript
if (user.role === 'ADMIN')
```

ở khắp source.

---

# 23. Decorator quyền

```typescript
@CanQuyen('DAT_BAN_XAC_NHAN')
```

hoặc:

```typescript
@CanQuyen(
  'DAT_BAN_XEM',
  'DAT_BAN_SUA',
)
```

---

# 24. Permission Guard

Luồng:

```text
JWT hợp lệ
    ↓
Lấy account
    ↓
Lấy role
    ↓
Lấy permission
    ↓
Kiểm tra route yêu cầu
    ↓
Cho phép / 403
```

NestJS Guards phù hợp với tầng authorization này.

---

# 25. Cache Permission

Không query:

```text
vai_tro
quyen
vai_tro_quyen
```

cho mọi request nếu không cần.

Có thể cache:

```text
role → permissions
```

trong memory ngắn hạn.

Khi Admin sửa quyền:

```text
invalidate cache
```

---

# 26. Module tài khoản

```text
tai-khoan/
├── dto/
├── tai-khoan.controller.ts
├── tai-khoan.service.ts
├── tai-khoan.repository.ts
└── tai-khoan.module.ts
```

Nghiệp vụ:

```text
Xem tài khoản
Khóa
Mở khóa
Đổi mật khẩu
Reset mật khẩu
```

Không hard delete account.

---

# 27. Khách hàng

```text
khach-hang/
│
├── dto/
│   ├── cap-nhat-ho-so.dto.ts
│   ├── tim-khach-hang.dto.ts
│   └── cap-nhat-khach-hang-admin.dto.ts
│
├── khach-hang.controller.ts
├── khach-hang-quan-tri.controller.ts
├── khach-hang.service.ts
├── khach-hang.repository.ts
└── khach-hang.module.ts
```

Database khách hàng có:

```text
tai_khoan_id nullable
```

nên khách được tạo từ:

```text
đặt bàn điện thoại
Facebook
khách trực tiếp
```

không bắt buộc có account.

---

# 28. Tạo khách từ booking

Khi khách public đặt bàn:

```text
Có account?
   ↓
Gắn khach_hang_id
```

Nếu không account:

```text
Có khách cùng SĐT?
   ↓
Có → dùng customer hiện tại
Không → có thể tạo customer record
```

Tuy nhiên `dat_ban` luôn lưu snapshot:

```text
ho_ten
so_dien_thoai
email
```

nên lịch sử booking không phụ thuộc profile hiện tại.

---

# 29. Module nhân viên

Nghiệp vụ:

```text
Danh sách
Tạo
Sửa
Khóa
Mở khóa
Nghỉ việc
Phân vai trò
```

Khi tạo nhân viên:

```text
Transaction

tai_khoan
+
nhan_vien
```

Nếu tạo profile lỗi:

```text
rollback account
```

---

# 30. Khu vực

```text
khu-vuc/
├── dto/
├── khu-vuc.controller.ts
├── khu-vuc-quan-tri.controller.ts
├── khu-vuc.service.ts
└── khu-vuc.repository.ts
```

Public:

```text
GET /khu-vuc
```

Admin:

```text
GET
POST
PATCH
DELETE soft
```

---

# 31. Xóa khu vực

Không hard delete nếu:

```text
còn bàn
có dữ liệu liên quan
```

Luồng ưu tiên:

```text
ngay_xoa = now()
trang_thai = NGUNG_HOAT_DONG
```

---

# 32. Module bàn ăn

```text
ban-an/
│
├── dto/
│
├── ban-an.controller.ts
├── ban-an-quan-tri.controller.ts
│
├── ban-an.service.ts
├── ban-an.repository.ts
│
├── tim-ban-trong.service.ts
├── ghep-ban.service.ts
└── ban-an.module.ts
```

Tách:

```text
BanAnService
```

khỏi:

```text
TimBanTrongService
```

vì tìm bàn là nghiệp vụ lớn.

---

# 33. Trạng thái bàn

Database chỉ lưu trạng thái vận hành:

```text
TRONG
DANG_SU_DUNG
BAO_TRI
NGUNG_SU_DUNG
```



Không lưu:

```text
SAP_CO_KHACH
DA_DAT_NGAY_MAI
```

Những trạng thái này Backend/UI suy ra từ booking.

---

# 34. Engine tìm bàn trống

Input:

```typescript
{
  ngay: string;
  gioBatDau: string;
  soNguoi: number;
  khuVucId?: string;
}
```

Luồng:

```text
Validate ngày
      ↓
Đọc cấu hình booking
      ↓
Kiểm tra ngày đặc biệt
      ↓
Kiểm tra giờ hoạt động
      ↓
Tính giờ kết thúc
      ↓
Lọc bàn hoạt động
      ↓
Lọc sức chứa
      ↓
Loại booking trùng lịch
      ↓
Nếu không có bàn đơn
      ↓
Tìm phương án ghép
      ↓
Xếp hạng
      ↓
Trả kết quả
```

---

# 35. Quy tắc giao nhau

Database đã chốt:

```text
bookingCu.gioBatDau < gioKetThucMoi

AND

bookingCu.gioKetThuc > gioBatDauMoi
```



Không dùng:

```text
BETWEEN
```

đơn giản vì dễ bỏ sót trường hợp một booking bao trùm booking khác.

---

# 36. Trạng thái chiếm bàn

Chỉ xét:

```text
CHO_XAC_NHAN
DA_XAC_NHAN
DA_CHECK_IN
```



Không xét:

```text
DA_HUY
KHONG_DEN
DA_HOAN_THANH
```

---

# 37. Xếp hạng bàn đơn

Ưu tiên:

```text
1. Đủ sức chứa
2. Ít dư chỗ nhất
3. Đúng khu vực
4. Bàn có sức chứa chuẩn gần số khách nhất
5. Mã bàn
```

Ví dụ:

```text
Khách 4 người

A03: 4
A04: 6
A05: 8
```

ưu tiên:

```text
A03
```

---

# 38. Ghép bàn

SQL đã có:

```text
lien_ket_ban
```

để mô tả hai bàn có thể ghép vật lý.

Backend không được ghép ngẫu nhiên:

```text
A01 + V02
```

chỉ vì tổng sức chứa đủ.

---

# 39. Quy tắc chuẩn hóa liên kết bàn

Khi tạo:

```text
ban_1_id < ban_2_id
```

Backend chuẩn hóa trước insert.

Tránh:

```text
A01 → A02
A02 → A01
```

trở thành hai quan hệ khác nhau.

---

# 40. Thuật toán ghép bàn V1

Không cần graph solver phức tạp.

V1:

```text
Tìm bàn đơn
      ↓
Không đủ?
      ↓
Tìm cặp liên kết
      ↓
Tính tổng sức chứa
      ↓
Loại cặp có booking
      ↓
Sắp theo số ghế dư
```

Version sau mới hỗ trợ:

```text
3 bàn
4 bàn
layout graph
```

---

# 41. Module đặt bàn

```text
dat-ban/
│
├── dto/
│   ├── tim-ban-trong.dto.ts
│   ├── tao-dat-ban.dto.ts
│   ├── tao-dat-ban-admin.dto.ts
│   ├── cap-nhat-dat-ban.dto.ts
│   ├── tra-cuu-dat-ban.dto.ts
│   ├── huy-dat-ban.dto.ts
│   ├── sap-ban.dto.ts
│   └── danh-sach-dat-ban.dto.ts
│
├── enum/
│   └── trang-thai-dat-ban.enum.ts
│
├── dat-ban.controller.ts
├── dat-ban-khach-hang.controller.ts
├── dat-ban-quan-tri.controller.ts
│
├── dat-ban.service.ts
├── dat-ban.repository.ts
├── dat-ban-workflow.service.ts
├── tao-ma-dat-ban.service.ts
└── dat-ban.module.ts
```

---

# 42. Không nhét hết vào DatBanService

Sai:

```text
dat-ban.service.ts
3000 dòng
```

Đúng:

```text
DatBanService
DatBanRepository
DatBanWorkflowService
TimBanTrongService
TaoMaDatBanService
```

---

# 43. Tạo mã booking

Format:

```text
DB202608100001
```

Không sinh đơn giản bằng:

```text
COUNT(*) + 1
```

vì concurrency.

Có thể dùng:

```text
DB + ngày + suffix từ ID
```

hoặc sequence riêng.

Phương án sạch:

```text
Tạo booking
→ có DB id
→ cập nhật ma_dat_ban từ id
```

Ví dụ:

```text
DB20260810-000125
```

---

# 44. Public tạo booking

```http
POST /api/v1/dat-ban
```

Request:

```json
{
  "hoTen": "Nguyễn Văn A",
  "soDienThoai": "0909123456",
  "email": "a@example.com",
  "ngay": "2026-08-20",
  "gioBatDau": "19:00",
  "soNguoi": 4,
  "khuVucId": "1",
  "banAnIds": ["3"],
  "ghiChu": "Gần cửa sổ"
}
```

---

# 45. Transaction đặt bàn

Đây là phần quan trọng nhất Backend.

Prisma hỗ trợ interactive transaction bằng callback truyền vào `$transaction`.

Luồng:

```text
$transaction
│
├── Lock bàn được chọn
│
├── Kiểm tra trạng thái bàn
│
├── Kiểm tra booking trùng lại
│
├── Tạo hoặc tìm khách hàng
│
├── INSERT dat_ban
│
├── Sinh ma_dat_ban
│
├── INSERT chi_tiet_dat_ban
│
├── INSERT lich_su_dat_ban
│
├── INSERT thong_bao nếu có account
│
└── COMMIT
```

SQL hiện cũng yêu cầu backend khóa bàn và kiểm tra overlap lại trong transaction để chống double-booking.

---

# 46. Lock bàn

Trong transaction:

```sql
SELECT id
FROM ban_an
WHERE id IN (...)
FOR UPDATE;
```

Sau đó mới kiểm tra booking overlap.

Prisma hỗ trợ raw database query khi cần truy cập khả năng SQL cụ thể.

Phải dùng query parameter an toàn.

Không nối chuỗi:

```typescript
`WHERE id = ${input}`
```

từ dữ liệu chưa kiểm soát.

---

# 47. Vì sao phải lock

Hai request:

```text
Request A
Request B
```

đều có thể:

```text
check thấy A01 trống
```

nếu chỉ check trước transaction.

Lock khiến:

```text
A lock A01
B phải chờ
A tạo booking
A commit
B kiểm tra lại
B phát hiện overlap
B trả 409
```

---

# 48. Response double booking

```http
409 Conflict
```

```json
{
  "thanhCong": false,
  "maLoi": "DAT_BAN_002",
  "thongBao": "Một hoặc nhiều bàn vừa được khách khác đặt."
}
```

Frontend gọi lại:

```text
/tim-ban-trong
```

---

# 49. Workflow trạng thái

Tách riêng:

```text
dat-ban-workflow.service.ts
```

Không cho Controller update:

```json
{
  "trangThai": "DA_HOAN_THANH"
}
```

tự do.

---

# 50. State Machine

```text
CHO_XAC_NHAN
 │
 ├────→ DA_HUY
 │
 └────→ DA_XAC_NHAN
            │
            ├────→ DA_HUY
            │
            ├────→ KHONG_DEN
            │
            └────→ DA_CHECK_IN
                       │
                       └────→ DA_HOAN_THANH
```

---

# 51. Endpoint workflow

```http
PATCH /quan-tri/dat-ban/:id/xac-nhan

PATCH /quan-tri/dat-ban/:id/sap-ban

PATCH /quan-tri/dat-ban/:id/check-in

PATCH /quan-tri/dat-ban/:id/hoan-thanh

PATCH /quan-tri/dat-ban/:id/huy

PATCH /quan-tri/dat-ban/:id/khong-den
```

---

# 52. Xác nhận booking

Điều kiện:

```text
CHO_XAC_NHAN
```

Action:

```text
trang_thai = DA_XAC_NHAN

nguoi_xac_nhan_id
thoi_gian_xac_nhan
```

Database có sẵn các field này.

---

# 53. Check-in

Điều kiện:

```text
DA_XAC_NHAN
```

Transaction:

```text
dat_ban
→ DA_CHECK_IN

thoi_gian_check_in
→ now

ban_an
→ DANG_SU_DUNG

lich_su_dat_ban
→ CHECK_IN
```

Nếu booking có hai bàn:

```text
cả hai bàn
→ DANG_SU_DUNG
```

---

# 54. Hoàn thành

Điều kiện:

```text
DA_CHECK_IN
```

Transaction:

```text
dat_ban
→ DA_HOAN_THANH

thoi_gian_hoan_thanh
→ now

ban_an liên quan
→ TRONG

history
→ HOAN_THANH
```

---

# 55. Không đến

Điều kiện:

```text
DA_XAC_NHAN
```

Và:

```text
now >= gioBatDau + thoiGianChoKhach
```

Cấu hình mặc định hiện là:

```text
15 phút
```



---

# 56. Khách tự hủy

Chỉ cho:

```text
CHO_XAC_NHAN
DA_XAC_NHAN
```

Và:

```text
gioBatDau - now
>=
THOI_GIAN_HUY_TRUOC_PHUT
```

Cấu hình hiện tại:

```text
60 phút
```



---

# 57. Tra cứu booking Public

Không dùng:

```http
GET /dat-ban/DB001
```

vì ai đoán mã cũng có thể thử.

Dùng:

```http
POST /dat-ban/tra-cuu
```

Request:

```json
{
  "maDatBan": "DB20260810-001",
  "soDienThoai": "0909123456"
}
```

Phải match:

```text
ma_dat_ban
+
so_dien_thoai
```

---

# 58. Rate Limit tra cứu

Các endpoint nên hạn chế request:

```text
login
forgot password
booking lookup
public booking
```

NestJS có package chính thức `@nestjs/throttler` phục vụ rate limiting.

---

# 59. Lịch sử booking

Mọi workflow đều ghi:

```text
lich_su_dat_ban
```

Database lưu:

```text
trang_thai_cu
trang_thai_moi
nguoi_thuc_hien_id
hanh_dong
ghi_chu
thoi_gian
```



Không dựa duy nhất vào audit log để dựng timeline booking.

---

# 60. Audit log khác lịch sử booking

`lich_su_dat_ban`:

```text
business history
```

`nhat_ky_hoat_dong`:

```text
security/admin audit
```

Hai cái không thay thế nhau.

---

# 61. Audit service

```text
NhatKyService.ghiNhan()
```

Input:

```typescript
{
  taiKhoanId;
  hanhDong;
  doiTuong;
  doiTuongId;
  duLieuCu;
  duLieuMoi;
  ip;
  userAgent;
  maYeuCau;
}
```

---

# 62. Những action cần audit

```text
Đăng nhập Admin

Tạo/Sửa nhân viên

Khóa tài khoản

Đổi quyền

Tạo/Sửa/Xóa bàn

Thay đổi booking

Hủy booking

Check-in

Cấu hình hệ thống

Quản lý khuyến mãi

Ẩn đánh giá
```

---

# 63. Danh mục món

Public:

```http
GET /danh-muc-mon
GET /danh-muc-mon/:duongDan
```

Admin:

```http
GET
POST
PATCH
DELETE
```

Soft delete:

```text
ngay_xoa
```

---

# 64. Món ăn

Public chỉ lấy:

```text
ngay_xoa IS NULL
trang_thai = HOAT_DONG
```

Admin lấy cả inactive nếu filter yêu cầu.

Database đã có:

```text
gia
gia_khuyen_mai
la_mon_noi_bat
con_mon
hinh_anh_chinh
```



---

# 65. Upload ảnh món

Không lưu binary ảnh trong MySQL.

DB chỉ lưu:

```text
URL / path
```

như:

```text
hinh_anh_chinh
hinh_anh_mon.duong_dan_anh
```



---

# 66. Hình ảnh món

Một món có:

```text
1 ảnh chính

+
0..n ảnh phụ
```

Backend phải đảm bảo logic:

```text
không có hai ảnh được xem là ảnh chính
```

dù SQL hiện chưa có partial unique constraint cho điều này.

---

# 67. Khuyến mãi

Database hiện có:

```text
PHAN_TRAM
SO_TIEN
```

và validation mức database cho giá trị phần trăm/tổng tiền.

Backend vẫn validate lại.

---

# 68. Lưu ý phạm vi khuyến mãi

Ở version hiện tại:

```text
khuyen_mai
```

chưa được nối trực tiếp với:

```text
dat_ban
mon_an
hoa_don
```

nên module hiện tại chủ yếu:

```text
CRUD chương trình khuyến mãi
hiển thị chương trình
```

Chưa nên giả lập:

```text
thanh toán / áp mã hóa đơn
```

khi database chưa có nghiệp vụ order/payment.

---

# 69. Đánh giá

Database đã liên kết:

```text
khach_hang
danh_gia
dat_ban
```

và mỗi booking tối đa một đánh giá nhờ:

```text
UNIQUE dat_ban_id
```



Backend rule:

```text
Booking phải thuộc khách
Booking phải DA_HOAN_THANH
Booking chưa đánh giá
```

---

# 70. Phản hồi đánh giá

Admin/Nhân viên được cấp quyền:

```text
DANH_GIA_QUAN_LY
```

khi phản hồi lưu:

```text
phan_hoi
nguoi_phan_hoi_id
thoi_gian_phan_hoi
```

---

# 71. Thông báo

Database:

```text
tai_khoan_id
dat_ban_id
loai_thong_bao
tieu_de
noi_dung
duong_dan
da_doc
```



Version 1:

```text
notification trong website
```

Version sau:

```text
Email
SMS
Zalo
Push
```

---

# 72. Notification events

Ví dụ:

```text
DAT_BAN_DA_TAO
DAT_BAN_DA_XAC_NHAN
DAT_BAN_DA_HUY
SAP_DEN_GIO_DAT
```

Không gửi email trực tiếp từ booking service.

Nên:

```text
Booking service
      ↓
Notification service
```

---

# 73. Giờ hoạt động

SQL hỗ trợ:

```text
7 ngày
nhiều ca/ngày
```

qua:

```text
thu_trong_tuan
ca_so
gio_mo_cua
gio_dong_cua
```



---

# 74. Ngày đặc biệt

SQL hỗ trợ:

```text
đóng cả ngày
```

hoặc:

```text
giờ mở cửa đặc biệt
```



Ưu tiên logic:

```text
ngay_nghi_dac_biet
```

trước:

```text
gio_hoat_dong
```

---

# 75. Tính slot đặt bàn

Cấu hình:

```text
KHOANG_CACH_SLOT_PHUT = 30
```



Endpoint:

```http
GET /api/v1/dat-ban/khung-gio
    ?ngay=2026-08-20
```

Response:

```json
{
  "duLieu": [
    "10:00",
    "10:30",
    "11:00",
    "11:30"
  ]
}
```

---

# 76. CauHinhService

Không để mỗi service tự query:

```text
cau_hinh
```

Tạo:

```text
CauHinhService
```

API nội bộ:

```typescript
layChuoi(khoa)
laySo(khoa)
layBoolean(khoa)
layJson(khoa)
```

---

# 77. Cache cấu hình

Có thể cache:

```text
30–60 giây
```

hoặc cache tới khi Admin update.

Ví dụ:

```text
THOI_LUONG_DAT_BAN_PHUT
```

không cần query DB cho từng validation nếu cache hợp lý.

---

# 78. Dashboard Module

Không cho Controller chứa SQL.

```text
DashboardController
        ↓
DashboardService
        ↓
DashboardRepository
```

Các endpoint:

```http
/tong-quan
/dat-ban-7-ngay
/khach-theo-khung-gio
/trang-thai-ban
/dat-ban-theo-khu-vuc
```

---

# 79. Dashboard tổng quan

Một query hoặc nhóm query lấy:

```text
Booking hôm nay

Chờ xác nhận

Đã xác nhận

Số khách hôm nay

Bàn đang sử dụng

Bàn trống

Không đến
```

Không gọi:

```text
7 API con
```

từ frontend để render 7 card nếu có thể trả một payload.

---

# 80. Báo cáo Module

Tách khỏi Dashboard.

Dashboard:

```text
vận hành hiện tại
```

Báo cáo:

```text
phân tích theo khoảng thời gian
```

---

# 81. Report endpoints

```http
GET /bao-cao/dat-ban

GET /bao-cao/khach-hang

GET /bao-cao/ban-an

GET /bao-cao/khung-gio

GET /bao-cao/huy-ban

GET /bao-cao/khong-den
```

Query:

```text
tuNgay
denNgay
khuVucId
```

---

# 82. Pagination chuẩn

DTO:

```typescript
class PhanTrangDto {
  trang = 1;
  kichThuoc = 20;
}
```

Giới hạn:

```text
kichThuoc <= 100
```

không cho:

```text
kichThuoc = 9999999
```

---

# 83. Search

Ví dụ booking:

```text
tuKhoa
```

search:

```text
ma_dat_ban
ho_ten
so_dien_thoai
email
```

Không search wildcard mọi column.

---

# 84. Soft Delete Helper

Các module:

```text
khach_hang
khu_vuc
ban_an
danh_muc_mon
mon_an
khuyen_mai
```

đều cần filter:

```text
ngay_xoa IS NULL
```

theo thiết kế SQL. 
---

# 85. Không tạo Repository quá trừu tượng

Không cần:

```text
BaseRepository<T>
GenericRepository<T>
AbstractCrudRepository<T>
```

nếu chỉ khiến code khó đọc.

Mỗi business module giữ repository rõ ràng:

```text
DatBanRepository
BanAnRepository
KhachHangRepository
```

---

# 86. Controller rule

Controller chỉ:

```text
nhận request
validate DTO
đọc current user
gọi service
trả response
```

Không:

```text
Prisma query
transaction
hash password
workflow booking
```

trong Controller.

---

# 87. Service rule

Service:

```text
business logic
permission context
transaction coordination
workflow
```

---

# 88. Repository rule

Repository:

```text
query database
filter
pagination
aggregate
```

Repository không quyết định:

```text
khách có được hủy booking hay không
```

Đó là business rule của Service.

---

# 89. Swagger

Swagger root:

```text
/api/tai-lieu
```

Nest Swagger có thể lấy metadata từ DTO/body/query/param để tạo tài liệu OpenAPI.

Mỗi endpoint phải mô tả:

```text
summary

role/permission

request

response

error

example
```

---

# 90. Swagger tags

```text
Xác thực

Khách hàng - Tài khoản

Khách hàng - Đặt bàn

Khách hàng - Thực đơn

Quản trị - Dashboard

Quản trị - Đặt bàn

Quản trị - Bàn ăn

Quản trị - Khu vực

Quản trị - Thực đơn

Quản trị - Khách hàng

Quản trị - Nhân viên

Quản trị - Khuyến mãi

Quản trị - Đánh giá

Quản trị - Báo cáo

Quản trị - Hệ thống
```

---

# 91. JWT Swagger

Swagger phải có Bearer authentication.

Admin có thể:

```text
Authorize
→ nhập access token
→ test API protected
```

Nest Swagger có hỗ trợ khai báo security scheme cho API documentation.

---

# 92. Environment

```env
NODE_ENV=development

PORT=8080

DATABASE_URL=

JWT_ACCESS_SECRET=
JWT_ACCESS_EXPIRES_IN=

JWT_REFRESH_SECRET=
JWT_REFRESH_EXPIRES_IN=

FRONTEND_URL=http://localhost:5173

SEED_ADMIN_EMAIL=
SEED_ADMIN_PASSWORD=
```

Không commit `.env`.

Commit:

```text
.env.example
```

---

# 93. Logging

Log tối thiểu:

```text
method
url
status
duration
requestId
accountId
```

Không log:

```text
password
refresh token
authorization header
reset password token
```

---

# 94. Health Check

Endpoint:

```http
GET /api/v1/suc-khoe
```

Response:

```json
{
  "thanhCong": true,
  "duLieu": {
    "api": "HOAT_DONG",
    "database": "HOAT_DONG"
  }
}
```

Dùng deployment health check.

---

# 95. Test tầng Service

Quan trọng nhất:

```text
DatBanService
TimBanTrongService
DatBanWorkflowService
XacThucService
PermissionGuard
```

---

# 96. Test tìm bàn

Case:

```text
Bàn trống → xuất hiện

Bàn quá nhỏ → không xuất hiện

Bàn bảo trì → không xuất hiện

Bàn bị booking overlap → không xuất hiện

Booking đã hủy → bàn xuất hiện

Booking kết thúc đúng giờ bắt đầu mới
→ không overlap
```

---

# 97. Test overlap

Booking cũ:

```text
18:00–20:00
```

Test:

```text
17:00–18:00
→ OK

17:00–19:00
→ overlap

18:00–19:00
→ overlap

19:00–21:00
→ overlap

20:00–21:00
→ OK

17:00–21:00
→ overlap
```

---

# 98. Test concurrency bắt buộc

Hai request đồng thời:

```text
A → A01 19:00
B → A01 19:00
```

Kỳ vọng:

```text
1 request = 201

1 request = 409
```

Không được:

```text
201
201
```

---

# 99. Test state machine

Không cho:

```text
CHO_XAC_NHAN
→ DA_HOAN_THANH

DA_HUY
→ DA_XAC_NHAN

KHONG_DEN
→ DA_CHECK_IN

DA_HOAN_THANH
→ DA_HUY
```

---

# 100. Integration Test Auth

```text
Đăng nhập đúng

Sai mật khẩu

Tài khoản khóa

Token sai

Token hết hạn

Refresh hợp lệ

Refresh sai

Logout
```

---

# 101. Integration Test Permission

Nhân viên:

```text
GET booking
→ 200

PATCH cấu hình
→ 403
```

Admin:

```text
PATCH cấu hình
→ 200
```

Khách hàng:

```text
GET /quan-tri/dat-ban
→ 403
```

---

# 102. API Public không được rò dữ liệu

Public booking lookup không trả:

```text
ghi_chu_noi_bo
nguoi_xac_nhan_id
audit log
```

Public customer không được lấy:

```text
customer list
employee
account
role
permission
```

---

# 103. DTO Response

Không trả Prisma entity thẳng từ mọi endpoint.

Ví dụ:

```text
DatBanChiTietResponseDto

DatBanDanhSachResponseDto

DatBanPublicResponseDto
```

Public và Admin có payload khác nhau.

---

# 104. Mapper

Có thể dùng:

```text
dat-ban.mapper.ts
```

để:

```text
DB entity
→ API DTO
```

đặc biệt để:

```text
BigInt → string

field snake/Prisma
→ field API
```

---

# 105. Tên API tiếng Việt

Giữ:

```text
/dat-ban
/ban-an
/khu-vuc
/khach-hang
/nhan-vien
```

Nhưng source code không dấu:

```text
taoDatBan
timBanTrong
xacNhanDatBan
```

---

# 106. Source code không dùng Unicode identifier

Không:

```typescript
const danhSáchBàn = [];
```

Dùng:

```typescript
const danhSachBan = [];
```

---

# 107. Phân chia public/customer/admin controller

Ví dụ `DatBanModule`:

```text
DatBanController
→ public

DatBanKhachHangController
→ logged-in customer

DatBanQuanTriController
→ staff/admin
```

Không nhồi tất cả endpoint vào một Controller 1000 dòng.

---

# 108. Query Customer List

Admin customer list có thể tận dụng:

```text
v_thong_ke_khach_hang
```

view đã tính:

```text
tong_dat_ban
tong_hoan_thanh
tong_huy
tong_khong_den
lan_dat_gan_nhat
```



---

# 109. Query Booking List

Admin booking list có thể tận dụng:

```text
v_dat_ban_tong_quan
```

view đã group danh sách bàn bằng:

```text
GROUP_CONCAT
```



---

# 110. Nhưng business mutation không dùng View

Không:

```text
UPDATE v_dat_ban_tong_quan
```

Service update trực tiếp:

```text
dat_ban
chi_tiet_dat_ban
```

---

# 111. App startup

Luồng khởi động:

```text
Load env
   ↓
Kết nối MySQL
   ↓
Khởi tạo Prisma
   ↓
Validation
   ↓
Security middleware
   ↓
Swagger
   ↓
Listen
```

---

# 112. README Backend

Phải có:

```text
Yêu cầu

Cài dependencies

Tạo .env

Import SQL

Prisma db pull

Prisma generate

Seed Admin

Start dev

Build

Test

Swagger

Tài khoản Admin
```

Không ghi password thật vào README.

---

# 113. Thứ tự code Backend

## Bước 1

```text
Nest bootstrap

Config

Prisma

Swagger

Global validation

Response

Error handling
```

## Bước 2

```text
Auth

Account

JWT

Refresh Token
```

## Bước 3

```text
Role

Permission

Guard
```

## Bước 4

```text
Customer

Employee
```

## Bước 5

```text
Area

Table

Operating hours

Special dates

Configuration
```

## Bước 6

```text
Available-table engine
```

## Bước 7

```text
Booking

Transaction

Concurrency
```

## Bước 8

```text
Booking workflow
```

## Bước 9

```text
Category

Food

Images
```

## Bước 10

```text
Promotion

Review

Notification
```

## Bước 11

```text
Dashboard

Report

Audit
```

## Bước 12

```text
Test

Swagger cleanup

Seed

README
```

---

# 114. Definition of Done Backend

Một module chỉ được coi là hoàn thành khi có:

```text
Controller

Service

Repository

DTO

Validation

Permission

Error codes

Swagger

Pagination nếu cần

Audit nếu cần

Unit test

Integration test
```

---

# 115. Definition of Done cho Booking

Riêng booking phải đủ:

```text
Tìm bàn trống

Kiểm tra giờ mở cửa

Kiểm tra ngày đặc biệt

Kiểm tra thời gian đặt trước

Kiểm tra số khách

Bàn đơn

Ghép bàn

Transaction

Row lock

Double-booking test

Tạo mã booking

Snapshot customer

Timeline

Confirmation

Check-in

Complete

Cancel

No-show

Customer lookup

Customer history

Admin booking

Audit

Notification
```

Nếu thiếu transaction/concurrency thì **chưa được coi là hoàn thành**.

---

# 116. Kiến trúc Backend cuối

```text
HTTP Request
     │
     ▼
Controller
     │
     ▼
DTO Validation
     │
     ▼
JWT Guard
     │
     ▼
Permission Guard
     │
     ▼
Service
     │
     ├──── Business Rule
     │
     ├──── Workflow
     │
     └──── Transaction
     │
     ▼
Repository
     │
     ▼
Prisma
     │
     ▼
MySQL
```

Cross-cutting:

```text
Audit
Logging
Notification
Configuration
Error handling
Swagger
```

---

# 117. Điểm quan trọng nhất

Hệ thống này không nên được code theo tư duy:

```text
mỗi bảng = một CRUD
```

Mà phải theo:

```text
nghiệp vụ
```

Ví dụ `dat_ban` không chỉ là:

```text
create
read
update
delete
```

mà là:

```text
tìm bàn
→ giữ tính toàn vẹn khi nhiều người đặt
→ xác nhận
→ sắp bàn
→ check-in
→ hoàn thành
→ hủy
→ không đến
→ ghi lịch sử
→ giải phóng bàn
→ audit
→ notification
```

Đây mới là phần biến project từ một bài CRUD thành một hệ thống quản lý nhà hàng đúng nghĩa.

<!-- PHASE11_BACKEND_ADDENDUM -->
# Bổ sung Backend Phase 11

## Dashboard

`DashboardService` giữ query KPI booking theo `ngayChon`, nhưng query booking sắp tới sử dụng mốc thời gian hiện tại và chỉ lấy `CHO_XAC_NHAN` / `DA_XAC_NHAN`. `DA_CHECK_IN` là phục vụ hiện tại, không phải lịch tương lai.

## BanAnService

Danh sách quản trị enrich mỗi bàn bằng `lich_dat_gan_nhat`, query bulk trên toàn bộ ID bàn của page để tránh N+1. Booking hiệu lực gồm `CHO_XAC_NHAN`, `DA_XAC_NHAN`, `DA_CHECK_IN` với `gio_ket_thuc` còn sau thời điểm hiện tại.

## DatBanService

Mọi booking có `tongThanhToanTruoc > 0` tạo `thanh_toan.CHO_THANH_TOAN` trong cùng transaction, không phân biệt booking public hay nội bộ.

## DatBanWorkflowService

`huyQuanTri` nhận nguồn hủy:

- `KHACH_YEU_CAU`: tính tỷ lệ từ cấu hình cutoff/refund; Nhân viên và Admin đều có thể xử lý nếu có `DAT_BAN_HUY`;
- `NHA_HANG_CHU_DONG`: chỉ `QUAN_TRI_VIEN`, tỷ lệ 100%; backend từ chối Nhân viên bằng `403`.

Quyền hoàn tiền không còn là điều kiện để hủy booking; quyền xác nhận hoàn vẫn tách riêng.

## ThanhToanService

`hoanTienDatBanTrongTransaction` tạo ledger `CHO_HOAN` và không tự hoàn `MO_PHONG`. Endpoint xác nhận refund do `HOAN_TIEN_THUC_HIEN` bảo vệ mới chuyển refund `DA_HOAN` và tính lại trạng thái payment.

Danh sách quản trị trả `tongHop` aggregate theo toàn bộ filter.

`huyDatBanQuaHanThanhToan` chỉ xử lý payment pending của booking `nguon_dat = WEBSITE`.

## RBAC

Backend controller tiếp tục là lớp enforcement cuối cùng. Frontend guard chỉ hỗ trợ UX, không thay thế `JwtGuard + QuyenGuard + @CanQuyen`.
