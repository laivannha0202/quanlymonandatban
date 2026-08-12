-- Chuẩn hóa mã khách hàng theo ID.
-- Ví dụ:
--   id=1    -> HV_KH001
--   id=42   -> HV_KH042
--   id=1000 -> HV_KH1000
--
-- Mục tiêu:
-- - mọi khách hàng đều có mã;
-- - mã là duy nhất, ổn định, sinh không race condition;
-- - API GET không còn tự UPDATE dữ liệu;
-- - SQL / Prisma / Backend / Frontend cùng một invariant.

START TRANSACTION;

-- Bước trung gian để tránh va chạm UNIQUE khi các mã demo cũ
-- HV_KH001... có thể đang nằm trên các ID khác 1...8.
UPDATE khach_hang
SET ma_khach_hang = CONCAT(
  'TMP',
  LPAD(
    CAST(id AS CHAR),
    GREATEST(
      3,
      CHAR_LENGTH(CAST(id AS CHAR))
    ),
    '0'
  )
);

UPDATE khach_hang
SET ma_khach_hang = CONCAT(
  'HV_KH',
  LPAD(
    CAST(id AS CHAR),
    GREATEST(
      3,
      CHAR_LENGTH(CAST(id AS CHAR))
    ),
    '0'
  )
);

COMMIT;

ALTER TABLE khach_hang
  MODIFY ma_khach_hang VARCHAR(30) NOT NULL;

SELECT
  COUNT(*) AS SO_KHACH,
  SUM(
    ma_khach_hang IS NULL
    OR TRIM(ma_khach_hang) = ''
  ) AS SO_MA_THIEU,
  COUNT(DISTINCT ma_khach_hang) AS SO_MA_KHAC_NHAU
FROM khach_hang;

SELECT
  id,
  ma_khach_hang,
  ho_ten,
  trang_thai,
  ngay_xoa
FROM khach_hang
ORDER BY id DESC
LIMIT 20;
