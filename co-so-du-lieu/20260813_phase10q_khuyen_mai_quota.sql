-- Phase 10Q-A: Promotion quota / per-customer usage contract
-- MySQL 8.x
-- Run exactly once on an existing database already upgraded through Phase 10A.

ALTER TABLE khuyen_mai
    ADD COLUMN so_luot_toi_da INT UNSIGNED NULL
        COMMENT 'NULL = không giới hạn tổng lượt giữ + đã dùng'
        AFTER giam_toi_da,
    ADD COLUMN so_luot_moi_khach INT UNSIGNED NULL
        COMMENT 'NULL = không giới hạn số lượt trên một số điện thoại'
        AFTER so_luot_toi_da,
    ADD CONSTRAINT ck_khuyen_mai_so_luot_toi_da
        CHECK (so_luot_toi_da IS NULL OR so_luot_toi_da >= 1),
    ADD CONSTRAINT ck_khuyen_mai_so_luot_moi_khach
        CHECK (so_luot_moi_khach IS NULL OR so_luot_moi_khach >= 1);

CREATE TABLE su_dung_khuyen_mai (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    khuyen_mai_id       BIGINT UNSIGNED NOT NULL,
    dat_ban_id          BIGINT UNSIGNED NOT NULL,
    so_dien_thoai_chuan VARCHAR(30) NOT NULL,
    trang_thai          VARCHAR(30) NOT NULL DEFAULT 'DA_GIU',
    thoi_gian_giu       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    thoi_gian_su_dung   DATETIME(3) NULL,
    thoi_gian_huy       DATETIME(3) NULL,
    ly_do_huy           VARCHAR(255) NULL,
    ngay_tao            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ngay_cap_nhat       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                        ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    UNIQUE KEY uk_su_dung_khuyen_mai_dat_ban (dat_ban_id),
    KEY idx_su_dung_khuyen_mai_km_trang_thai
        (khuyen_mai_id, trang_thai),
    KEY idx_su_dung_khuyen_mai_khach
        (khuyen_mai_id, so_dien_thoai_chuan, trang_thai),

    CONSTRAINT fk_su_dung_khuyen_mai_khuyen_mai
        FOREIGN KEY (khuyen_mai_id)
        REFERENCES khuyen_mai(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_su_dung_khuyen_mai_dat_ban
        FOREIGN KEY (dat_ban_id)
        REFERENCES dat_ban(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT ck_su_dung_khuyen_mai_sdt
        CHECK (CHAR_LENGTH(TRIM(so_dien_thoai_chuan)) >= 8),
    CONSTRAINT ck_su_dung_khuyen_mai_trang_thai
        CHECK (trang_thai IN ('DA_GIU', 'DA_DUNG', 'DA_HUY'))
) ENGINE=InnoDB;
