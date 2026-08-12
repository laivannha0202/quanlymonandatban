-- ============================================================================
-- HỆ THỐNG QUẢN LÝ NHÀ HÀNG & ĐẶT BÀN
-- MySQL 8.x
-- Tên database: quan_ly_nha_hang
-- Mục tiêu: dùng trực tiếp cho Backend NestJS + Prisma + Swagger
-- Nguyên tắc đặt tên: tiếng Việt không dấu, snake_case trong MySQL
-- ============================================================================

SET NAMES utf8mb4;
SET time_zone = '+07:00';

CREATE DATABASE IF NOT EXISTS quan_ly_nha_hang
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE quan_ly_nha_hang;

-- ============================================================================
-- 1. PHÂN QUYỀN RBAC
-- ============================================================================

CREATE TABLE IF NOT EXISTS vai_tro (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    ma_vai_tro      VARCHAR(50) NOT NULL,
    ten_vai_tro     VARCHAR(100) NOT NULL,
    mo_ta           VARCHAR(500) NULL,
    la_he_thong     TINYINT(1) NOT NULL DEFAULT 0,
    trang_thai      VARCHAR(30) NOT NULL DEFAULT 'HOAT_DONG',
    ngay_tao        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ngay_cap_nhat   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    UNIQUE KEY uk_vai_tro_ma (ma_vai_tro),
    KEY idx_vai_tro_trang_thai (trang_thai),
    CONSTRAINT ck_vai_tro_trang_thai CHECK (trang_thai IN ('HOAT_DONG', 'NGUNG_HOAT_DONG'))
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS quyen (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    ma_quyen        VARCHAR(100) NOT NULL,
    ten_quyen       VARCHAR(150) NOT NULL,
    nhom_quyen      VARCHAR(100) NOT NULL,
    mo_ta           VARCHAR(500) NULL,
    ngay_tao        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ngay_cap_nhat   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    UNIQUE KEY uk_quyen_ma (ma_quyen),
    KEY idx_quyen_nhom (nhom_quyen)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS vai_tro_quyen (
    vai_tro_id      BIGINT UNSIGNED NOT NULL,
    quyen_id        BIGINT UNSIGNED NOT NULL,
    ngay_tao        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (vai_tro_id, quyen_id),
    KEY idx_vtq_quyen (quyen_id),
    CONSTRAINT fk_vtq_vai_tro FOREIGN KEY (vai_tro_id) REFERENCES vai_tro(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_vtq_quyen FOREIGN KEY (quyen_id) REFERENCES quyen(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- 2. TÀI KHOẢN / KHÁCH HÀNG / NHÂN VIÊN
-- ============================================================================

CREATE TABLE IF NOT EXISTS tai_khoan (
    id                      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    ten_dang_nhap           VARCHAR(100) NULL,
    email                   VARCHAR(255) NOT NULL,
    mat_khau                VARCHAR(255) NOT NULL COMMENT 'Chỉ lưu password hash (bcrypt/argon2), không lưu mật khẩu thô',
    vai_tro_id              BIGINT UNSIGNED NOT NULL,
    refresh_token_hash      VARCHAR(255) NULL,
    trang_thai              VARCHAR(30) NOT NULL DEFAULT 'HOAT_DONG',
    bat_buoc_doi_mat_khau   TINYINT(1) NOT NULL DEFAULT 0,
    so_lan_dang_nhap_sai    INT UNSIGNED NOT NULL DEFAULT 0,
    khoa_den                DATETIME(3) NULL,
    lan_dang_nhap_cuoi      DATETIME(3) NULL,
    ngay_tao                DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ngay_cap_nhat           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    ngay_xoa                DATETIME(3) NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uk_tai_khoan_ten_dang_nhap (ten_dang_nhap),
    UNIQUE KEY uk_tai_khoan_email (email),
    KEY idx_tai_khoan_vai_tro (vai_tro_id),
    KEY idx_tai_khoan_trang_thai (trang_thai),
    CONSTRAINT fk_tai_khoan_vai_tro FOREIGN KEY (vai_tro_id) REFERENCES vai_tro(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT ck_tai_khoan_trang_thai CHECK (trang_thai IN ('HOAT_DONG', 'BI_KHOA', 'NGUNG_HOAT_DONG'))
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS token_dat_lai_mat_khau (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    tai_khoan_id        BIGINT UNSIGNED NOT NULL,
    token_hash          VARCHAR(255) NOT NULL,
    het_han_luc         DATETIME(3) NOT NULL,
    da_su_dung          TINYINT(1) NOT NULL DEFAULT 0,
    ngay_tao            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ngay_su_dung        DATETIME(3) NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uk_token_dat_lai_hash (token_hash),
    KEY idx_token_dat_lai_tai_khoan (tai_khoan_id),
    KEY idx_token_dat_lai_het_han (het_han_luc),
    CONSTRAINT fk_token_dat_lai_tai_khoan FOREIGN KEY (tai_khoan_id) REFERENCES tai_khoan(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS khach_hang (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    tai_khoan_id        BIGINT UNSIGNED NULL,
    ma_khach_hang       VARCHAR(30) NOT NULL,
    ho_ten              VARCHAR(150) NOT NULL,
    so_dien_thoai       VARCHAR(30) NOT NULL,
    email               VARCHAR(255) NULL,
    ngay_sinh           DATE NULL,
    gioi_tinh           VARCHAR(20) NULL,
    ghi_chu             TEXT NULL,
    trang_thai          VARCHAR(30) NOT NULL DEFAULT 'HOAT_DONG',
    ngay_tao            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ngay_cap_nhat       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    ngay_xoa            DATETIME(3) NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uk_khach_hang_tai_khoan (tai_khoan_id),
    UNIQUE KEY uk_khach_hang_ma (ma_khach_hang),
    UNIQUE KEY uk_khach_hang_sdt (so_dien_thoai),
    KEY idx_khach_hang_ho_ten (ho_ten),
    KEY idx_khach_hang_email (email),
    KEY idx_khach_hang_trang_thai (trang_thai),
    CONSTRAINT fk_khach_hang_tai_khoan FOREIGN KEY (tai_khoan_id) REFERENCES tai_khoan(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT ck_khach_hang_trang_thai CHECK (trang_thai IN ('HOAT_DONG', 'BI_KHOA', 'NGUNG_HOAT_DONG')),
    CONSTRAINT ck_khach_hang_gioi_tinh CHECK (gioi_tinh IS NULL OR gioi_tinh IN ('NAM', 'NU', 'KHAC'))
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS nhan_vien (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    tai_khoan_id        BIGINT UNSIGNED NOT NULL,
    ma_nhan_vien        VARCHAR(30) NOT NULL,
    ho_ten              VARCHAR(150) NOT NULL,
    so_dien_thoai       VARCHAR(30) NULL,
    email               VARCHAR(255) NULL,
    ngay_vao_lam        DATE NULL,
    ghi_chu             TEXT NULL,
    trang_thai          VARCHAR(30) NOT NULL DEFAULT 'HOAT_DONG',
    ngay_tao            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ngay_cap_nhat       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    ngay_xoa            DATETIME(3) NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uk_nhan_vien_tai_khoan (tai_khoan_id),
    UNIQUE KEY uk_nhan_vien_ma (ma_nhan_vien),
    KEY idx_nhan_vien_ho_ten (ho_ten),
    KEY idx_nhan_vien_sdt (so_dien_thoai),
    KEY idx_nhan_vien_trang_thai (trang_thai),
    CONSTRAINT fk_nhan_vien_tai_khoan FOREIGN KEY (tai_khoan_id) REFERENCES tai_khoan(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT ck_nhan_vien_trang_thai CHECK (trang_thai IN ('HOAT_DONG', 'TAM_NGHI', 'DA_NGHI'))
) ENGINE=InnoDB;

-- ============================================================================
-- 3. KHU VỰC / BÀN ĂN / KHẢ NĂNG GHÉP BÀN
-- ============================================================================

CREATE TABLE IF NOT EXISTS khu_vuc (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    ma_khu_vuc          VARCHAR(30) NOT NULL,
    ten_khu_vuc         VARCHAR(150) NOT NULL,
    mo_ta               TEXT NULL,
    hinh_anh            VARCHAR(500) NULL,
    thu_tu              INT NOT NULL DEFAULT 0,
    trang_thai          VARCHAR(30) NOT NULL DEFAULT 'HOAT_DONG',
    ngay_tao            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ngay_cap_nhat       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    ngay_xoa            DATETIME(3) NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uk_khu_vuc_ma (ma_khu_vuc),
    KEY idx_khu_vuc_thu_tu (thu_tu),
    KEY idx_khu_vuc_trang_thai (trang_thai),
    CONSTRAINT ck_khu_vuc_trang_thai CHECK (trang_thai IN ('HOAT_DONG', 'NGUNG_HOAT_DONG'))
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ban_an (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    ma_ban              VARCHAR(30) NOT NULL,
    ten_ban             VARCHAR(100) NOT NULL,
    khu_vuc_id          BIGINT UNSIGNED NOT NULL,
    suc_chua            INT UNSIGNED NOT NULL,
    suc_chua_toi_da     INT UNSIGNED NOT NULL,
    vi_tri_x            DECIMAL(10,2) NULL COMMENT 'Tọa độ UI sơ đồ bàn, không phải GPS',
    vi_tri_y            DECIMAL(10,2) NULL COMMENT 'Tọa độ UI sơ đồ bàn, không phải GPS',
    trang_thai          VARCHAR(30) NOT NULL DEFAULT 'TRONG',
    ghi_chu             TEXT NULL,
    ngay_tao            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ngay_cap_nhat       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    ngay_xoa            DATETIME(3) NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uk_ban_an_ma (ma_ban),
    KEY idx_ban_an_khu_vuc (khu_vuc_id),
    KEY idx_ban_an_trang_thai (trang_thai),
    KEY idx_ban_an_khu_vuc_suc_chua (khu_vuc_id, suc_chua, trang_thai),
    CONSTRAINT fk_ban_an_khu_vuc FOREIGN KEY (khu_vuc_id) REFERENCES khu_vuc(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT ck_ban_an_suc_chua CHECK (suc_chua >= 1),
    CONSTRAINT ck_ban_an_suc_chua_toi_da CHECK (suc_chua_toi_da >= suc_chua),
    CONSTRAINT ck_ban_an_trang_thai CHECK (trang_thai IN ('TRONG', 'DANG_SU_DUNG', 'BAO_TRI', 'NGUNG_SU_DUNG'))
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS lien_ket_ban (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    ban_1_id            BIGINT UNSIGNED NOT NULL,
    ban_2_id            BIGINT UNSIGNED NOT NULL,
    co_the_ghep         TINYINT(1) NOT NULL DEFAULT 1,
    ghi_chu             VARCHAR(500) NULL,
    ngay_tao            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ngay_cap_nhat       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    UNIQUE KEY uk_lien_ket_ban_cap (ban_1_id, ban_2_id),
    KEY idx_lien_ket_ban_2 (ban_2_id),
    CONSTRAINT fk_lien_ket_ban_1 FOREIGN KEY (ban_1_id) REFERENCES ban_an(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_lien_ket_ban_2 FOREIGN KEY (ban_2_id) REFERENCES ban_an(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT ck_lien_ket_ban_khac_nhau CHECK (ban_1_id <> ban_2_id)
) ENGINE=InnoDB;

-- ============================================================================
-- 4. ĐẶT BÀN
-- ============================================================================

CREATE TABLE IF NOT EXISTS dat_ban (
    id                      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    ma_dat_ban              VARCHAR(40) NOT NULL,
    khach_hang_id           BIGINT UNSIGNED NULL,
    khu_vuc_id              BIGINT UNSIGNED NULL COMMENT 'Khu vực mong muốn/sắp xếp chính',

    ho_ten                  VARCHAR(150) NOT NULL COMMENT 'Snapshot thông tin khách tại thời điểm đặt',
    so_dien_thoai           VARCHAR(30) NOT NULL,
    email                   VARCHAR(255) NULL,

    ngay_dat                DATE NOT NULL,
    gio_bat_dau             DATETIME(3) NOT NULL,
    gio_ket_thuc            DATETIME(3) NOT NULL,
    so_nguoi                INT UNSIGNED NOT NULL,

    trang_thai              VARCHAR(30) NOT NULL DEFAULT 'CHO_XAC_NHAN',
    nguon_dat               VARCHAR(30) NOT NULL DEFAULT 'WEBSITE',
    kieu_xep_ban            VARCHAR(30) NOT NULL DEFAULT 'HE_THONG_SAP_XEP',

    ghi_chu_khach           TEXT NULL,
    ghi_chu_noi_bo          TEXT NULL,

    nguoi_xac_nhan_id       BIGINT UNSIGNED NULL,
    thoi_gian_xac_nhan      DATETIME(3) NULL,
    thoi_gian_check_in      DATETIME(3) NULL,
    thoi_gian_hoan_thanh    DATETIME(3) NULL,
    thoi_gian_huy           DATETIME(3) NULL,
    ly_do_huy               TEXT NULL,

    ngay_tao                DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ngay_cap_nhat           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    UNIQUE KEY uk_dat_ban_ma (ma_dat_ban),
    KEY idx_dat_ban_khach_hang (khach_hang_id),
    KEY idx_dat_ban_khu_vuc (khu_vuc_id),
    KEY idx_dat_ban_sdt (so_dien_thoai),
    KEY idx_dat_ban_ngay (ngay_dat),
    KEY idx_dat_ban_trang_thai_ngay (trang_thai, ngay_dat),
    KEY idx_dat_ban_thoi_gian (gio_bat_dau, gio_ket_thuc),
    KEY idx_dat_ban_nguon (nguon_dat),

    CONSTRAINT fk_dat_ban_khach_hang FOREIGN KEY (khach_hang_id) REFERENCES khach_hang(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_dat_ban_khu_vuc FOREIGN KEY (khu_vuc_id) REFERENCES khu_vuc(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_dat_ban_nguoi_xac_nhan FOREIGN KEY (nguoi_xac_nhan_id) REFERENCES nhan_vien(id) ON DELETE SET NULL ON UPDATE CASCADE,

    CONSTRAINT ck_dat_ban_so_nguoi CHECK (so_nguoi >= 1),
    CONSTRAINT ck_dat_ban_thoi_gian CHECK (gio_ket_thuc > gio_bat_dau),
    CONSTRAINT ck_dat_ban_trang_thai CHECK (trang_thai IN ('CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DA_CHECK_IN', 'DA_HOAN_THANH', 'DA_HUY', 'KHONG_DEN')),
    CONSTRAINT ck_dat_ban_nguon CHECK (nguon_dat IN ('WEBSITE', 'DIEN_THOAI', 'FACEBOOK', 'TRUC_TIEP', 'KHAC')),
    CONSTRAINT ck_dat_ban_kieu_xep CHECK (kieu_xep_ban IN ('KHACH_CHON_BAN', 'HE_THONG_SAP_XEP', 'NHAN_VIEN_SAP_XEP'))
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS chi_tiet_dat_ban (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    dat_ban_id          BIGINT UNSIGNED NOT NULL,
    ban_an_id           BIGINT UNSIGNED NOT NULL,
    ngay_tao            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    UNIQUE KEY uk_ctdb_dat_ban_ban (dat_ban_id, ban_an_id),
    KEY idx_ctdb_ban_an_dat_ban (ban_an_id, dat_ban_id),
    CONSTRAINT fk_ctdb_dat_ban FOREIGN KEY (dat_ban_id) REFERENCES dat_ban(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ctdb_ban_an FOREIGN KEY (ban_an_id) REFERENCES ban_an(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS lich_su_dat_ban (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    dat_ban_id          BIGINT UNSIGNED NOT NULL,
    trang_thai_cu       VARCHAR(30) NULL,
    trang_thai_moi      VARCHAR(30) NOT NULL,
    nguoi_thuc_hien_id  BIGINT UNSIGNED NULL COMMENT 'Tài khoản thực hiện; NULL nếu hệ thống tự động',
    hanh_dong           VARCHAR(100) NOT NULL,
    ghi_chu             TEXT NULL,
    thoi_gian           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    KEY idx_lich_su_dat_ban (dat_ban_id, thoi_gian),
    KEY idx_lich_su_nguoi_thuc_hien (nguoi_thuc_hien_id),
    CONSTRAINT fk_lich_su_dat_ban FOREIGN KEY (dat_ban_id) REFERENCES dat_ban(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_lich_su_nguoi_thuc_hien FOREIGN KEY (nguoi_thuc_hien_id) REFERENCES tai_khoan(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT ck_lich_su_trang_thai_cu CHECK (trang_thai_cu IS NULL OR trang_thai_cu IN ('CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DA_CHECK_IN', 'DA_HOAN_THANH', 'DA_HUY', 'KHONG_DEN')),
    CONSTRAINT ck_lich_su_trang_thai_moi CHECK (trang_thai_moi IN ('CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DA_CHECK_IN', 'DA_HOAN_THANH', 'DA_HUY', 'KHONG_DEN'))
) ENGINE=InnoDB;

-- ============================================================================
-- 5. THỰC ĐƠN
-- ============================================================================

CREATE TABLE IF NOT EXISTS danh_muc_mon (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    ma_danh_muc         VARCHAR(30) NOT NULL,
    ten_danh_muc        VARCHAR(150) NOT NULL,
    duong_dan           VARCHAR(200) NOT NULL,
    mo_ta               TEXT NULL,
    hinh_anh            VARCHAR(500) NULL,
    thu_tu              INT NOT NULL DEFAULT 0,
    trang_thai          VARCHAR(30) NOT NULL DEFAULT 'HOAT_DONG',
    ngay_tao            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ngay_cap_nhat       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    ngay_xoa            DATETIME(3) NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uk_danh_muc_mon_ma (ma_danh_muc),
    UNIQUE KEY uk_danh_muc_mon_duong_dan (duong_dan),
    KEY idx_danh_muc_mon_thu_tu (thu_tu),
    KEY idx_danh_muc_mon_trang_thai (trang_thai),
    CONSTRAINT ck_danh_muc_mon_trang_thai CHECK (trang_thai IN ('HOAT_DONG', 'NGUNG_HOAT_DONG'))
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS mon_an (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    ma_mon              VARCHAR(30) NOT NULL,
    danh_muc_id         BIGINT UNSIGNED NOT NULL,
    ten_mon             VARCHAR(200) NOT NULL,
    duong_dan           VARCHAR(220) NOT NULL,
    mo_ta               TEXT NULL,
    gia                 DECIMAL(15,2) NOT NULL,
    gia_khuyen_mai      DECIMAL(15,2) NULL,
    hinh_anh_chinh      VARCHAR(500) NULL,
    la_mon_noi_bat      TINYINT(1) NOT NULL DEFAULT 0,
    con_mon             TINYINT(1) NOT NULL DEFAULT 1,
    trang_thai          VARCHAR(30) NOT NULL DEFAULT 'HOAT_DONG',
    ngay_tao            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ngay_cap_nhat       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    ngay_xoa            DATETIME(3) NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uk_mon_an_ma (ma_mon),
    UNIQUE KEY uk_mon_an_duong_dan (duong_dan),
    KEY idx_mon_an_danh_muc (danh_muc_id),
    KEY idx_mon_an_ten (ten_mon),
    KEY idx_mon_an_con_mon (con_mon),
    KEY idx_mon_an_noi_bat (la_mon_noi_bat),
    KEY idx_mon_an_trang_thai (trang_thai),
    KEY idx_mon_an_danh_muc_trang_thai (danh_muc_id, trang_thai, con_mon),
    CONSTRAINT fk_mon_an_danh_muc FOREIGN KEY (danh_muc_id) REFERENCES danh_muc_mon(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT ck_mon_an_gia CHECK (gia >= 0),
    CONSTRAINT ck_mon_an_gia_khuyen_mai CHECK (gia_khuyen_mai IS NULL OR (gia_khuyen_mai >= 0 AND gia_khuyen_mai <= gia)),
    CONSTRAINT ck_mon_an_trang_thai CHECK (trang_thai IN ('HOAT_DONG', 'NGUNG_HOAT_DONG'))
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS hinh_anh_mon (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    mon_an_id           BIGINT UNSIGNED NOT NULL,
    duong_dan_anh       VARCHAR(500) NOT NULL,
    alt_text            VARCHAR(255) NULL,
    thu_tu              INT NOT NULL DEFAULT 0,
    la_anh_chinh        TINYINT(1) NOT NULL DEFAULT 0,
    ngay_tao            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    KEY idx_hinh_anh_mon (mon_an_id, thu_tu),
    CONSTRAINT fk_hinh_anh_mon FOREIGN KEY (mon_an_id) REFERENCES mon_an(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- 6. KHUYẾN MÃI
-- ============================================================================

CREATE TABLE IF NOT EXISTS khuyen_mai (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    ma_khuyen_mai       VARCHAR(50) NOT NULL,
    ten_khuyen_mai      VARCHAR(200) NOT NULL,
    mo_ta               TEXT NULL,
    loai_giam           VARCHAR(30) NOT NULL,
    gia_tri             DECIMAL(15,2) NOT NULL,
    gia_tri_don_toi_thieu DECIMAL(15,2) NULL,
    giam_toi_da         DECIMAL(15,2) NULL,
    ngay_bat_dau        DATETIME(3) NOT NULL,
    ngay_ket_thuc       DATETIME(3) NOT NULL,
    so_luot_toi_da      INT UNSIGNED NULL,
    so_luot_da_dung     INT UNSIGNED NOT NULL DEFAULT 0,
    trang_thai          VARCHAR(30) NOT NULL DEFAULT 'HOAT_DONG',
    ngay_tao            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ngay_cap_nhat       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    ngay_xoa            DATETIME(3) NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uk_khuyen_mai_ma (ma_khuyen_mai),
    KEY idx_khuyen_mai_thoi_gian (ngay_bat_dau, ngay_ket_thuc),
    KEY idx_khuyen_mai_trang_thai (trang_thai),
    CONSTRAINT ck_khuyen_mai_thoi_gian CHECK (ngay_ket_thuc > ngay_bat_dau),
    CONSTRAINT ck_khuyen_mai_loai_giam CHECK (loai_giam IN ('PHAN_TRAM', 'SO_TIEN')),
    CONSTRAINT ck_khuyen_mai_gia_tri CHECK ((loai_giam = 'PHAN_TRAM' AND gia_tri > 0 AND gia_tri <= 100) OR (loai_giam = 'SO_TIEN' AND gia_tri > 0)),
    CONSTRAINT ck_khuyen_mai_trang_thai CHECK (trang_thai IN ('HOAT_DONG', 'NGUNG_HOAT_DONG'))
) ENGINE=InnoDB;

-- ============================================================================
-- 7. ĐÁNH GIÁ
-- ============================================================================

CREATE TABLE IF NOT EXISTS danh_gia (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    khach_hang_id       BIGINT UNSIGNED NOT NULL,
    dat_ban_id          BIGINT UNSIGNED NULL,
    so_sao              TINYINT UNSIGNED NOT NULL,
    noi_dung            TEXT NULL,
    phan_hoi            TEXT NULL,
    nguoi_phan_hoi_id   BIGINT UNSIGNED NULL,
    thoi_gian_phan_hoi  DATETIME(3) NULL,
    hien_thi            TINYINT(1) NOT NULL DEFAULT 1,
    ngay_tao            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ngay_cap_nhat       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    ngay_xoa            DATETIME(3) NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uk_danh_gia_dat_ban (dat_ban_id),
    KEY idx_danh_gia_khach_hang (khach_hang_id),
    KEY idx_danh_gia_so_sao (so_sao),
    KEY idx_danh_gia_hien_thi (hien_thi),
    KEY idx_danh_gia_nguoi_phan_hoi (nguoi_phan_hoi_id),
    CONSTRAINT fk_danh_gia_khach_hang FOREIGN KEY (khach_hang_id) REFERENCES khach_hang(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_danh_gia_dat_ban FOREIGN KEY (dat_ban_id) REFERENCES dat_ban(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_danh_gia_nguoi_phan_hoi FOREIGN KEY (nguoi_phan_hoi_id) REFERENCES nhan_vien(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT ck_danh_gia_so_sao CHECK (so_sao BETWEEN 1 AND 5)
) ENGINE=InnoDB;

-- ============================================================================
-- 8. THÔNG BÁO
-- ============================================================================

CREATE TABLE IF NOT EXISTS thong_bao (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    tai_khoan_id        BIGINT UNSIGNED NULL,
    dat_ban_id          BIGINT UNSIGNED NULL,
    loai_thong_bao      VARCHAR(50) NOT NULL,
    tieu_de             VARCHAR(255) NOT NULL,
    noi_dung            TEXT NOT NULL,
    duong_dan           VARCHAR(500) NULL,
    da_doc              TINYINT(1) NOT NULL DEFAULT 0,
    thoi_gian_doc       DATETIME(3) NULL,
    ngay_tao            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    KEY idx_thong_bao_tai_khoan (tai_khoan_id, da_doc, ngay_tao),
    KEY idx_thong_bao_dat_ban (dat_ban_id),
    KEY idx_thong_bao_loai (loai_thong_bao),
    CONSTRAINT fk_thong_bao_tai_khoan FOREIGN KEY (tai_khoan_id) REFERENCES tai_khoan(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_thong_bao_dat_ban FOREIGN KEY (dat_ban_id) REFERENCES dat_ban(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- 9. GIỜ HOẠT ĐỘNG / NGÀY ĐẶC BIỆT / CẤU HÌNH
-- ============================================================================

CREATE TABLE IF NOT EXISTS gio_hoat_dong (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    thu_trong_tuan      TINYINT UNSIGNED NOT NULL COMMENT '1=Thứ Hai ... 7=Chủ Nhật',
    ca_so               TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Cho phép nhiều ca trong cùng một ngày',
    gio_mo_cua          TIME NOT NULL,
    gio_dong_cua        TIME NOT NULL,
    hoat_dong           TINYINT(1) NOT NULL DEFAULT 1,
    ghi_chu             VARCHAR(500) NULL,
    ngay_tao            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ngay_cap_nhat       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    UNIQUE KEY uk_gio_hoat_dong_thu_ca (thu_trong_tuan, ca_so),
    KEY idx_gio_hoat_dong_thu (thu_trong_tuan, hoat_dong),
    CONSTRAINT ck_gio_hoat_dong_thu CHECK (thu_trong_tuan BETWEEN 1 AND 7),
    CONSTRAINT ck_gio_hoat_dong_ca CHECK (ca_so >= 1),
    CONSTRAINT ck_gio_hoat_dong_gio CHECK (gio_dong_cua > gio_mo_cua)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ngay_nghi_dac_biet (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    ngay                DATE NOT NULL,
    ten_su_kien         VARCHAR(200) NOT NULL,
    dong_cua_ca_ngay    TINYINT(1) NOT NULL DEFAULT 1,
    gio_mo_cua          TIME NULL,
    gio_dong_cua        TIME NULL,
    ghi_chu             VARCHAR(500) NULL,
    ngay_tao            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ngay_cap_nhat       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    UNIQUE KEY uk_ngay_nghi_dac_biet_ngay (ngay),
    KEY idx_ngay_nghi_dac_biet_ngay (ngay),
    CONSTRAINT ck_ngay_nghi_dac_biet_gio CHECK (
        dong_cua_ca_ngay = 1
        OR (gio_mo_cua IS NOT NULL AND gio_dong_cua IS NOT NULL AND gio_dong_cua > gio_mo_cua)
    )
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cau_hinh (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    khoa                VARCHAR(120) NOT NULL,
    gia_tri             TEXT NOT NULL,
    kieu_du_lieu        VARCHAR(30) NOT NULL DEFAULT 'CHUOI',
    nhom                VARCHAR(100) NOT NULL DEFAULT 'HE_THONG',
    mo_ta               VARCHAR(500) NULL,
    cho_phep_sua        TINYINT(1) NOT NULL DEFAULT 1,
    ngay_tao            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ngay_cap_nhat       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    UNIQUE KEY uk_cau_hinh_khoa (khoa),
    KEY idx_cau_hinh_nhom (nhom),
    CONSTRAINT ck_cau_hinh_kieu CHECK (kieu_du_lieu IN ('CHUOI', 'SO', 'BOOLEAN', 'JSON'))
) ENGINE=InnoDB;

-- ============================================================================
-- 10. NHẬT KÝ HOẠT ĐỘNG / AUDIT LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS nhat_ky_hoat_dong (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    tai_khoan_id        BIGINT UNSIGNED NULL,
    hanh_dong           VARCHAR(120) NOT NULL,
    doi_tuong           VARCHAR(120) NOT NULL,
    doi_tuong_id        VARCHAR(100) NULL,
    du_lieu_cu          JSON NULL,
    du_lieu_moi         JSON NULL,
    dia_chi_ip          VARCHAR(64) NULL,
    user_agent          VARCHAR(1000) NULL,
    ma_yeu_cau          VARCHAR(100) NULL COMMENT 'Request ID / correlation ID',
    thoi_gian           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    KEY idx_nhat_ky_tai_khoan (tai_khoan_id, thoi_gian),
    KEY idx_nhat_ky_doi_tuong (doi_tuong, doi_tuong_id),
    KEY idx_nhat_ky_hanh_dong (hanh_dong),
    KEY idx_nhat_ky_thoi_gian (thoi_gian),
    CONSTRAINT fk_nhat_ky_tai_khoan FOREIGN KEY (tai_khoan_id) REFERENCES tai_khoan(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- 11. VIEW HỖ TRỢ ADMIN / DASHBOARD
-- ============================================================================

CREATE OR REPLACE VIEW v_dat_ban_tong_quan AS
SELECT
    db.id,
    db.ma_dat_ban,
    db.khach_hang_id,
    db.ho_ten,
    db.so_dien_thoai,
    db.email,
    db.ngay_dat,
    db.gio_bat_dau,
    db.gio_ket_thuc,
    db.so_nguoi,
    db.trang_thai,
    db.nguon_dat,
    kv.id AS khu_vuc_id,
    kv.ten_khu_vuc,
    GROUP_CONCAT(ba.ma_ban ORDER BY ba.ma_ban SEPARATOR ', ') AS danh_sach_ma_ban,
    GROUP_CONCAT(ba.ten_ban ORDER BY ba.ma_ban SEPARATOR ', ') AS danh_sach_ten_ban,
    COUNT(ba.id) AS so_ban,
    db.ngay_tao,
    db.ngay_cap_nhat
FROM dat_ban db
LEFT JOIN khu_vuc kv ON kv.id = db.khu_vuc_id
LEFT JOIN chi_tiet_dat_ban ctdb ON ctdb.dat_ban_id = db.id
LEFT JOIN ban_an ba ON ba.id = ctdb.ban_an_id
GROUP BY
    db.id, db.ma_dat_ban, db.khach_hang_id, db.ho_ten, db.so_dien_thoai,
    db.email, db.ngay_dat, db.gio_bat_dau, db.gio_ket_thuc, db.so_nguoi,
    db.trang_thai, db.nguon_dat, kv.id, kv.ten_khu_vuc, db.ngay_tao, db.ngay_cap_nhat;

CREATE OR REPLACE VIEW v_thong_ke_khach_hang AS
SELECT
    kh.id,
    kh.ma_khach_hang,
    kh.ho_ten,
    kh.so_dien_thoai,
    kh.email,
    COUNT(db.id) AS tong_dat_ban,
    SUM(CASE WHEN db.trang_thai = 'DA_HOAN_THANH' THEN 1 ELSE 0 END) AS tong_hoan_thanh,
    SUM(CASE WHEN db.trang_thai = 'DA_HUY' THEN 1 ELSE 0 END) AS tong_huy,
    SUM(CASE WHEN db.trang_thai = 'KHONG_DEN' THEN 1 ELSE 0 END) AS tong_khong_den,
    MAX(db.gio_bat_dau) AS lan_dat_gan_nhat
FROM khach_hang kh
LEFT JOIN dat_ban db ON db.khach_hang_id = kh.id
WHERE kh.ngay_xoa IS NULL
GROUP BY kh.id, kh.ma_khach_hang, kh.ho_ten, kh.so_dien_thoai, kh.email;

-- ============================================================================
-- 12. DỮ LIỆU NỀN BAN ĐẦU
-- ============================================================================

START TRANSACTION;

-- Vai trò hệ thống
INSERT INTO vai_tro (ma_vai_tro, ten_vai_tro, mo_ta, la_he_thong, trang_thai)
VALUES
    ('QUAN_TRI_VIEN', 'Quản trị viên', 'Toàn quyền quản trị hệ thống', 1, 'HOAT_DONG'),
    ('NHAN_VIEN', 'Nhân viên', 'Nhân viên vận hành đặt bàn và khách hàng', 1, 'HOAT_DONG'),
    ('KHACH_HANG', 'Khách hàng', 'Tài khoản khách hàng', 1, 'HOAT_DONG')
ON DUPLICATE KEY UPDATE
    ten_vai_tro = VALUES(ten_vai_tro),
    mo_ta = VALUES(mo_ta),
    trang_thai = VALUES(trang_thai);

-- Danh sách quyền
INSERT INTO quyen (ma_quyen, ten_quyen, nhom_quyen, mo_ta)
VALUES
    ('DASHBOARD_XEM', 'Xem Dashboard', 'DASHBOARD', NULL),

    ('DAT_BAN_XEM', 'Xem đặt bàn', 'DAT_BAN', NULL),
    ('DAT_BAN_TAO', 'Tạo đặt bàn', 'DAT_BAN', NULL),
    ('DAT_BAN_SUA', 'Cập nhật đặt bàn', 'DAT_BAN', NULL),
    ('DAT_BAN_XAC_NHAN', 'Xác nhận đặt bàn', 'DAT_BAN', NULL),
    ('DAT_BAN_SAP_BAN', 'Sắp bàn', 'DAT_BAN', NULL),
    ('DAT_BAN_CHECK_IN', 'Check-in khách', 'DAT_BAN', NULL),
    ('DAT_BAN_HOAN_THANH', 'Hoàn thành đặt bàn', 'DAT_BAN', NULL),
    ('DAT_BAN_HUY', 'Hủy đặt bàn', 'DAT_BAN', NULL),
    ('DAT_BAN_KHONG_DEN', 'Đánh dấu khách không đến', 'DAT_BAN', NULL),

    ('KHU_VUC_XEM', 'Xem khu vực', 'KHU_VUC', NULL),
    ('KHU_VUC_QUAN_LY', 'Quản lý khu vực', 'KHU_VUC', NULL),
    ('BAN_AN_XEM', 'Xem bàn ăn', 'BAN_AN', NULL),
    ('BAN_AN_QUAN_LY', 'Quản lý bàn ăn', 'BAN_AN', NULL),

    ('DANH_MUC_MON_XEM', 'Xem danh mục món', 'THUC_DON', NULL),
    ('DANH_MUC_MON_QUAN_LY', 'Quản lý danh mục món', 'THUC_DON', NULL),
    ('MON_AN_XEM', 'Xem món ăn', 'THUC_DON', NULL),
    ('MON_AN_QUAN_LY', 'Quản lý món ăn', 'THUC_DON', NULL),

    ('KHACH_HANG_XEM', 'Xem khách hàng', 'KHACH_HANG', NULL),
    ('KHACH_HANG_SUA', 'Cập nhật khách hàng', 'KHACH_HANG', NULL),
    ('KHACH_HANG_KHOA', 'Khóa/mở khóa khách hàng', 'KHACH_HANG', NULL),

    ('NHAN_VIEN_XEM', 'Xem nhân viên', 'NHAN_VIEN', NULL),
    ('NHAN_VIEN_QUAN_LY', 'Quản lý nhân viên', 'NHAN_VIEN', NULL),

    ('KHUYEN_MAI_XEM', 'Xem khuyến mãi', 'KHUYEN_MAI', NULL),
    ('KHUYEN_MAI_QUAN_LY', 'Quản lý khuyến mãi', 'KHUYEN_MAI', NULL),

    ('DANH_GIA_XEM', 'Xem đánh giá', 'DANH_GIA', NULL),
    ('DANH_GIA_QUAN_LY', 'Quản lý đánh giá', 'DANH_GIA', NULL),

    ('BAO_CAO_XEM', 'Xem báo cáo', 'BAO_CAO', NULL),
    ('TAI_KHOAN_QUAN_LY', 'Quản lý tài khoản', 'HE_THONG', NULL),
    ('VAI_TRO_QUAN_LY', 'Quản lý vai trò và quyền', 'HE_THONG', NULL),
    ('LICH_PHUC_VU_QUAN_LY', 'Quản lý lịch phục vụ', 'LICH_PHUC_VU', NULL)
ON DUPLICATE KEY UPDATE
    ten_quyen = VALUES(ten_quyen),
    nhom_quyen = VALUES(nhom_quyen),
    mo_ta = VALUES(mo_ta);

-- Quản trị viên có toàn bộ quyền
INSERT IGNORE INTO vai_tro_quyen (vai_tro_id, quyen_id)
SELECT vt.id, q.id
FROM vai_tro vt
CROSS JOIN quyen q
WHERE vt.ma_vai_tro = 'QUAN_TRI_VIEN';

-- Nhân viên: nhóm quyền vận hành cơ bản
INSERT IGNORE INTO vai_tro_quyen (vai_tro_id, quyen_id)
SELECT vt.id, q.id
FROM vai_tro vt
JOIN quyen q ON q.ma_quyen IN (
    'DASHBOARD_XEM',
    'DAT_BAN_XEM', 'DAT_BAN_TAO', 'DAT_BAN_SUA', 'DAT_BAN_XAC_NHAN',
    'DAT_BAN_SAP_BAN', 'DAT_BAN_CHECK_IN', 'DAT_BAN_HOAN_THANH',
    'DAT_BAN_HUY', 'DAT_BAN_KHONG_DEN',
    'KHU_VUC_XEM', 'BAN_AN_XEM',
    'KHACH_HANG_XEM', 'KHACH_HANG_SUA',
    'DANH_MUC_MON_XEM', 'MON_AN_XEM',
    'DANH_GIA_XEM'
)
WHERE vt.ma_vai_tro = 'NHAN_VIEN';

-- Giờ hoạt động mặc định 10:00 - 22:00, 7 ngày/tuần
INSERT INTO gio_hoat_dong (thu_trong_tuan, ca_so, gio_mo_cua, gio_dong_cua, hoat_dong, ghi_chu)
VALUES
    (1, 1, '10:00:00', '22:00:00', 1, 'Thứ Hai'),
    (2, 1, '10:00:00', '22:00:00', 1, 'Thứ Ba'),
    (3, 1, '10:00:00', '22:00:00', 1, 'Thứ Tư'),
    (4, 1, '10:00:00', '22:00:00', 1, 'Thứ Năm'),
    (5, 1, '10:00:00', '22:00:00', 1, 'Thứ Sáu'),
    (6, 1, '10:00:00', '22:00:00', 1, 'Thứ Bảy'),
    (7, 1, '10:00:00', '22:00:00', 1, 'Chủ Nhật')
ON DUPLICATE KEY UPDATE
    gio_mo_cua = VALUES(gio_mo_cua),
    gio_dong_cua = VALUES(gio_dong_cua),
    hoat_dong = VALUES(hoat_dong),
    ghi_chu = VALUES(ghi_chu);

-- Cấu hình hệ thống
INSERT INTO cau_hinh (khoa, gia_tri, kieu_du_lieu, nhom, mo_ta, cho_phep_sua)
VALUES
    ('TEN_NHA_HANG', 'Nhà Hàng Demo', 'CHUOI', 'THONG_TIN_NHA_HANG', 'Tên hiển thị của nhà hàng', 1),
    ('DIA_CHI_NHA_HANG', '', 'CHUOI', 'THONG_TIN_NHA_HANG', 'Địa chỉ nhà hàng', 1),
    ('SO_DIEN_THOAI_NHA_HANG', '', 'CHUOI', 'THONG_TIN_NHA_HANG', 'Số điện thoại liên hệ', 1),
    ('EMAIL_NHA_HANG', '', 'CHUOI', 'THONG_TIN_NHA_HANG', 'Email liên hệ', 1),
    ('CHO_PHEP_DAT_BAN', 'true', 'BOOLEAN', 'DAT_BAN', 'Bật/tắt chức năng đặt bàn', 1),
    ('THOI_LUONG_DAT_BAN_PHUT', '120', 'SO', 'DAT_BAN', 'Thời lượng mặc định của một lượt đặt bàn', 1),
    ('DAT_TRUOC_TOI_THIEU_PHUT', '30', 'SO', 'DAT_BAN', 'Số phút phải đặt trước tối thiểu', 1),
    ('DAT_TRUOC_TOI_DA_NGAY', '30', 'SO', 'DAT_BAN', 'Số ngày được phép đặt trước tối đa', 1),
    ('THOI_GIAN_CHO_KHACH_PHUT', '15', 'SO', 'DAT_BAN', 'Thời gian chờ trước khi đánh dấu không đến', 1),
    ('THOI_GIAN_HUY_TRUOC_PHUT', '60', 'SO', 'DAT_BAN', 'Khách chỉ được tự hủy trước giờ đặt tối thiểu số phút này', 1),
    ('SO_NGUOI_TOI_DA_MOI_DAT_BAN', '20', 'SO', 'DAT_BAN', 'Số người tối đa cho một yêu cầu đặt bàn online', 1),
    ('CHO_PHEP_KHACH_CHON_BAN', 'true', 'BOOLEAN', 'DAT_BAN', 'Cho phép khách tự chọn bàn cụ thể', 1),
    ('KHOANG_CACH_SLOT_PHUT', '30', 'SO', 'DAT_BAN', 'Khoảng cách giữa các khung giờ đặt bàn', 1)
ON DUPLICATE KEY UPDATE
    gia_tri = VALUES(gia_tri),
    kieu_du_lieu = VALUES(kieu_du_lieu),
    nhom = VALUES(nhom),
    mo_ta = VALUES(mo_ta),
    cho_phep_sua = VALUES(cho_phep_sua);

-- Khu vực mẫu
INSERT INTO khu_vuc (ma_khu_vuc, ten_khu_vuc, mo_ta, thu_tu, trang_thai)
VALUES
    ('KV_TRONG_NHA', 'Trong nhà', 'Khu vực bàn trong nhà', 1, 'HOAT_DONG'),
    ('KV_NGOAI_TROI', 'Ngoài trời', 'Khu vực ngoài trời', 2, 'HOAT_DONG'),
    ('KV_VIP', 'Phòng VIP', 'Khu vực phòng riêng/VIP', 3, 'HOAT_DONG')
ON DUPLICATE KEY UPDATE
    ten_khu_vuc = VALUES(ten_khu_vuc),
    mo_ta = VALUES(mo_ta),
    thu_tu = VALUES(thu_tu),
    trang_thai = VALUES(trang_thai);

-- Bàn mẫu trong nhà
INSERT INTO ban_an (ma_ban, ten_ban, khu_vuc_id, suc_chua, suc_chua_toi_da, trang_thai)
SELECT 'A01', 'Bàn A01', id, 2, 2, 'TRONG' FROM khu_vuc WHERE ma_khu_vuc = 'KV_TRONG_NHA'
ON DUPLICATE KEY UPDATE ten_ban = VALUES(ten_ban), khu_vuc_id = VALUES(khu_vuc_id), suc_chua = VALUES(suc_chua), suc_chua_toi_da = VALUES(suc_chua_toi_da);
INSERT INTO ban_an (ma_ban, ten_ban, khu_vuc_id, suc_chua, suc_chua_toi_da, trang_thai)
SELECT 'A02', 'Bàn A02', id, 2, 2, 'TRONG' FROM khu_vuc WHERE ma_khu_vuc = 'KV_TRONG_NHA'
ON DUPLICATE KEY UPDATE ten_ban = VALUES(ten_ban), khu_vuc_id = VALUES(khu_vuc_id), suc_chua = VALUES(suc_chua), suc_chua_toi_da = VALUES(suc_chua_toi_da);
INSERT INTO ban_an (ma_ban, ten_ban, khu_vuc_id, suc_chua, suc_chua_toi_da, trang_thai)
SELECT 'A03', 'Bàn A03', id, 4, 4, 'TRONG' FROM khu_vuc WHERE ma_khu_vuc = 'KV_TRONG_NHA'
ON DUPLICATE KEY UPDATE ten_ban = VALUES(ten_ban), khu_vuc_id = VALUES(khu_vuc_id), suc_chua = VALUES(suc_chua), suc_chua_toi_da = VALUES(suc_chua_toi_da);
INSERT INTO ban_an (ma_ban, ten_ban, khu_vuc_id, suc_chua, suc_chua_toi_da, trang_thai)
SELECT 'A04', 'Bàn A04', id, 4, 6, 'TRONG' FROM khu_vuc WHERE ma_khu_vuc = 'KV_TRONG_NHA'
ON DUPLICATE KEY UPDATE ten_ban = VALUES(ten_ban), khu_vuc_id = VALUES(khu_vuc_id), suc_chua = VALUES(suc_chua), suc_chua_toi_da = VALUES(suc_chua_toi_da);
INSERT INTO ban_an (ma_ban, ten_ban, khu_vuc_id, suc_chua, suc_chua_toi_da, trang_thai)
SELECT 'A05', 'Bàn A05', id, 6, 8, 'TRONG' FROM khu_vuc WHERE ma_khu_vuc = 'KV_TRONG_NHA'
ON DUPLICATE KEY UPDATE ten_ban = VALUES(ten_ban), khu_vuc_id = VALUES(khu_vuc_id), suc_chua = VALUES(suc_chua), suc_chua_toi_da = VALUES(suc_chua_toi_da);
INSERT INTO ban_an (ma_ban, ten_ban, khu_vuc_id, suc_chua, suc_chua_toi_da, trang_thai)
SELECT 'A06', 'Bàn A06', id, 8, 10, 'TRONG' FROM khu_vuc WHERE ma_khu_vuc = 'KV_TRONG_NHA'
ON DUPLICATE KEY UPDATE ten_ban = VALUES(ten_ban), khu_vuc_id = VALUES(khu_vuc_id), suc_chua = VALUES(suc_chua), suc_chua_toi_da = VALUES(suc_chua_toi_da);

-- Bàn mẫu ngoài trời
INSERT INTO ban_an (ma_ban, ten_ban, khu_vuc_id, suc_chua, suc_chua_toi_da, trang_thai)
SELECT 'B01', 'Bàn B01', id, 2, 4, 'TRONG' FROM khu_vuc WHERE ma_khu_vuc = 'KV_NGOAI_TROI'
ON DUPLICATE KEY UPDATE ten_ban = VALUES(ten_ban), khu_vuc_id = VALUES(khu_vuc_id), suc_chua = VALUES(suc_chua), suc_chua_toi_da = VALUES(suc_chua_toi_da);
INSERT INTO ban_an (ma_ban, ten_ban, khu_vuc_id, suc_chua, suc_chua_toi_da, trang_thai)
SELECT 'B02', 'Bàn B02', id, 4, 4, 'TRONG' FROM khu_vuc WHERE ma_khu_vuc = 'KV_NGOAI_TROI'
ON DUPLICATE KEY UPDATE ten_ban = VALUES(ten_ban), khu_vuc_id = VALUES(khu_vuc_id), suc_chua = VALUES(suc_chua), suc_chua_toi_da = VALUES(suc_chua_toi_da);
INSERT INTO ban_an (ma_ban, ten_ban, khu_vuc_id, suc_chua, suc_chua_toi_da, trang_thai)
SELECT 'B03', 'Bàn B03', id, 6, 8, 'TRONG' FROM khu_vuc WHERE ma_khu_vuc = 'KV_NGOAI_TROI'
ON DUPLICATE KEY UPDATE ten_ban = VALUES(ten_ban), khu_vuc_id = VALUES(khu_vuc_id), suc_chua = VALUES(suc_chua), suc_chua_toi_da = VALUES(suc_chua_toi_da);

-- Bàn VIP
INSERT INTO ban_an (ma_ban, ten_ban, khu_vuc_id, suc_chua, suc_chua_toi_da, trang_thai)
SELECT 'V01', 'Bàn VIP 01', id, 8, 10, 'TRONG' FROM khu_vuc WHERE ma_khu_vuc = 'KV_VIP'
ON DUPLICATE KEY UPDATE ten_ban = VALUES(ten_ban), khu_vuc_id = VALUES(khu_vuc_id), suc_chua = VALUES(suc_chua), suc_chua_toi_da = VALUES(suc_chua_toi_da);
INSERT INTO ban_an (ma_ban, ten_ban, khu_vuc_id, suc_chua, suc_chua_toi_da, trang_thai)
SELECT 'V02', 'Bàn VIP 02', id, 10, 12, 'TRONG' FROM khu_vuc WHERE ma_khu_vuc = 'KV_VIP'
ON DUPLICATE KEY UPDATE ten_ban = VALUES(ten_ban), khu_vuc_id = VALUES(khu_vuc_id), suc_chua = VALUES(suc_chua), suc_chua_toi_da = VALUES(suc_chua_toi_da);

-- Cặp bàn có thể ghép (chuẩn hóa ban_1_id < ban_2_id ở Backend)
INSERT IGNORE INTO lien_ket_ban (ban_1_id, ban_2_id, co_the_ghep, ghi_chu)
SELECT b1.id, b2.id, 1, 'Hai bàn liền kề'
FROM ban_an b1, ban_an b2
WHERE b1.ma_ban = 'A01' AND b2.ma_ban = 'A02';

INSERT IGNORE INTO lien_ket_ban (ban_1_id, ban_2_id, co_the_ghep, ghi_chu)
SELECT b1.id, b2.id, 1, 'Hai bàn liền kề'
FROM ban_an b1, ban_an b2
WHERE b1.ma_ban = 'A03' AND b2.ma_ban = 'A04';

INSERT IGNORE INTO lien_ket_ban (ban_1_id, ban_2_id, co_the_ghep, ghi_chu)
SELECT b1.id, b2.id, 1, 'Hai bàn liền kề'
FROM ban_an b1, ban_an b2
WHERE b1.ma_ban = 'B01' AND b2.ma_ban = 'B02';

-- Danh mục món mẫu
INSERT INTO danh_muc_mon (ma_danh_muc, ten_danh_muc, duong_dan, mo_ta, thu_tu, trang_thai)
VALUES
    ('DM_KHAI_VI', 'Khai vị', 'khai-vi', 'Các món khai vị', 1, 'HOAT_DONG'),
    ('DM_MON_CHINH', 'Món chính', 'mon-chinh', 'Các món chính', 2, 'HOAT_DONG'),
    ('DM_MON_NUOC', 'Món nước', 'mon-nuoc', 'Các món nước', 3, 'HOAT_DONG'),
    ('DM_DO_UONG', 'Đồ uống', 'do-uong', 'Đồ uống', 4, 'HOAT_DONG'),
    ('DM_TRANG_MIENG', 'Tráng miệng', 'trang-mieng', 'Các món tráng miệng', 5, 'HOAT_DONG')
ON DUPLICATE KEY UPDATE
    ten_danh_muc = VALUES(ten_danh_muc),
    duong_dan = VALUES(duong_dan),
    mo_ta = VALUES(mo_ta),
    thu_tu = VALUES(thu_tu),
    trang_thai = VALUES(trang_thai);

-- Món mẫu (chỉ để FE/BE có dữ liệu ban đầu)
INSERT INTO mon_an (ma_mon, danh_muc_id, ten_mon, duong_dan, mo_ta, gia, gia_khuyen_mai, la_mon_noi_bat, con_mon, trang_thai)
SELECT 'MON001', id, 'Gỏi cuốn', 'goi-cuon', 'Món khai vị nhẹ', 45000, NULL, 1, 1, 'HOAT_DONG'
FROM danh_muc_mon WHERE ma_danh_muc = 'DM_KHAI_VI'
ON DUPLICATE KEY UPDATE ten_mon = VALUES(ten_mon), danh_muc_id = VALUES(danh_muc_id), gia = VALUES(gia), con_mon = VALUES(con_mon), trang_thai = VALUES(trang_thai);

INSERT INTO mon_an (ma_mon, danh_muc_id, ten_mon, duong_dan, mo_ta, gia, gia_khuyen_mai, la_mon_noi_bat, con_mon, trang_thai)
SELECT 'MON002', id, 'Bò lúc lắc', 'bo-luc-lac', 'Bò lúc lắc dùng kèm rau', 135000, NULL, 1, 1, 'HOAT_DONG'
FROM danh_muc_mon WHERE ma_danh_muc = 'DM_MON_CHINH'
ON DUPLICATE KEY UPDATE ten_mon = VALUES(ten_mon), danh_muc_id = VALUES(danh_muc_id), gia = VALUES(gia), con_mon = VALUES(con_mon), trang_thai = VALUES(trang_thai);

INSERT INTO mon_an (ma_mon, danh_muc_id, ten_mon, duong_dan, mo_ta, gia, gia_khuyen_mai, la_mon_noi_bat, con_mon, trang_thai)
SELECT 'MON003', id, 'Bún bò', 'bun-bo', 'Món nước đặc trưng', 65000, NULL, 1, 1, 'HOAT_DONG'
FROM danh_muc_mon WHERE ma_danh_muc = 'DM_MON_NUOC'
ON DUPLICATE KEY UPDATE ten_mon = VALUES(ten_mon), danh_muc_id = VALUES(danh_muc_id), gia = VALUES(gia), con_mon = VALUES(con_mon), trang_thai = VALUES(trang_thai);

INSERT INTO mon_an (ma_mon, danh_muc_id, ten_mon, duong_dan, mo_ta, gia, gia_khuyen_mai, la_mon_noi_bat, con_mon, trang_thai)
SELECT 'MON004', id, 'Nước ngọt', 'nuoc-ngot', 'Nước ngọt đóng lon/chai', 20000, NULL, 0, 1, 'HOAT_DONG'
FROM danh_muc_mon WHERE ma_danh_muc = 'DM_DO_UONG'
ON DUPLICATE KEY UPDATE ten_mon = VALUES(ten_mon), danh_muc_id = VALUES(danh_muc_id), gia = VALUES(gia), con_mon = VALUES(con_mon), trang_thai = VALUES(trang_thai);

INSERT INTO mon_an (ma_mon, danh_muc_id, ten_mon, duong_dan, mo_ta, gia, gia_khuyen_mai, la_mon_noi_bat, con_mon, trang_thai)
SELECT 'MON005', id, 'Rau câu', 'rau-cau', 'Món tráng miệng', 30000, NULL, 0, 1, 'HOAT_DONG'
FROM danh_muc_mon WHERE ma_danh_muc = 'DM_TRANG_MIENG'
ON DUPLICATE KEY UPDATE ten_mon = VALUES(ten_mon), danh_muc_id = VALUES(danh_muc_id), gia = VALUES(gia), con_mon = VALUES(con_mon), trang_thai = VALUES(trang_thai);

COMMIT;

-- ============================================================================
-- 13. TÀI KHOẢN ADMIN
-- ============================================================================
-- KHÔNG chèn mật khẩu thô hoặc hash giả trong file SQL này.
-- Tài khoản admin đầu tiên nên được seed từ NestJS/Prisma sau khi bcrypt/argon2 hash
-- mật khẩu thật. Ví dụ luồng seed Backend:
--   1) tìm role QUAN_TRI_VIEN
--   2) hash mật khẩu bằng bcrypt/argon2
--   3) INSERT tai_khoan
--   4) INSERT nhan_vien
-- Điều này tránh việc commit một mật khẩu mặc định cố định vào repository.

-- ============================================================================
-- 14. QUERY MẪU: TÌM BÀN TRỐNG
-- ============================================================================
-- Ý tưởng nghiệp vụ:
--   - Bàn phải đang hoạt động (TRONG hoặc DANG_SU_DUNG hiện tại tùy logic vận hành;
--     với đặt lịch tương lai nên loại BAO_TRI/NGUNG_SU_DUNG).
--   - Đủ sức chứa.
--   - Không có booking hoạt động bị giao nhau về thời gian.
--
-- Điều kiện giao nhau:
--   booking_cu.gio_bat_dau < :gio_ket_thuc_moi
--   AND booking_cu.gio_ket_thuc > :gio_bat_dau_moi
--
-- Query tham khảo (Backend nên chạy trong transaction khi tạo booking):
--
-- SELECT ba.*
-- FROM ban_an ba
-- WHERE ba.ngay_xoa IS NULL
--   AND ba.trang_thai NOT IN ('BAO_TRI', 'NGUNG_SU_DUNG')
--   AND ba.suc_chua_toi_da >= :so_nguoi
--   AND (:khu_vuc_id IS NULL OR ba.khu_vuc_id = :khu_vuc_id)
--   AND NOT EXISTS (
--       SELECT 1
--       FROM chi_tiet_dat_ban ctdb
--       JOIN dat_ban db ON db.id = ctdb.dat_ban_id
--       WHERE ctdb.ban_an_id = ba.id
--         AND db.trang_thai IN ('CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DA_CHECK_IN')
--         AND db.gio_bat_dau < :gio_ket_thuc_moi
--         AND db.gio_ket_thuc > :gio_bat_dau_moi
--   )
-- ORDER BY ba.suc_chua_toi_da ASC, ba.ma_ban ASC;

-- ============================================================================
-- 15. LƯU Ý CONCURRENCY / DOUBLE BOOKING
-- ============================================================================
-- MySQL không có exclusion constraint kiểu PostgreSQL để cấm khoảng thời gian giao
-- nhau một cách trực tiếp. Vì vậy luồng tạo booking phải được Backend xử lý bằng
-- transaction và lock phù hợp (SELECT ... FOR UPDATE hoặc chiến lược khóa tương đương):
--
--   BEGIN;
--   1) khóa các hàng ban_an được chọn;
--   2) kiểm tra lại booking giao nhau;
--   3) tạo dat_ban;
--   4) tạo chi_tiet_dat_ban;
--   5) tạo lich_su_dat_ban;
--   COMMIT;
--
-- Frontend chỉ hỗ trợ trải nghiệm; Backend là nơi quyết định cuối cùng.

-- ============================================================================
-- 16. KIỂM TRA NHANH SAU KHI IMPORT
-- ============================================================================

SELECT 'Database quan_ly_nha_hang da khoi tao thanh cong' AS thong_bao;
SELECT COUNT(*) AS so_vai_tro FROM vai_tro;
SELECT COUNT(*) AS so_quyen FROM quyen;
SELECT COUNT(*) AS so_khu_vuc FROM khu_vuc;
SELECT COUNT(*) AS so_ban FROM ban_an;
SELECT COUNT(*) AS so_danh_muc FROM danh_muc_mon;
SELECT COUNT(*) AS so_mon FROM mon_an;
