# Frontend — Quản lý nhà hàng và đặt bàn

Frontend React + TypeScript + Vite + Ant Design, nối trực tiếp Backend tại `/api/v1`.

## Cài đặt

```bash
cp .env.example .env
npm ci
```

Mặc định:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_TEN_NHA_HANG=Nhà hàng
```

## Chạy development

```bash
npm run dev
```

Mở `http://localhost:5173`.

Backend phải chạy tại URL đã cấu hình trong `VITE_API_BASE_URL`.

## Build và kiểm thử

```bash
npm run typecheck
npm run build
npm run security:audit
```

Full browser E2E khi Backend/database đã sẵn sàng:

```bash
npm run build
npm run test:e2e
```

Playwright chạy desktop và mobile; nhóm test sâu kiểm tra các workflow quản trị/CRUD/RBAC.

## Chức năng

Frontend hiện có đầy đủ các khu vực:

- public: trang chủ, thực đơn, chi tiết món, đặt bàn, tra cứu, khuyến mãi;
- xác thực: đăng ký, đăng nhập, quên/đặt lại/đổi mật khẩu;
- tài khoản khách: hồ sơ, lịch sử booking, đánh giá, thông báo;
- quản trị: dashboard, booking, khu vực, bàn, danh mục, món, khách hàng, nhân viên, vai trò/quyền, khuyến mãi, đánh giá, lịch hoạt động, báo cáo.

<!-- PHASE10_FINANCE_HANDOFF -->
## Đặt bàn 5 bước và tài chính

Trang đặt bàn public hiện theo luồng:

```text
Thông tin & thời gian
→ Chọn bàn
→ Chọn món (tùy chọn)
→ Ưu đãi & thanh toán
→ Hoàn tất
```

Frontend cho phép ghi chú riêng cho từng món, nhưng toàn bộ giá cuối cùng vẫn lấy từ quote Backend. Khi không chọn món, UI không cho áp mã ưu đãi vì mã được định nghĩa trên giá trị món đặt trước.

Payment retry tái sử dụng idempotency key theo `maThanhToan` trong `sessionStorage`, tránh sinh khóa mới cho cùng một giao dịch khi retry trong phiên hiện tại.

Khu vực quản trị có thêm Thanh toán và Cấu hình đặt bàn. Chi tiết booking hiển thị món đặt trước, snapshot ưu đãi, tiền cọc, payment và refund; Dashboard/Báo cáo hiển thị đã thu, đã hoàn, thực thu và các hàng đợi cần xử lý.

## Contract

- API dùng camelCase ở frontend.
- ID từ backend là `string`.
- Không dùng tên field MySQL snake_case trong `src`.
- Status nghiệp vụ dùng union type trong `src/kieu/trang-thai.ts`.
- API client dùng native `fetch`.
- Refresh token đi qua HttpOnly cookie; access token phục vụ request API.
