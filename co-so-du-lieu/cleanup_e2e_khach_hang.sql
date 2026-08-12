-- Cleanup an toàn dữ liệu test hiển thị dạng "Khách E2E..."
-- Chỉ soft-delete hồ sơ có HỌ TÊN bắt đầu đúng bằng "Khách E2E".
-- Không đụng khách bình thường, lịch sử đặt bàn vẫn được giữ để bảo toàn FK/audit.
START TRANSACTION;

UPDATE tai_khoan tk
INNER JOIN khach_hang kh ON kh.tai_khoan_id = tk.id
SET
  tk.trang_thai = 'NGUNG_HOAT_DONG',
  tk.refresh_token_hash = NULL,
  tk.ngay_xoa = COALESCE(tk.ngay_xoa, NOW(3))
WHERE kh.ngay_xoa IS NULL
  AND kh.ho_ten LIKE 'Khách E2E%';

UPDATE khach_hang
SET
  trang_thai = 'NGUNG_HOAT_DONG',
  ngay_xoa = COALESCE(ngay_xoa, NOW(3))
WHERE ngay_xoa IS NULL
  AND ho_ten LIKE 'Khách E2E%';

COMMIT;
