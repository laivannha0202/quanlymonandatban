-- Phase 5B: bỏ quota khuyến mãi không có nghiệp vụ tiêu lượt.
-- Hệ thống hiện là quản lý nhà hàng + đặt bàn, không có đơn hàng/hóa đơn
-- hoặc luồng redeem khuyến mãi để tăng bộ đếm sử dụng.
-- Script idempotent: chạy lại không lỗi nếu các cột đã được bỏ.

SET @co_so_luot_toi_da = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'khuyen_mai'
    AND COLUMN_NAME = 'so_luot_toi_da'
);

SET @sql_bo_so_luot_toi_da = IF(
  @co_so_luot_toi_da > 0,
  'ALTER TABLE khuyen_mai DROP COLUMN so_luot_toi_da',
  'SELECT ''khuyen_mai.so_luot_toi_da da duoc bo'' AS thong_bao'
);

PREPARE stmt_bo_so_luot_toi_da
FROM @sql_bo_so_luot_toi_da;
EXECUTE stmt_bo_so_luot_toi_da;
DEALLOCATE PREPARE stmt_bo_so_luot_toi_da;

SET @co_so_luot_da_dung = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'khuyen_mai'
    AND COLUMN_NAME = 'so_luot_da_dung'
);

SET @sql_bo_so_luot_da_dung = IF(
  @co_so_luot_da_dung > 0,
  'ALTER TABLE khuyen_mai DROP COLUMN so_luot_da_dung',
  'SELECT ''khuyen_mai.so_luot_da_dung da duoc bo'' AS thong_bao'
);

PREPARE stmt_bo_so_luot_da_dung
FROM @sql_bo_so_luot_da_dung;
EXECUTE stmt_bo_so_luot_da_dung;
DEALLOCATE PREPARE stmt_bo_so_luot_da_dung;

SELECT COUNT(*) AS so_cot_quota_con_lai
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'khuyen_mai'
  AND COLUMN_NAME IN (
    'so_luot_toi_da',
    'so_luot_da_dung'
  );
