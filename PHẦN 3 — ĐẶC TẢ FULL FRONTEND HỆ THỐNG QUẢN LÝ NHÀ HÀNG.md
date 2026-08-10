# PHẦN 3 — ĐẶC TẢ FULL FRONTEND HỆ THỐNG QUẢN LÝ NHÀ HÀNG

# 1. Mục tiêu Frontend

Frontend được xây dựng bằng:

```text
ReactJS
TypeScript
Vite
Ant Design
React Router
TanStack Query
Axios
Zustand
React Hook Form
Day.js
Recharts
```

Frontend gồm hai khu vực:

```text
1. Khách hàng
2. Quản trị
```

Hai khu vực dùng chung:

```text
API client
Authentication
TypeScript types
Utils
Error handling
Notification
Loading component
Permission
```

nhưng tách riêng:

```text
Layout
Route
Page
Menu
Business component
```

---

# 2. Cấu trúc Frontend chi tiết

```text
giao-dien/
│
├── src/
│   │
│   ├── api/
│   │   ├── axios.ts
│   │   ├── api-xac-thuc.ts
│   │   ├── api-trang-chu.ts
│   │   ├── api-mon-an.ts
│   │   ├── api-danh-muc-mon.ts
│   │   ├── api-dat-ban.ts
│   │   ├── api-ban-an.ts
│   │   ├── api-khu-vuc.ts
│   │   ├── api-khach-hang.ts
│   │   ├── api-nhan-vien.ts
│   │   ├── api-khuyen-mai.ts
│   │   ├── api-danh-gia.ts
│   │   ├── api-dashboard.ts
│   │   ├── api-bao-cao.ts
│   │   ├── api-nhat-ky.ts
│   │   └── api-cau-hinh.ts
│   │
│   ├── bo-cuc/
│   │   ├── khach-hang/
│   │   │   ├── bo-cuc-khach-hang.tsx
│   │   │   ├── dau-trang.tsx
│   │   │   └── chan-trang.tsx
│   │   │
│   │   └── quan-tri/
│   │       ├── bo-cuc-quan-tri.tsx
│   │       ├── thanh-ben.tsx
│   │       └── thanh-tren.tsx
│   │
│   ├── thanh-phan/
│   │   ├── dung-chung/
│   │   │   ├── tai-trang.tsx
│   │   │   ├── trang-thai-rong.tsx
│   │   │   ├── trang-loi.tsx
│   │   │   ├── nut-xac-nhan.tsx
│   │   │   ├── hop-xac-nhan.tsx
│   │   │   ├── anh-du-phong.tsx
│   │   │   └── phan-trang.tsx
│   │   │
│   │   ├── dat-ban/
│   │   ├── ban-an/
│   │   ├── mon-an/
│   │   ├── khach-hang/
│   │   └── dashboard/
│   │
│   ├── trang/
│   │   ├── khach-hang/
│   │   ├── quan-tri/
│   │   └── xac-thuc/
│   │
│   ├── stores/
│   │   ├── auth.store.ts
│   │   └── giao-dien.store.ts
│   │
│   ├── hooks/
│   │   ├── use-quyen.ts
│   │   ├── use-phan-trang.ts
│   │   ├── use-bo-loc-url.ts
│   │   └── use-debounce.ts
│   │
│   ├── kieu-du-lieu/
│   │   ├── api.ts
│   │   ├── tai-khoan.ts
│   │   ├── dat-ban.ts
│   │   ├── ban-an.ts
│   │   ├── mon-an.ts
│   │   └── dashboard.ts
│   │
│   ├── hang-so/
│   │   ├── route.ts
│   │   ├── trang-thai.ts
│   │   ├── quyen.ts
│   │   └── cau-hinh.ts
│   │
│   ├── tien-ich/
│   │   ├── dinh-dang-ngay.ts
│   │   ├── dinh-dang-gio.ts
│   │   ├── dinh-dang-tien.ts
│   │   ├── xu-ly-loi.ts
│   │   └── tao-query.ts
│   │
│   ├── dinh-tuyen/
│   │   ├── dinh-tuyen-khach.tsx
│   │   ├── dinh-tuyen-admin.tsx
│   │   ├── bao-ve-dang-nhap.tsx
│   │   └── bao-ve-quyen.tsx
│   │
│   ├── App.tsx
│   └── main.tsx
```

---

# 3. Nguyên tắc giao diện chung

Toàn bộ giao diện phải có:

```text
Loading
Error
Empty state
Success message
Validation
Responsive
Permission
Confirmation
```

Không để page chỉ có:

```text
Table + CRUD
```

mà thiếu trải nghiệm người dùng.

---

# 4. Ant Design component dùng chung

```text
Layout
Menu
Breadcrumb
Button
Card
Table
Form
Input
InputNumber
Select
DatePicker
TimePicker
Modal
Drawer
Tabs
Tag
Badge
Statistic
Descriptions
Avatar
Dropdown
Upload
Image
Tooltip
Popconfirm
Alert
Result
Skeleton
Spin
Empty
Pagination
Timeline
Steps
Switch
Radio
Checkbox
Rate
```

---

# 5. Responsive breakpoint

```text
Mobile:
< 768px

Tablet:
768px – 1199px

Desktop:
>= 1200px
```

Khách hàng:

```text
Mobile-first
```

Admin:

```text
Desktop-first
```

nhưng vẫn sử dụng được trên tablet.

---

# 6. Layout khách hàng

Header desktop:

```text
┌──────────────────────────────────────────────┐
│ Logo │ Trang chủ │ Thực đơn │ Đặt bàn │ ... │
│                                Đăng nhập     │
└──────────────────────────────────────────────┘
```

Nếu đăng nhập:

```text
Avatar
Tên khách
Dropdown
```

Dropdown:

```text
Hồ sơ
Lịch đặt bàn
Đánh giá
Đăng xuất
```

Mobile:

```text
Logo
Menu hamburger
```

---

# 7. Footer khách hàng

Hiển thị:

```text
Tên nhà hàng
Địa chỉ
Điện thoại
Email
Giờ mở cửa
Facebook
Website
Thông tin liên hệ
Bản quyền
```

Dữ liệu lấy từ:

```http
GET /api/v1/thong-tin-nha-hang
```

Không hard-code.

---

# 8. KH01 — Trang chủ

Route:

```text
/
```

## Mục tiêu

Giới thiệu nhà hàng và dẫn khách đến đặt bàn.

## Thành phần

### Hero

```text
Tên nhà hàng
Mô tả ngắn
Ảnh lớn
Nút "Đặt bàn ngay"
Nút "Xem thực đơn"
```

Ant Design:

```text
Row
Col
Button
Image
Typography
```

---

# 9. KH01 — Món nổi bật

Hiển thị:

```text
6–8 món
```

Card:

```text
Ảnh
Tên món
Giá
Giá khuyến mãi
Nhãn nổi bật
```

API:

```http
GET /api/v1/mon-an/noi-bat
```

Click:

```text
/mon-an/:duongDan
```

---

# 10. KH01 — Khu vực đặt bàn

Hiển thị:

```text
Ảnh khu vực
Tên khu vực
Mô tả
Số bàn
```

Ví dụ:

```text
Trong nhà
Ngoài trời
Phòng VIP
```

Nút:

```text
Đặt bàn khu vực này
```

---

# 11. KH01 — Đánh giá khách hàng

Hiển thị:

```text
Tên khách
Số sao
Nội dung
Ngày đánh giá
```

Chỉ hiển thị đánh giá:

```text
hienThi = true
```

---

# 12. KH01 — CTA cuối trang

```text
Bạn đã sẵn sàng đặt bàn?

[Đặt bàn ngay]
```

---

# 13. KH02 — Trang thực đơn

Route:

```text
/thuc-don
```

## Layout desktop

```text
┌──────────────────────────────────────────┐
│              THỰC ĐƠN                   │
├─────────┬────────────────────────────────┤
│ Bộ lọc  │ Danh sách món                 │
│         │                                │
│         │ Card Card Card                 │
└─────────┴────────────────────────────────┘
```

Mobile:

```text
Search
Filter button

Card
Card
Card
```

---

# 14. KH02 — Bộ lọc

Field:

```text
Từ khóa
Danh mục
Khoảng giá
Tình trạng còn món
Sắp xếp
```

Sắp xếp:

```text
Mặc định
Giá thấp → cao
Giá cao → thấp
Tên A → Z
Mới nhất
```

API:

```http
GET /api/v1/mon-an
```

Query:

```text
?trang=1
&kichThuoc=12
&tuKhoa=
&danhMucId=
&giaTu=
&giaDen=
&conMon=true
&sapXep=gia-tang
```

---

# 15. KH02 — Card món

Hiển thị:

```text
Ảnh món
Tên món
Tên danh mục
Giá
Giá khuyến mãi
Nhãn:
  Nổi bật
  Hết món
```

Click card:

```text
/mon-an/:duongDan
```

---

# 16. KH02 — Empty state

Nếu không có món:

```text
Không tìm thấy món phù hợp.
```

Có button:

```text
Xóa bộ lọc
```

---

# 17. KH03 — Chi tiết món

Route:

```text
/mon-an/:duongDan
```

Layout:

```text
Ảnh món
Tên
Danh mục
Giá
Giá khuyến mãi
Mô tả
Trạng thái
```

Nếu hết món:

```text
Tag: Tạm hết món
```

Dưới cùng:

```text
Món cùng danh mục
```

API:

```http
GET /api/v1/mon-an/:duongDan
```

---

# 18. KH04 — Trang đặt bàn

Route:

```text
/dat-ban
```

Đây là page quan trọng nhất phía khách hàng.

Nên thiết kế dạng Steps.

```text
1. Thời gian
2. Chọn bàn
3. Thông tin
4. Xác nhận
```

Ant Design:

```text
Steps
Form
DatePicker
TimePicker
InputNumber
Select
Card
Radio
Button
Alert
```

---

# 19. KH04 — Bước 1: Thời gian

Field:

```text
Ngày đặt *
Giờ *
Số người *
Khu vực
```

Validation:

```text
Ngày không được trong quá khứ

Giờ phải nằm trong giờ mở cửa

Số người >= 1

Không vượt số người tối đa

Phải đặt trước tối thiểu X phút
```

Button:

```text
Tìm bàn
```

API:

```http
GET /api/v1/ban-an/tim-ban-trong
```

---

# 20. KH04 — Hiển thị giờ

Không nên bắt khách nhập giờ tự do.

Nên hiển thị slot:

```text
10:00
10:30
11:00
11:30
...
20:30
21:00
```

Slot được tính từ cấu hình nhà hàng.

Backend vẫn kiểm tra lại.

---

# 21. KH05 — Chọn bàn

Sau khi tìm bàn.

Hiển thị:

```text
Khu vực
Mã bàn
Tên bàn
Sức chứa
```

Ví dụ card:

```text
┌──────────────────┐
│ Bàn A05          │
│ Trong nhà        │
│ 2–4 người        │
│                  │
│ [Chọn bàn]       │
└──────────────────┘
```

Nếu hệ thống tự xếp:

```text
Để nhà hàng sắp bàn phù hợp
```

nên là lựa chọn mặc định.

---

# 22. Trường hợp ghép bàn

Ví dụ:

```text
8 khách
```

Hiển thị:

```text
Gợi ý:
A01 + A02

Tổng sức chứa: 8
```

Không cần bắt khách hiểu logic kỹ thuật của việc ghép bàn.

---

# 23. KH04 — Bước 3 thông tin khách

Field:

```text
Họ tên *
Số điện thoại *
Email
Ghi chú
```

Nếu đăng nhập:

```text
Tự động điền từ hồ sơ
```

Khách vẫn được sửa thông tin cho booking này.

---

# 24. Validation số điện thoại

Frontend chỉ kiểm tra định dạng cơ bản.

Backend quyết định cuối cùng.

Không viết regex quá cứng khiến khách không thể nhập số quốc tế.

---

# 25. KH04 — Bước xác nhận

Hiển thị summary:

```text
Ngày:
20/08/2026

Giờ:
19:00 – 21:00

Số khách:
4

Khu vực:
Trong nhà

Bàn:
A05

Khách:
Nguyễn Văn A

Điện thoại:
0909123456

Ghi chú:
Gần cửa sổ
```

Button:

```text
Quay lại
Xác nhận đặt bàn
```

---

# 26. Loading khi tạo booking

Sau khi nhấn:

```text
Xác nhận đặt bàn
```

button phải:

```text
loading
disabled
```

tránh click hai lần.

---

# 27. Xử lý lỗi double booking

Nếu API trả:

```text
BAN_KHONG_CON_TRONG
```

hiển thị Modal:

```text
Bàn vừa được khách khác đặt

Rất tiếc, bàn bạn chọn không còn trống.

[Chọn bàn khác]
```

Sau đó gọi lại API tìm bàn.

---

# 28. KH06 — Đặt bàn thành công

Route:

```text
/dat-ban/thanh-cong/:maDatBan
```

Ant Design:

```text
Result
Descriptions
Button
```

Hiển thị:

```text
Đặt bàn thành công

Mã đặt bàn:
DB202608200001

Ngày
Giờ
Số người
Bàn
Khu vực

Trạng thái:
Chờ xác nhận
```

Button:

```text
Xem đặt bàn
Về trang chủ
```

Nếu chưa đăng nhập:

```text
Lưu lại mã đặt bàn để tra cứu sau.
```

---

# 29. KH07 — Tra cứu đặt bàn

Route:

```text
/tra-cuu-dat-ban
```

Form:

```text
Mã đặt bàn *
Số điện thoại *
```

Button:

```text
Tra cứu
```

API:

```http
POST /api/v1/dat-ban/tra-cuu
```

---

# 30. KH07 — Kết quả tra cứu

Hiển thị:

```text
Mã đặt
Tên khách
Ngày
Giờ
Số người
Bàn
Khu vực
Trạng thái
Ghi chú
```

Status dùng Tag:

```text
Chờ xác nhận
Đã xác nhận
Đã check-in
Hoàn thành
Đã hủy
Không đến
```

---

# 31. KH08 — Đăng nhập

Route:

```text
/dang-nhap
```

Form:

```text
Email hoặc tên đăng nhập
Mật khẩu
Ghi nhớ đăng nhập
```

Button:

```text
Đăng nhập
```

Link:

```text
Quên mật khẩu
Chưa có tài khoản? Đăng ký
```

API:

```http
POST /api/v1/xac-thuc/dang-nhap
```

---

# 32. KH09 — Đăng ký

Route:

```text
/dang-ky
```

Field:

```text
Họ tên
Số điện thoại
Email
Mật khẩu
Xác nhận mật khẩu
```

Validation:

```text
Email hợp lệ
Mật khẩu đủ yêu cầu
Hai mật khẩu khớp
```

API:

```http
POST /api/v1/xac-thuc/dang-ky
```

---

# 33. KH10 — Hồ sơ

Route:

```text
/tai-khoan/ho-so
```

Field:

```text
Họ tên
Số điện thoại
Email
Ngày sinh
Giới tính
```

Button:

```text
Lưu thay đổi
```

API:

```http
GET /api/v1/khach-hang/ho-so
PATCH /api/v1/khach-hang/ho-so
```

---

# 34. KH11 — Lịch sử đặt bàn

Route:

```text
/tai-khoan/dat-ban
```

Desktop:

```text
Table
```

Mobile:

```text
Card list
```

Column:

```text
Mã đặt
Ngày
Giờ
Số người
Bàn
Trạng thái
Thao tác
```

Filter:

```text
Khoảng ngày
Trạng thái
```

API:

```http
GET /api/v1/khach-hang/dat-ban
```

---

# 35. KH12 — Chi tiết đặt bàn

Route:

```text
/tai-khoan/dat-ban/:id
```

Hiển thị:

```text
Thông tin booking

Thông tin bàn

Thông tin liên hệ

Trạng thái

Timeline trạng thái
```

Ant Design:

```text
Descriptions
Tag
Timeline
Card
Button
```

---

# 36. KH12 — Button hủy

Chỉ hiển thị khi nghiệp vụ cho phép.

Ví dụ:

```text
CHO_XAC_NHAN
DA_XAC_NHAN
```

và còn đủ thời gian hủy.

Button:

```text
Hủy đặt bàn
```

Click mở Modal:

```text
Lý do hủy
```

API:

```http
PATCH /api/v1/khach-hang/dat-ban/:id/huy
```

---

# 37. KH13 — Đánh giá

Route:

```text
/tai-khoan/danh-gia
```

Form:

```text
Số sao
Nội dung
```

Ant Design:

```text
Rate
Input.TextArea
Button
```

Khuyến nghị nghiệp vụ:

Chỉ khách có ít nhất một booking:

```text
DA_HOAN_THANH
```

mới được đánh giá.

---

# 38. Layout Admin

Desktop:

```text
┌───────────┬───────────────────────────────┐
│ Sidebar   │ Header                        │
│           ├───────────────────────────────┤
│ Dashboard │                               │
│ Đặt bàn   │          Nội dung             │
│ Bàn       │                               │
│ Món       │                               │
│ ...       │                               │
└───────────┴───────────────────────────────┘
```

Ant Design:

```text
Layout
Sider
Header
Content
Menu
Dropdown
Avatar
Breadcrumb
```

---

# 39. Sidebar Admin

```text
Tổng quan

Đặt bàn

Nhà hàng
 ├─ Sơ đồ bàn
 ├─ Bàn ăn
 └─ Khu vực

Thực đơn
 ├─ Món ăn
 └─ Danh mục

Khách hàng

Nhân viên

Khuyến mãi

Đánh giá

Báo cáo

Hệ thống
 ├─ Tài khoản
 ├─ Vai trò
 ├─ Nhật ký
 └─ Cấu hình
```

Menu được render theo permission.

---

# 40. Header Admin

Trái:

```text
Breadcrumb
```

Phải:

```text
Notification
Avatar
Tên nhân viên
Dropdown
```

Dropdown:

```text
Tài khoản
Đổi mật khẩu
Đăng xuất
```

---

# 41. AD01 — Đăng nhập Admin

Route:

```text
/quan-tri/dang-nhap
```

Form:

```text
Email / tên đăng nhập
Mật khẩu
```

Nếu role:

```text
KHACH_HANG
```

không được vào Admin.

Trả:

```text
KHONG_CO_QUYEN
```

---

# 42. AD02 — Dashboard

Route:

```text
/quan-tri/tong-quan
```

Đầu trang:

```text
Hôm nay
DatePicker
Refresh
```

---

# 43. Dashboard — Statistic cards

Card 1:

```text
Đặt bàn hôm nay
```

Card 2:

```text
Chờ xác nhận
```

Card 3:

```text
Khách hôm nay
```

Card 4:

```text
Bàn đang sử dụng
```

Card 5:

```text
Bàn trống
```

Card 6:

```text
Tỷ lệ không đến
```

Ant Design:

```text
Card
Statistic
```

---

# 44. Dashboard — Booking sắp tới

Table:

```text
Giờ
Mã
Khách
Số người
Bàn
Trạng thái
```

Chỉ hiển thị:

```text
5–10 booking sắp tới
```

Button:

```text
Xem tất cả
```

---

# 45. Dashboard — Biểu đồ

Biểu đồ:

```text
Đặt bàn 7 ngày

Khách theo khung giờ

Booking theo trạng thái

Booking theo khu vực
```

API:

```http
GET /api/v1/quan-tri/dashboard/tong-quan
GET /api/v1/quan-tri/dashboard/dat-ban-7-ngay
GET /api/v1/quan-tri/dashboard/khach-theo-khung-gio
GET /api/v1/quan-tri/dashboard/trang-thai-ban
```

---

# 46. AD03 — Danh sách đặt bàn

Route:

```text
/quan-tri/dat-ban
```

Toolbar:

```text
[Tạo đặt bàn]

Từ khóa
Ngày
Trạng thái
Khu vực
Nguồn đặt
```

---

# 47. AD03 — Table booking

Columns:

```text
Mã đặt bàn

Khách hàng

Điện thoại

Ngày

Giờ

Số người

Bàn

Nguồn

Trạng thái

Thao tác
```

Thao tác:

```text
Xem
Sửa
Xác nhận
Check-in
Hoàn thành
Hủy
```

Button phải thay đổi theo trạng thái.

---

# 48. Ví dụ action theo trạng thái

## CHO_XAC_NHAN

```text
Xem
Sửa
Xác nhận
Hủy
```

## DA_XAC_NHAN

```text
Xem
Sửa
Check-in
Hủy
Không đến
```

## DA_CHECK_IN

```text
Xem
Hoàn thành
```

## DA_HOAN_THANH

```text
Xem
```

## DA_HUY

```text
Xem
```

---

# 49. AD03 — Filter URL

Filter nên lưu trên URL.

Ví dụ:

```text
/quan-tri/dat-ban
?trang=2
&trangThai=DA_XAC_NHAN
&ngay=2026-08-20
&tuKhoa=0909
```

Lợi ích:

```text
Refresh không mất filter
Có thể copy link
Back/forward hoạt động đúng
```

---

# 50. AD04 — Chi tiết đặt bàn

Route:

```text
/quan-tri/dat-ban/:id
```

Layout 2 cột.

Trái:

```text
Thông tin đặt bàn
Thông tin khách
Thông tin bàn
Ghi chú
```

Phải:

```text
Trạng thái
Action
Timeline lịch sử
```

---

# 51. Thông tin đặt bàn

Descriptions:

```text
Mã đặt
Ngày
Giờ bắt đầu
Giờ kết thúc
Số người
Nguồn
Ngày tạo
```

---

# 52. Thông tin khách

```text
Họ tên
Điện thoại
Email
```

Button:

```text
Xem hồ sơ khách
```

nếu có customer account.

---

# 53. Thông tin bàn

Hiển thị:

```text
Bàn A01
Bàn A02
Khu vực
Tổng sức chứa
```

Button:

```text
Sắp lại bàn
```

---

# 54. Timeline booking

Ví dụ:

```text
18/08 10:32
Tạo đặt bàn

18/08 10:40
Nguyễn Văn B xác nhận

20/08 18:58
Nguyễn Văn C check-in

20/08 20:35
Nguyễn Văn C hoàn thành
```

API:

```http
GET /api/v1/quan-tri/dat-ban/:id/lich-su
```

---

# 55. AD05 — Tạo đặt bàn

Route:

```text
/quan-tri/dat-ban/tao-moi
```

Form chia section.

### Khách hàng

```text
Số điện thoại
Họ tên
Email
```

Khi nhập số điện thoại:

```text
debounce
```

gọi API tìm khách.

Nếu có:

```text
Tự động điền
```

---

# 56. AD05 — Booking info

```text
Ngày
Giờ
Số người
Khu vực
Bàn
Nguồn đặt
```

Nguồn:

```text
Điện thoại
Facebook
Trực tiếp
Website
Khác
```

---

# 57. AD05 — Ghi chú

```text
Ghi chú khách

Ghi chú nội bộ
```

`ghiChuNoiBo` không được hiển thị cho khách.

---

# 58. AD05 — Trạng thái lúc tạo

Admin có thể chọn:

```text
Chờ xác nhận
Đã xác nhận
```

Nếu booking được xác nhận qua điện thoại:

```text
DA_XAC_NHAN
```

---

# 59. AD06 — Sơ đồ bàn

Route:

```text
/quan-tri/so-do-ban
```

Đây là màn hình vận hành realtime.

Toolbar:

```text
Ngày
Giờ
Khu vực
Refresh
```

---

# 60. Card bàn

Ví dụ:

```text
┌─────────────────┐
│ A01             │
│ 4 khách         │
│                 │
│ Đang sử dụng    │
│ Nguyễn Văn A    │
│ 19:00–21:00     │
└─────────────────┘
```

Trạng thái hiển thị:

```text
Trống
Sắp có khách
Đã đặt
Đang sử dụng
Bảo trì
Ngừng sử dụng
```

Lưu ý:

```text
"Sắp có khách"
```

là trạng thái UI suy ra từ booking, không phải trạng thái lưu trực tiếp trong `ban_an`.

---

# 61. Click bàn

Mở Drawer.

Hiển thị:

```text
Thông tin bàn
Booking hiện tại
Booking tiếp theo
Sức chứa
Khu vực
```

Action:

```text
Tạo booking cho bàn
Check-in
Xem booking
Chuyển bảo trì
```

tùy trạng thái.

---

# 62. AD07 — Quản lý khu vực

Route:

```text
/quan-tri/khu-vuc
```

Table:

```text
Mã
Tên
Mô tả
Số bàn
Thứ tự
Trạng thái
Thao tác
```

Button:

```text
Thêm khu vực
```

---

# 63. Modal khu vực

Field:

```text
Mã khu vực
Tên khu vực
Mô tả
Thứ tự
Trạng thái
```

Validation:

```text
Mã không trùng
Tên bắt buộc
```

---

# 64. AD08 — Danh sách bàn

Route:

```text
/quan-tri/ban-an
```

Filter:

```text
Từ khóa
Khu vực
Trạng thái
Sức chứa
```

Table:

```text
Mã bàn
Tên bàn
Khu vực
Sức chứa
Sức chứa tối đa
Trạng thái
Thao tác
```

---

# 65. Form bàn

Field:

```text
Mã bàn
Tên bàn
Khu vực
Sức chứa
Sức chứa tối đa
Trạng thái
Ghi chú
```

Rule:

```text
sucChuaToiDa >= sucChua
```

Không cho xóa bàn nếu có booking tương lai đang hoạt động.

---

# 66. AD09 — Danh sách món

Route:

```text
/quan-tri/mon-an
```

Toolbar:

```text
Thêm món
Tìm kiếm
Danh mục
Còn món
Nổi bật
Trạng thái
```

Table:

```text
Ảnh
Mã món
Tên món
Danh mục
Giá
Giá khuyến mãi
Còn món
Nổi bật
Trạng thái
Thao tác
```

---

# 67. Quick action món

Switch trực tiếp:

```text
Còn món
Nổi bật
```

API:

```http
PATCH /api/v1/quan-tri/mon-an/:id/con-mon
PATCH /api/v1/quan-tri/mon-an/:id/noi-bat
```

Phải có optimistic UI hoặc loading riêng cho từng row.

---

# 68. AD09 — Form món

Route:

```text
/quan-tri/mon-an/tao-moi
```

và:

```text
/quan-tri/mon-an/:id/chinh-sua
```

Field:

```text
Mã món
Tên món
Danh mục
Mô tả
Giá
Giá khuyến mãi
Ảnh
Còn món
Nổi bật
Trạng thái
```

---

# 69. Upload ảnh

Ant Design:

```text
Upload
Image
```

Frontend:

```text
Kiểm tra loại file
Kiểm tra kích thước
Preview
```

Backend vẫn validate lại.

---

# 70. AD10 — Danh mục món

Route:

```text
/quan-tri/danh-muc-mon
```

Table:

```text
Ảnh
Tên danh mục
Đường dẫn
Số món
Thứ tự
Trạng thái
Thao tác
```

Có thể hỗ trợ drag-and-drop thứ tự sau.

Version đầu:

```text
InputNumber thuTu
```

là đủ.

---

# 71. AD11 — Khách hàng

Route:

```text
/quan-tri/khach-hang
```

Filter:

```text
Tên
Số điện thoại
Email
Trạng thái
```

Table:

```text
Khách
Điện thoại
Email
Tổng booking
Đã hoàn thành
Đã hủy
Không đến
Lần gần nhất
Trạng thái
```

---

# 72. AD12 — Chi tiết khách

Route:

```text
/quan-tri/khach-hang/:id
```

Tabs:

```text
Thông tin

Lịch sử đặt bàn

Đánh giá

Ghi chú
```

Summary card:

```text
Tổng lượt đặt
Hoàn thành
Hủy
Không đến
```

---

# 73. Khóa khách hàng

Không xóa.

Action:

```text
Khóa tài khoản
Mở khóa
```

Modal xác nhận bắt buộc.

---

# 74. AD13 — Nhân viên

Route:

```text
/quan-tri/nhan-vien
```

Table:

```text
Mã NV
Họ tên
Điện thoại
Email
Vai trò
Trạng thái
Lần đăng nhập cuối
Thao tác
```

Button:

```text
Thêm nhân viên
```

---

# 75. Form nhân viên

Field:

```text
Mã nhân viên
Họ tên
Điện thoại
Email
Tên đăng nhập
Vai trò
Trạng thái
```

Khi tạo mới:

```text
Mật khẩu tạm
```

Khuyến nghị:

Buộc nhân viên đổi mật khẩu sau lần đăng nhập đầu tiên.

---

# 76. AD14 — Khuyến mãi

Route:

```text
/quan-tri/khuyen-mai
```

Table:

```text
Mã
Tên
Loại giảm
Giá trị
Ngày bắt đầu
Ngày kết thúc
Số lượt
Trạng thái
```

Filter:

```text
Từ khóa
Trạng thái
Thời gian
```

---

# 77. Form khuyến mãi

Field:

```text
Mã
Tên
Mô tả
Loại giảm
Giá trị
Ngày bắt đầu
Ngày kết thúc
Số lượt tối đa
Trạng thái
```

Loại giảm:

```text
Phần trăm
Số tiền
```

Validation:

Nếu phần trăm:

```text
0 < giaTri <= 100
```

---

# 78. AD15 — Đánh giá

Route:

```text
/quan-tri/danh-gia
```

Table:

```text
Khách
Số sao
Nội dung
Ngày
Hiển thị
Phản hồi
```

Filter:

```text
Số sao
Hiển thị
Khoảng ngày
```

Action:

```text
Xem
Ẩn
Hiện
Phản hồi
```

---

# 79. Phản hồi đánh giá

Drawer/Modal:

```text
Nội dung khách

Số sao

Nội dung phản hồi
```

Button:

```text
Lưu phản hồi
```

---

# 80. AD16 — Báo cáo

Route:

```text
/quan-tri/bao-cao
```

Tabs:

```text
Đặt bàn
Khách hàng
Bàn ăn
Khung giờ
Hủy bàn
Không đến
```

---

# 81. Filter báo cáo

Chung:

```text
Từ ngày
Đến ngày
Khu vực
```

Button:

```text
Áp dụng
Đặt lại
```

---

# 82. Báo cáo đặt bàn

Statistic:

```text
Tổng booking
Hoàn thành
Hủy
Không đến
Tỷ lệ hoàn thành
```

Chart:

```text
Booking theo ngày
```

Table:

```text
Ngày
Tổng
Hoàn thành
Hủy
Không đến
```

---

# 83. Báo cáo khách hàng

```text
Khách mới
Khách quay lại
Tổng khách
```

Chart:

```text
Khách mới / quay lại
```

Table:

```text
Khách
Số lượt
Lần gần nhất
```

---

# 84. Báo cáo bàn

Hiển thị:

```text
Bàn
Khu vực
Số lượt sử dụng
Tổng số khách
```

Giúp tìm:

```text
Bàn được dùng nhiều nhất
Bàn ít được dùng
```

---

# 85. Báo cáo khung giờ

Chart:

```text
10:00
11:00
12:00
...
```

Hiển thị:

```text
Số booking
Số khách
```

Giúp nhà hàng xác định giờ cao điểm.

---

# 86. AD17 — Tài khoản

Route:

```text
/quan-tri/tai-khoan
```

Table:

```text
Tên đăng nhập
Email
Vai trò
Trạng thái
Đăng nhập cuối
Ngày tạo
```

Action:

```text
Khóa
Mở khóa
Đặt lại mật khẩu
```

---

# 87. AD18 — Vai trò và quyền

Route:

```text
/quan-tri/vai-tro
```

Danh sách:

```text
QUAN_TRI_VIEN
NHAN_VIEN
```

Có thể mở rộng:

```text
QUAN_LY
LE_TAN
THU_NGAN
```

---

# 88. Permission matrix

Ví dụ:

| Quyền | Admin | Nhân viên |
|---|---|---|
| Xem booking | ✓ | ✓ |
| Tạo booking | ✓ | ✓ |
| Xác nhận | ✓ | ✓ |
| Quản lý món | ✓ | |
| Quản lý nhân viên | ✓ | |
| Cấu hình | ✓ | |
| Báo cáo | ✓ | tùy quyền |

Ant Design:

```text
Table
Checkbox
```

---

# 89. AD19 — Nhật ký hoạt động

Route:

```text
/quan-tri/nhat-ky
```

Filter:

```text
Nhân viên
Hành động
Đối tượng
Khoảng thời gian
```

Table:

```text
Thời gian
Nhân viên
Hành động
Đối tượng
ID
IP
```

Click:

```text
Xem chi tiết
```

---

# 90. Chi tiết nhật ký

Drawer:

```text
Thông tin chung

Dữ liệu trước

Dữ liệu sau
```

JSON có thể hiển thị dạng:

```text
Descriptions
```

hoặc formatted JSON.

---

# 91. AD20 — Cấu hình hệ thống

Route:

```text
/quan-tri/cau-hinh
```

Tabs:

```text
Thông tin nhà hàng

Đặt bàn

Giờ hoạt động

Liên hệ

Mạng xã hội

Hệ thống
```

---

# 92. Cấu hình thông tin nhà hàng

```text
Tên nhà hàng
Logo
Địa chỉ
Số điện thoại
Email
Mô tả
```

---

# 93. Cấu hình đặt bàn

```text
Cho phép đặt bàn

Thời lượng mặc định

Thời gian đặt trước tối thiểu

Số ngày đặt trước tối đa

Thời gian chờ khách

Số khách tối đa / booking

Cho phép khách chọn bàn
```

---

# 94. Cấu hình giờ hoạt động

Không nên chỉ có:

```text
gio_mo_cua
gio_dong_cua
```

vì mỗi ngày có thể khác.

Giao diện nên hỗ trợ:

```text
Thứ Hai    10:00 → 22:00
Thứ Ba     10:00 → 22:00
Thứ Tư     10:00 → 22:00
...
Chủ Nhật   08:00 → 22:00
```

và:

```text
Đóng cửa
```

cho từng ngày.

Database về sau nên tách bảng:

```text
gio_hoat_dong
```

---

# 95. Route Guard

Khách chưa đăng nhập mà mở:

```text
/tai-khoan/*
```

redirect:

```text
/dang-nhap?quayLai=/tai-khoan/dat-ban
```

Sau khi đăng nhập:

```text
quay lại URL cũ
```

---

# 96. Admin Guard

Nếu chưa login:

```text
/quan-tri/*
```

redirect:

```text
/quan-tri/dang-nhap
```

Nếu có login nhưng không đủ quyền:

```text
403
```

Không redirect vô hạn.

---

# 97. Page 403

Dùng:

```text
Result
```

Nội dung:

```text
Bạn không có quyền truy cập chức năng này.
```

Button:

```text
Quay lại
Về tổng quan
```

---

# 98. Page 404

```text
Không tìm thấy trang.
```

Button:

```text
Về trang chủ
```

Admin:

```text
Về tổng quan
```

---

# 99. Loading strategy

Không dùng một spinner toàn màn hình cho mọi thứ.

Danh sách:

```text
Table loading
```

Card:

```text
Skeleton
```

Button submit:

```text
Button loading
```

Page lần đầu:

```text
Skeleton
```

---

# 100. Error handling toàn hệ thống

Axios interceptor xử lý:

```text
401
403
429
500
Network error
```

Nhưng lỗi nghiệp vụ:

```text
BAN_KHONG_CON_TRONG
DAT_BAN_DA_HUY
KHONG_DUOC_HUY_DAT_BAN
```

phải được page/component xử lý theo ngữ cảnh.

---

# 101. Axios request interceptor

Request:

```typescript
api.interceptors.request.use((config) => {
  const token = layAccessToken();

  if (token) {
    config.headers.Authorization =
      `Bearer ${token}`;
  }

  return config;
});
```

---

# 102. Refresh Token

Nếu API trả:

```text
401
TOKEN_HET_HAN
```

Frontend:

```text
Gọi refresh token

Nếu thành công:
retry request

Nếu thất bại:
logout
```

Phải tránh nhiều request cùng refresh token đồng thời.

---

# 103. Store Authentication

```typescript
interface AuthState {
  nguoiDung: NguoiDung | null;
  accessToken: string | null;
  daDangNhap: boolean;

  dangNhap: (
    duLieu: DangNhapResponse,
  ) => void;

  dangXuat: () => void;
}
```

---

# 104. TanStack Query key

Quy ước:

```typescript
[
  'dat-ban',
  {
    trang,
    trangThai,
    ngay,
  },
]
```

Ví dụ:

```typescript
[
  'mon-an',
  {
    trang,
    danhMucId,
    tuKhoa,
  },
]
```

Không dùng query key mơ hồ:

```typescript
['data']
```

---

# 105. Mutation invalidate

Ví dụ xác nhận booking:

```text
mutation success
```

invalidate:

```text
['dat-ban']
['dat-ban', id]
['dashboard']
['ban-an-so-do']
```

để dữ liệu trên các màn hình đồng bộ.

---

# 106. TypeScript type

Ví dụ:

```typescript
export interface DatBan {
  id: number;
  maDatBan: string;

  hoTen: string;
  soDienThoai: string;
  email?: string;

  gioBatDau: string;
  gioKetThuc: string;

  soNguoi: number;

  trangThai: TrangThaiDatBan;

  banAns: BanAn[];

  ngayTao: string;
}
```

---

# 107. Enum frontend

```typescript
export enum TrangThaiDatBan {
  CHO_XAC_NHAN = 'CHO_XAC_NHAN',
  DA_XAC_NHAN = 'DA_XAC_NHAN',
  DA_CHECK_IN = 'DA_CHECK_IN',
  DA_HOAN_THANH = 'DA_HOAN_THANH',
  DA_HUY = 'DA_HUY',
  KHONG_DEN = 'KHONG_DEN',
}
```

---

# 108. Hiển thị trạng thái

Không viết switch ở 20 page khác nhau.

Tạo:

```typescript
export const thongTinTrangThaiDatBan = {
  CHO_XAC_NHAN: {
    nhan: 'Chờ xác nhận',
  },

  DA_XAC_NHAN: {
    nhan: 'Đã xác nhận',
  },

  DA_CHECK_IN: {
    nhan: 'Đã check-in',
  },

  DA_HOAN_THANH: {
    nhan: 'Hoàn thành',
  },

  DA_HUY: {
    nhan: 'Đã hủy',
  },

  KHONG_DEN: {
    nhan: 'Không đến',
  },
};
```

UI color để theme/component quyết định.

---

# 109. URL state

Search/filter nên phản ánh trên URL.

Ví dụ:

```text
?trang=1
&kichThuoc=20
&tuKhoa=nguyen
&trangThai=DA_XAC_NHAN
```

Không giữ toàn bộ filter chỉ trong `useState`.

---

# 110. Modal confirmation

Các action nguy hiểm bắt buộc confirm:

```text
Hủy booking

Khóa tài khoản

Ngừng sử dụng bàn

Xóa món

Ẩn danh mục

Xóa nhân viên
```

---

# 111. Thông báo thành công

Ví dụ:

```text
Đã xác nhận đặt bàn.

Đã cập nhật món ăn.

Đã khóa tài khoản.
```

Không dùng:

```text
Success
Done
OK
```

---

# 112. Thông báo lỗi

Ưu tiên thông điệp nghiệp vụ.

Sai:

```text
Request failed with status code 409
```

Đúng:

```text
Bàn A05 vừa được khách khác đặt.
Vui lòng chọn bàn khác.
```

---

# 113. Empty state

Ví dụ booking:

```text
Chưa có đặt bàn nào trong khoảng thời gian này.
```

Món:

```text
Không có món phù hợp với bộ lọc.
```

Khách:

```text
Chưa có khách hàng.
```

---

# 114. Table responsive Admin

Không cố nhét 12 column vào mobile.

Tablet:

```text
Ẩn column ít quan trọng
```

Mobile:

Admin có thể dùng:

```text
Card list
```

cho các màn hình quan trọng nếu cần.

---

# 115. Accessibility

Button icon-only cần:

```text
Tooltip
aria-label
```

Form input:

```text
Label rõ
```

Ảnh:

```text
alt
```

Keyboard:

```text
Modal
Drawer
Form
```

phải hoạt động bình thường.

---

# 116. Date/Time

Toàn hệ thống dùng:

```text
Day.js
```

Frontend hiển thị:

```text
DD/MM/YYYY
HH:mm
```

API truyền chuẩn:

```text
ISO 8601
```

Không truyền chuỗi ngày không thống nhất.

---

# 117. Tiền tệ

Tạo utility:

```typescript
export function dinhDangTien(
  giaTri: number,
) {
  return new Intl.NumberFormat(
    'vi-VN',
    {
      style: 'currency',
      currency: 'VND',
    },
  ).format(giaTri);
}
```

---

# 118. Frontend booking flow hoàn chỉnh

```text
Khách mở /dat-ban
        ↓
Chọn ngày
        ↓
Chọn giờ
        ↓
Nhập số người
        ↓
GET /ban-an/tim-ban-trong
        ↓
Có bàn?
 ┌──────┴──────┐
Không          Có
 │              │
Thông báo       Chọn bàn
                │
                ↓
        Nhập thông tin
                │
                ↓
          Xem xác nhận
                │
                ↓
         POST /dat-ban
                │
          ┌─────┴─────┐
        409           201
         │             │
 Chọn bàn lại    Trang thành công
```

---

# 119. Admin booking flow

```text
Booking mới
    ↓
CHO_XAC_NHAN
    ↓
Admin mở chi tiết
    ↓
Kiểm tra bàn
    ↓
Xác nhận
    ↓
DA_XAC_NHAN
    ↓
Khách tới?
 ┌──┴───────────┐
Không            Có
 │               │
KHONG_DEN     CHECK-IN
                 │
                 ↓
          DA_CHECK_IN
                 │
                 ↓
            Hoàn thành
                 │
                 ↓
          DA_HOAN_THANH
```

---

# 120. FE Permission

Không chỉ ẩn button.

Ví dụ user không có quyền:

```text
QUAN_LY_NHAN_VIEN
```

Frontend:

```text
Ẩn menu
Ẩn button
Không route được
```

Backend:

```text
Vẫn bắt buộc kiểm tra quyền
```

Frontend permission không phải security.

---

# 121. Hook quyền

```typescript
const {
  coQuyen,
} = useQuyen();

if (
  coQuyen(
    'DAT_BAN_XAC_NHAN',
  )
) {
  // Hiển thị nút xác nhận
}
```

---

# 122. Component dùng lại

Nên có:

```text
TrangDanhSach

BoLoc

NutHanhDong

TrangThaiDatBan

ThongTinKhach

ThongTinBan

LichSuDatBan

FormDatBan

ChonBan

CardMonAn
```

Không copy nguyên form vào nhiều page.

---

# 123. Cấu trúc page Admin chuẩn

Ví dụ:

```text
trang/
└── quan-tri/
    └── dat-ban/
        ├── danh-sach-dat-ban.tsx
        ├── chi-tiet-dat-ban.tsx
        ├── tao-dat-ban.tsx
        ├── components/
        │   ├── bo-loc-dat-ban.tsx
        │   ├── bang-dat-ban.tsx
        │   ├── thong-tin-dat-ban.tsx
        │   ├── lich-su-dat-ban.tsx
        │   └── sap-ban-modal.tsx
        └── hooks/
            ├── use-danh-sach-dat-ban.ts
            └── use-chi-tiet-dat-ban.ts
```

---

# 124. Không tạo component quá nhỏ

Không cần:

```text
ten-khach.tsx
so-dien-thoai.tsx
ma-dat-ban.tsx
```

nếu chỉ render một dòng.

Component nên có giá trị tái sử dụng thực tế.

---

# 125. UI Dashboard không được fake

Các Statistic phải lấy API thật.

Không hard-code:

```text
150 booking
120 khách
```

trong source.

Seed database sẽ tạo dữ liệu demo.

---

# 126. API mapping cho từng page

## Khách

```text
KH01
GET thong-tin-nha-hang
GET mon-an/noi-bat
GET danh-gia

KH02
GET mon-an
GET danh-muc-mon

KH03
GET mon-an/:duongDan

KH04
GET ban-an/tim-ban-trong
POST dat-ban

KH07
POST dat-ban/tra-cuu

KH08
POST xac-thuc/dang-nhap

KH09
POST xac-thuc/dang-ky

KH10
GET/PATCH khach-hang/ho-so

KH11
GET khach-hang/dat-ban

KH12
GET khach-hang/dat-ban/:id
PATCH khach-hang/dat-ban/:id/huy

KH13
GET/POST/PATCH/DELETE khach-hang/danh-gia
```

---

# 127. API mapping Admin

```text
AD02
dashboard/*

AD03
GET quan-tri/dat-ban

AD04
GET quan-tri/dat-ban/:id
GET lich-su
PATCH workflow endpoints

AD05
POST quan-tri/dat-ban

AD06
GET quan-tri/ban-an/so-do

AD07
CRUD khu-vuc

AD08
CRUD ban-an

AD09
CRUD mon-an

AD10
CRUD danh-muc-mon

AD11
GET/PATCH khach-hang

AD13
CRUD nhan-vien

AD14
CRUD khuyen-mai

AD15
GET/PATCH danh-gia

AD16
GET bao-cao/*

AD17
GET/PATCH tai-khoan

AD18
GET/PATCH vai-tro

AD19
GET nhat-ky

AD20
GET/PATCH cau-hinh
```

---

# 128. Test Frontend

Tối thiểu kiểm tra:

```text
Login

Logout

Route guard

Permission

Tìm bàn

Tạo booking

Double booking error

Hủy booking

Admin xác nhận booking

Admin check-in

Admin hoàn thành

Filter

Pagination

Form validation
```

---

# 129. E2E flow quan trọng

## Flow 1

```text
Khách tìm bàn
→ đặt bàn
→ nhận mã
→ Admin nhìn thấy
→ Admin xác nhận
→ Khách thấy trạng thái mới
```

## Flow 2

```text
Admin tạo booking qua điện thoại
→ sắp bàn
→ check-in
→ hoàn thành
```

## Flow 3

```text
Hai người cùng chọn A01
→ người 1 đặt thành công
→ người 2 nhận 409
→ frontend yêu cầu chọn bàn lại
```

---

# 130. Kết luận Frontend

Frontend hoàn chỉnh phải đảm bảo:

```text
Không chỉ đẹp

mà còn đúng nghiệp vụ.
```

Cấu trúc cuối:

```text
React
│
├── Customer UI
│
├── Admin UI
│
├── Shared API
│
├── Shared Types
│
├── Authentication
│
├── Permission
│
└── Error handling
```

Mỗi màn hình phải xác định rõ:

```text
Dữ liệu nào cần
API nào gọi
Ai được xem
Ai được thao tác
Loading thế nào
Error thế nào
Empty thế nào
Mobile thế nào
```

Đây là tiêu chuẩn để frontend không trở thành một bộ giao diện CRUD rời rạc mà phản ánh đúng toàn bộ nghiệp vụ nhà hàng.