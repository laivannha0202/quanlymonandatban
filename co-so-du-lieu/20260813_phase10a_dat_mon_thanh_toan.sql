-- Phase 10A - chạy đúng 1 lần trên database cũ.
SET NAMES utf8mb4;
SET time_zone = '+07:00';
USE quan_ly_nha_hang;

ALTER TABLE dat_ban
  ADD COLUMN khuyen_mai_id BIGINT UNSIGNED NULL AFTER khu_vuc_id,
  ADD COLUMN ma_khuyen_mai_ap_dung VARCHAR(50) NULL AFTER kieu_xep_ban,
  ADD COLUMN tam_tinh_mon DECIMAL(15,2) NOT NULL DEFAULT 0 AFTER ma_khuyen_mai_ap_dung,
  ADD COLUMN tien_giam DECIMAL(15,2) NOT NULL DEFAULT 0 AFTER tam_tinh_mon,
  ADD COLUMN tien_coc DECIMAL(15,2) NOT NULL DEFAULT 0 AFTER tien_giam,
  ADD COLUMN tong_thanh_toan_truoc DECIMAL(15,2) NOT NULL DEFAULT 0 AFTER tien_coc,
  ADD KEY idx_dat_ban_khuyen_mai (khuyen_mai_id),
  ADD CONSTRAINT fk_dat_ban_khuyen_mai FOREIGN KEY (khuyen_mai_id) REFERENCES khuyen_mai(id) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT ck_dat_ban_tam_tinh_mon CHECK (tam_tinh_mon >= 0),
  ADD CONSTRAINT ck_dat_ban_tien_giam CHECK (tien_giam >= 0 AND tien_giam <= tam_tinh_mon),
  ADD CONSTRAINT ck_dat_ban_tien_coc CHECK (tien_coc >= 0),
  ADD CONSTRAINT ck_dat_ban_tong_thanh_toan CHECK (tong_thanh_toan_truoc >= 0);

CREATE TABLE chi_tiet_dat_mon (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, dat_ban_id BIGINT UNSIGNED NOT NULL, mon_an_id BIGINT UNSIGNED NOT NULL,
  ma_mon VARCHAR(30) NOT NULL, ten_mon VARCHAR(200) NOT NULL, don_gia DECIMAL(15,2) NOT NULL,
  so_luong INT UNSIGNED NOT NULL, thanh_tien DECIMAL(15,2) NOT NULL, ghi_chu VARCHAR(500) NULL,
  ngay_tao DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), PRIMARY KEY(id),
  UNIQUE KEY uk_ctdm_dat_ban_mon(dat_ban_id,mon_an_id), KEY idx_ctdm_mon_an(mon_an_id),
  CONSTRAINT fk_ctdm_dat_ban FOREIGN KEY(dat_ban_id) REFERENCES dat_ban(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_ctdm_mon_an FOREIGN KEY(mon_an_id) REFERENCES mon_an(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT ck_ctdm_don_gia CHECK(don_gia>=0), CONSTRAINT ck_ctdm_so_luong CHECK(so_luong>=1), CONSTRAINT ck_ctdm_thanh_tien CHECK(thanh_tien>=0)
) ENGINE=InnoDB;

CREATE TABLE thanh_toan (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, ma_thanh_toan VARCHAR(50) NOT NULL, dat_ban_id BIGINT UNSIGNED NOT NULL,
  so_tien DECIMAL(15,2) NOT NULL, phuong_thuc VARCHAR(30) NOT NULL DEFAULT 'MO_PHONG', trang_thai VARCHAR(30) NOT NULL DEFAULT 'CHO_THANH_TOAN',
  ma_giao_dich_cong VARCHAR(150) NULL, khoa_idempotency VARCHAR(120) NULL, ghi_chu VARCHAR(500) NULL,
  thoi_gian_thanh_toan DATETIME(3) NULL, ngay_tao DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ngay_cap_nhat DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), PRIMARY KEY(id),
  UNIQUE KEY uk_thanh_toan_ma(ma_thanh_toan), UNIQUE KEY uk_thanh_toan_idempotency(khoa_idempotency),
  UNIQUE KEY uk_thanh_toan_cong(phuong_thuc,ma_giao_dich_cong), KEY idx_thanh_toan_dat_ban(dat_ban_id,ngay_tao), KEY idx_thanh_toan_trang_thai(trang_thai,ngay_tao),
  CONSTRAINT fk_thanh_toan_dat_ban FOREIGN KEY(dat_ban_id) REFERENCES dat_ban(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT ck_thanh_toan_so_tien CHECK(so_tien>0),
  CONSTRAINT ck_thanh_toan_phuong_thuc CHECK(phuong_thuc IN('MO_PHONG','VNPAY','MOMO','CHUYEN_KHOAN','TIEN_MAT')),
  CONSTRAINT ck_thanh_toan_trang_thai CHECK(trang_thai IN('CHO_THANH_TOAN','DA_THANH_TOAN','THAT_BAI','DA_HUY','DA_HOAN_TIEN','HOAN_MOT_PHAN'))
) ENGINE=InnoDB;

CREATE TABLE hoan_tien (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, ma_hoan_tien VARCHAR(50) NOT NULL, thanh_toan_id BIGINT UNSIGNED NOT NULL,
  so_tien DECIMAL(15,2) NOT NULL, ly_do VARCHAR(500) NOT NULL, trang_thai VARCHAR(30) NOT NULL DEFAULT 'CHO_HOAN',
  ma_giao_dich_cong VARCHAR(150) NULL, khoa_idempotency VARCHAR(120) NULL, nguoi_thuc_hien_id BIGINT UNSIGNED NULL,
  thoi_gian_hoan DATETIME(3) NULL, ngay_tao DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ngay_cap_nhat DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), PRIMARY KEY(id),
  UNIQUE KEY uk_hoan_tien_ma(ma_hoan_tien), UNIQUE KEY uk_hoan_tien_idempotency(khoa_idempotency), UNIQUE KEY uk_hoan_tien_giao_dich_cong(ma_giao_dich_cong),
  KEY idx_hoan_tien_thanh_toan(thanh_toan_id,ngay_tao), KEY idx_hoan_tien_trang_thai(trang_thai,ngay_tao), KEY idx_hoan_tien_nguoi_thuc_hien(nguoi_thuc_hien_id),
  CONSTRAINT fk_hoan_tien_thanh_toan FOREIGN KEY(thanh_toan_id) REFERENCES thanh_toan(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_hoan_tien_nguoi_thuc_hien FOREIGN KEY(nguoi_thuc_hien_id) REFERENCES tai_khoan(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT ck_hoan_tien_so_tien CHECK(so_tien>0), CONSTRAINT ck_hoan_tien_trang_thai CHECK(trang_thai IN('CHO_HOAN','DANG_XU_LY','DA_HOAN','THAT_BAI'))
) ENGINE=InnoDB;

INSERT INTO quyen(ma_quyen,ten_quyen,nhom_quyen,mo_ta) VALUES
('THANH_TOAN_XEM','Xem thanh toán','THANH_TOAN',NULL),
('THANH_TOAN_QUAN_LY','Quản lý thanh toán','THANH_TOAN',NULL),
('HOAN_TIEN_THUC_HIEN','Thực hiện hoàn tiền','THANH_TOAN',NULL),
('CAU_HINH_DAT_BAN_QUAN_LY','Quản lý cấu hình đặt bàn và thanh toán','HE_THONG',NULL)
ON DUPLICATE KEY UPDATE ten_quyen=VALUES(ten_quyen),nhom_quyen=VALUES(nhom_quyen),mo_ta=VALUES(mo_ta);

INSERT IGNORE INTO vai_tro_quyen(vai_tro_id,quyen_id)
SELECT vt.id,q.id FROM vai_tro vt JOIN quyen q ON q.ma_quyen IN('THANH_TOAN_XEM','THANH_TOAN_QUAN_LY','HOAN_TIEN_THUC_HIEN','CAU_HINH_DAT_BAN_QUAN_LY') WHERE vt.ma_vai_tro='QUAN_TRI_VIEN';
INSERT IGNORE INTO vai_tro_quyen(vai_tro_id,quyen_id)
SELECT vt.id,q.id FROM vai_tro vt JOIN quyen q ON q.ma_quyen='THANH_TOAN_XEM' WHERE vt.ma_vai_tro='NHAN_VIEN';

INSERT INTO cau_hinh(khoa,gia_tri,kieu_du_lieu,nhom,mo_ta,cho_phep_sua) VALUES
('CHO_PHEP_DAT_MON_TRUOC','true','BOOLEAN','DAT_BAN','Cho phép khách chọn món trước khi hoàn tất đặt bàn',1),
('YEU_CAU_THANH_TOAN_MON_TRUOC','true','BOOLEAN','THANH_TOAN','Yêu cầu thanh toán món đã chọn trước khi xác nhận giao dịch',1),
('TIEN_COC_GIU_BAN','100000','SO','THANH_TOAN','Tiền cọc giữ bàn mặc định tính theo VNĐ',1),
('THOI_GIAN_THANH_TOAN_PHUT','15','SO','THANH_TOAN','Số phút giữ phiên thanh toán trước khi hết hạn',1),
('TY_LE_HOAN_TIEN_HUY_DUNG_HAN','100','SO','THANH_TOAN','Tỷ lệ phần trăm hoàn tiền khi khách hủy đúng thời hạn',1)
ON DUPLICATE KEY UPDATE gia_tri=VALUES(gia_tri),kieu_du_lieu=VALUES(kieu_du_lieu),nhom=VALUES(nhom),mo_ta=VALUES(mo_ta),cho_phep_sua=VALUES(cho_phep_sua);

SELECT 'PHASE10A_MIGRATION_OK' AS ket_qua;
