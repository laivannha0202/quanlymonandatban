-- Thu gọn phạm vi quản trị:
-- - Không còn trang/API quản trị Nhật ký.
-- - Không còn trang/API quản trị Cấu hình.
-- - Vẫn giữ bảng nhat_ky_hoat_dong để audit nội bộ.
-- - Vẫn giữ bảng cau_hinh làm tham số nghiệp vụ nội bộ.
-- - Giờ hoạt động + Ngày đặc biệt dùng quyền LICH_PHUC_VU_QUAN_LY.

START TRANSACTION;

INSERT INTO quyen (
    ma_quyen,
    ten_quyen,
    nhom_quyen,
    mo_ta
)
VALUES (
    'LICH_PHUC_VU_QUAN_LY',
    'Quản lý lịch phục vụ',
    'LICH_PHUC_VU',
    'Quản lý giờ hoạt động và ngày đặc biệt'
)
ON DUPLICATE KEY UPDATE
    ten_quyen = VALUES(ten_quyen),
    nhom_quyen = VALUES(nhom_quyen),
    mo_ta = VALUES(mo_ta);

-- Bảo toàn role đang được phép quản lý lịch:
-- role từng có CAU_HINH_QUAN_LY sẽ nhận quyền mới.
INSERT IGNORE INTO vai_tro_quyen (
    vai_tro_id,
    quyen_id
)
SELECT
    vtq.vai_tro_id,
    q_moi.id
FROM vai_tro_quyen vtq
INNER JOIN quyen q_cu
    ON q_cu.id = vtq.quyen_id
CROSS JOIN quyen q_moi
WHERE q_cu.ma_quyen = 'CAU_HINH_QUAN_LY'
  AND q_moi.ma_quyen = 'LICH_PHUC_VU_QUAN_LY';

DELETE vtq
FROM vai_tro_quyen vtq
INNER JOIN quyen q
    ON q.id = vtq.quyen_id
WHERE q.ma_quyen IN (
    'NHAT_KY_XEM',
    'CAU_HINH_QUAN_LY'
);

DELETE FROM quyen
WHERE ma_quyen IN (
    'NHAT_KY_XEM',
    'CAU_HINH_QUAN_LY'
);

COMMIT;

SELECT
    ma_quyen,
    ten_quyen,
    nhom_quyen
FROM quyen
WHERE ma_quyen IN (
    'LICH_PHUC_VU_QUAN_LY',
    'NHAT_KY_XEM',
    'CAU_HINH_QUAN_LY'
)
ORDER BY ma_quyen;
