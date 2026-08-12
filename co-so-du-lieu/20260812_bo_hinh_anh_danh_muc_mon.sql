-- Phase 3B: bỏ ảnh ở cấp danh mục món.
-- Ảnh thực đơn được quản lý ở cấp món ăn (mon_an / hinh_anh_mon).
-- Script idempotent: chạy lại không lỗi nếu cột đã được bỏ.

SET @cot_hinh_anh_danh_muc_ton_tai = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'danh_muc_mon'
    AND COLUMN_NAME = 'hinh_anh'
);

SET @sql_bo_hinh_anh_danh_muc = IF(
  @cot_hinh_anh_danh_muc_ton_tai > 0,
  'ALTER TABLE danh_muc_mon DROP COLUMN hinh_anh',
  'SELECT ''danh_muc_mon.hinh_anh da duoc bo'' AS thong_bao'
);

PREPARE stmt_bo_hinh_anh_danh_muc
FROM @sql_bo_hinh_anh_danh_muc;

EXECUTE stmt_bo_hinh_anh_danh_muc;
DEALLOCATE PREPARE stmt_bo_hinh_anh_danh_muc;

SELECT
  COUNT(*) AS so_cot_hinh_anh_con_lai
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'danh_muc_mon'
  AND COLUMN_NAME = 'hinh_anh';
