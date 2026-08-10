# PHẦN 10 — FRONTEND NỀN + NỐI BACKEND

## Cấu trúc

ZIP chứa đúng một frontend mới: `may-khach/`. Không tạo thêm backend và không đụng `may-chu/`.

## Cài vào project

Tại `~/Downloads/quanlyquanan`, đặt thư mục `may-khach` cạnh `may-chu`:

```text
quanlyquanan/
├── may-chu/
└── may-khach/
```

Sau đó:

```bash
cd ~/Downloads/quanlyquanan/may-khach
cp .env.example .env
npm install
npm run build
npm run dev
```

Backend phải chạy riêng ở port 8080:

```bash
cd ~/Downloads/quanlyquanan/may-chu
npm run start:dev
```

Frontend chạy ở `http://localhost:5173`.

## Test nhanh

1. `/thuc-don` phải hiện 5 món seed.
2. `/dat-ban` chọn ngày -> phải lấy được khung giờ; tìm bàn -> có phương án.
3. `/tra-cuu` dùng mã booking test cũ.
4. `/dang-nhap` đăng nhập admin -> chuyển `/quan-tri`.
5. Dashboard phải hiện dữ liệu thật từ Backend.
6. `/quan-tri/dat-ban` thử workflow với booking phù hợp thời gian.

## Không chạy

- Không chạy `prisma pull` hay `prisma generate` trong frontend.
- Không copy bất kỳ file frontend nào vào `may-chu`.
