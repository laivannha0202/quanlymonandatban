# Phần 18 — Refresh token HttpOnly cookie

## Mục tiêu

Refresh token không còn xuất hiện trong JSON response và không còn nằm trong `localStorage`.

## Backend

- `cookie-parser`.
- Cookie `nha_hang_refresh_v1`.
- `HttpOnly`.
- `SameSite=Lax`.
- `Secure=true` khi `NODE_ENV=production`.
- Cookie chỉ có path `/api/v1/xac-thuc`.
- Login / đăng ký / refresh xoay refresh token và ghi cookie.
- Refresh đọc token từ cookie, không nhận token trong request body.
- Logout / đổi mật khẩu / đặt lại mật khẩu xóa cookie.
- Refresh thất bại cũng xóa cookie.
- Unit test cookie options.
- Smoke test kiểm tra JSON không lộ refresh token và refresh bằng cookie thật.

## Frontend

- `BoToken` chỉ còn access token.
- `localStorage` tự migrate phiên cũ và loại bỏ `refreshToken`.
- `fetch(..., credentials: 'include')`.
- Khi API trả 401, Frontend gọi refresh endpoint bằng HttpOnly cookie rồi retry đúng một lần.
- Các request 401 đồng thời vẫn dùng single-flight refresh.

## E2E

`refresh-cookie.spec.ts` kiểm tra:

1. UI login thật.
2. `localStorage` không có `refreshToken`.
3. Browser có cookie HttpOnly.
4. Cố tình làm hỏng access token.
5. Reload khu quản trị.
6. Refresh cookie tự cấp access token mới.
7. Logout xóa cookie.
