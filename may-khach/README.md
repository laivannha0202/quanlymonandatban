# may-khach — Frontend quản lý nhà hàng

React + TypeScript + Vite + Ant Design.

## Chạy local

```bash
cp .env.example .env
npm install
npm run build
npm run dev
```

Backend mặc định: `http://localhost:8080/api/v1`.

## Phần 10 đã có

- Router khách hàng / tài khoản / quản trị.
- API client bằng `fetch`, tự gắn access token.
- Refresh token có khóa đồng thời để tránh nhiều request refresh cùng lúc.
- Đăng nhập, đăng ký, đăng xuất, quên mật khẩu.
- Thực đơn public.
- Đặt bàn + lấy khung giờ + tìm bàn + chọn bàn.
- Tra cứu đặt bàn.
- Lịch đặt bàn và hồ sơ khách hàng.
- Dashboard quản trị.
- Danh sách và workflow đặt bàn quản trị.
- Danh sách bàn, món, khách hàng, nhân viên.

Các CRUD modal/form quản trị chuyên sâu, báo cáo, khuyến mãi, đánh giá, thông báo và phân quyền UI sẽ nối ở phần tiếp theo.
