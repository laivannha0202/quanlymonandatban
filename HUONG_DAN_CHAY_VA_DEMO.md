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

<!-- PHASE10_FINANCE_HANDOFF -->
## 8. Thanh toán, hoàn tiền và cấu hình booking

Các cấu hình booking/tài chính quan trọng được quản lý trong hệ thống:

- cho phép đặt món trước;
- yêu cầu thanh toán món trước;
- tiền cọc giữ bàn;
- thời gian thanh toán;
- thời gian tối thiểu cho phép khách tự hủy;
- tỷ lệ hoàn tiền khi hủy đúng hạn.

Để demo thanh toán nội bộ, chạy Backend ở môi trường development với:

```env
PAYMENT_DEMO_ENABLED=true
```

Không bật cờ này mặc định trên production. `MO_PHONG` chỉ phục vụ demo/E2E; kiến trúc payment giữ tách biệt để sau này nối VNPAY/MOMO hoặc gateway khác.

Kịch bản demo tài chính đề xuất:

1. Chọn bàn và chọn ít nhất một món; có thể nhập ghi chú riêng từng món.
2. Áp mã ưu đãi và kiểm tra Backend trả về tạm tính, giảm giá, cọc và tổng trả trước.
3. Tạo booking, xác nhận payment mô phỏng và kiểm tra booking tự chuyển sang `DA_XAC_NHAN`.
4. Mở quản trị Thanh toán để xem giao dịch.
5. Dùng tài khoản Nhân viên hủy booking đã thanh toán; hệ thống tạo yêu cầu hoàn `CHO_HOAN`, không tự xuất tiền.
6. Dùng Admin hoặc tài khoản có `HOAN_TIEN_THUC_HIEN` xác nhận hoàn tiền; payment chuyển `HOAN_MOT_PHAN` hoặc `DA_HOAN_TIEN`.
7. Mở Dashboard/Báo cáo/Thanh toán để đối chiếu đã thu, đã hoàn, thực thu và hàng đợi hoàn tiền.

Database mới import `co-so-du-lieu/quan_ly_nha_hang_mysql.sql`. Database cũ cần áp dụng migration `co-so-du-lieu/20260813_phase10a_dat_mon_thanh_toan.sql` đúng một lần trước khi chạy source mới.

## 9. Kiểm tra trước khi nộp

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

## 10. Những điều không làm

- Không commit `.env`, mật khẩu thật hoặc token.
- Không chạy seed demo trên production.
- Không dùng `prisma pull` như bước khởi động hằng ngày.
- Không sửa SQL và Prisma lệch nhau.
- Không thêm backend thứ hai.
- Không đưa field `snake_case` từ database sang frontend.
- Không lưu refresh token trong JSON/localStorage; refresh token dùng HttpOnly cookie.
- Không bỏ qua lỗi test/build trước khi bàn giao.

## 11. CI

Repository có ba workflow:

- `quality-gate.yml`: backend build + unit và frontend build.
- `security-audit.yml`: npm audit cho backend/frontend.
- `integration-e2e.yml`: MySQL 8.4 + seed + API smoke + booking concurrency + Playwright.

Đây là gate tham chiếu khi merge vào `main`.


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

<!-- PHASE11_BUSINESS_CONSISTENCY -->
## 12. Phase 11 — Chuẩn hóa nghiệp vụ Admin/Nhân viên

Phase 11 không đổi mô hình dữ liệu lõi: hệ thống vẫn có **27 Prisma models / 27 bảng MySQL** và **35 quyền**. Phần thay đổi tập trung vào việc làm rõ nghiệp vụ vận hành và bảo đảm UI, API, RBAC, Dashboard, báo cáo và dữ liệu tài chính cùng một nghĩa.

### 12.1. Dashboard và bàn ăn

- KPI đặt bàn của Dashboard vẫn tính theo ngày đang chọn.
- `datBanGanToi` là lịch tương lai tính từ thời điểm hiện tại và có thể nằm ở các ngày tiếp theo; không bị giới hạn trong ngày Dashboard đang chọn.
- `DA_CHECK_IN` là lượt đang phục vụ, không được trộn vào danh sách lịch tương lai.
- `ban_an.trang_thai` mô tả trạng thái vật lý **hiện tại** của bàn. Một bàn `TRONG` vẫn có thể đã được giữ cho booking tương lai.
- Màn quản trị Bàn ăn hiển thị riêng `Lịch gần nhất`, gồm booking hiệu lực `CHO_XAC_NHAN`, `DA_XAC_NHAN` hoặc `DA_CHECK_IN`. Backend kiểm tra overlap theo khung giờ; không dùng `DANG_SU_DUNG` để biểu diễn đặt chỗ tương lai.

### 12.2. Tạo booking và payment ledger

- Mọi booking có `tong_thanh_toan_truoc > 0` đều phải có một payment ledger `CHO_THANH_TOAN`, kể cả booking do Admin/Nhân viên tạo.
- Booking nội bộ có thể ở `DA_XAC_NHAN` trong khi payment vẫn `CHO_THANH_TOAN`; đây là trạng thái hợp lệ cho đặt qua điện thoại/trực tiếp.
- Timeout thanh toán tự động chỉ áp dụng cho booking nguồn `WEBSITE`, không tự hủy booking nội bộ đang chờ thu.
- Payment pending dùng `MO_PHONG` như giá trị lưu trữ mặc định của schema, nhưng giao diện hiển thị trung tính là **Chưa ghi nhận** cho đến khi phương thức thu thực tế được xác nhận.
- Nhân viên chỉ có `THANH_TOAN_XEM`; xác nhận thu thủ công cần `THANH_TOAN_QUAN_LY`.

### 12.3. Hủy booking và hoàn tiền

Nguồn hủy được phân loại theo policy:

- `KHACH_YEU_CAU`: Nhân viên và Admin đều có thể xử lý; áp dụng `THOI_GIAN_HUY_TRUOC_PHUT` và `TY_LE_HOAN_TIEN_HUY_DUNG_HAN`; nếu hủy quá sát giờ thì vẫn hủy booking nhưng tỷ lệ hoàn là `0%`.
- `NHA_HANG_CHU_DONG`: chỉ `QUAN_TRI_VIEN` được ghi nhận; tỷ lệ hoàn là `100%` phần tiền đã thu.

Hủy booking và xuất tiền là hai hành vi khác nhau:

1. Tài khoản có `DAT_BAN_HUY` được phép xử lý hủy theo yêu cầu khách; nguồn `NHA_HANG_CHU_DONG` còn yêu cầu vai trò `QUAN_TRI_VIEN`.
2. Nếu booking đã thu tiền và có số tiền cần hoàn, hệ thống tạo ledger `hoan_tien` ở trạng thái `CHO_HOAN`.
3. Kể cả payment `MO_PHONG`, hệ thống không tự chuyển refund thành `DA_HOAN`.
4. Chỉ tài khoản có `HOAN_TIEN_THUC_HIEN` mới xác nhận hoàn thực tế.
5. Sau khi xác nhận, payment được tính lại thành `HOAN_MOT_PHAN` hoặc `DA_HOAN_TIEN`.

Cách tách này cho phép Nhân viên tiếp nhận yêu cầu hủy trong vận hành nhưng không có quyền xuất tiền.

### 12.4. Tài chính

Màn **Thanh toán & hoàn tiền** trả summary từ backend trên **toàn bộ bộ lọc**, không cộng riêng các dòng của page hiện tại:

- tổng giao dịch;
- tổng đã thu;
- tổng đã hoàn;
- thực thu = đã thu - đã hoàn;
- số giao dịch chờ thanh toán;
- số yêu cầu hoàn tiền chờ xử lý.

Dashboard và Báo cáo cũng đọc số tiền đã thu từ `thanh_toan` và số tiền hoàn thực tế từ `hoan_tien` trạng thái `DA_HOAN`.

### 12.5. RBAC vận hành

`QUAN_TRI_VIEN` có toàn bộ quyền. `NHAN_VIEN` tập trung vào nghiệp vụ phục vụ: xem Dashboard, booking, bàn/khu vực/menu/khách/đánh giá/thanh toán; tạo/sửa/xác nhận/xếp bàn/check-in/hoàn thành/hủy/no-show booking; sửa thông tin khách.

Nhân viên không có các quyền quản trị nhạy cảm như quản lý nhân sự, cấu hình, báo cáo quản trị, sửa menu/khu vực/bàn, xác nhận thu tiền thủ công hoặc thực hiện hoàn tiền.

Sidebar và route guard dùng cùng semantics **đủ tất cả quyền** cho màn có dependency kép, ví dụ:

- Bàn ăn: `BAN_AN_XEM` + `KHU_VUC_XEM`;
- Món ăn: `MON_AN_XEM` + `DANH_MUC_MON_XEM`.

### 12.6. Validation đặt bàn

Email là tùy chọn. Chuỗi rỗng hoặc chỉ có khoảng trắng được chuẩn hóa thành `undefined` trước `@IsOptional()` / `@IsEmail()`. Nếu người dùng nhập email không rỗng nhưng sai định dạng, frontend phải chặn ngay ở bước thông tin trước khi chuyển sang tìm bàn.
