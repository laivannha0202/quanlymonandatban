-- Bootstrap schema for CI only.
-- Generated from local schema with --no-data.
-- Contains NO application rows, passwords, tokens, or customer data.
-- Reference/test data must be created separately by seed-ci.

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `ban_an`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ban_an` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ma_ban` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ten_ban` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `khu_vuc_id` bigint unsigned NOT NULL,
  `suc_chua` int unsigned NOT NULL,
  `suc_chua_toi_da` int unsigned NOT NULL,
  `vi_tri_x` decimal(10,2) DEFAULT NULL COMMENT 'Tọa độ UI sơ đồ bàn, không phải GPS',
  `vi_tri_y` decimal(10,2) DEFAULT NULL COMMENT 'Tọa độ UI sơ đồ bàn, không phải GPS',
  `trang_thai` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'TRONG',
  `ghi_chu` text COLLATE utf8mb4_unicode_ci,
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ngay_cap_nhat` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `ngay_xoa` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ban_an_ma` (`ma_ban`),
  KEY `idx_ban_an_khu_vuc` (`khu_vuc_id`),
  KEY `idx_ban_an_trang_thai` (`trang_thai`),
  KEY `idx_ban_an_khu_vuc_suc_chua` (`khu_vuc_id`,`suc_chua`,`trang_thai`),
  CONSTRAINT `fk_ban_an_khu_vuc` FOREIGN KEY (`khu_vuc_id`) REFERENCES `khu_vuc` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ck_ban_an_suc_chua` CHECK ((`suc_chua` >= 1)),
  CONSTRAINT `ck_ban_an_suc_chua_toi_da` CHECK ((`suc_chua_toi_da` >= `suc_chua`)),
  CONSTRAINT `ck_ban_an_trang_thai` CHECK ((`trang_thai` in (_utf8mb4'TRONG',_utf8mb4'DANG_SU_DUNG',_utf8mb4'BAO_TRI',_utf8mb4'NGUNG_SU_DUNG')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cau_hinh`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cau_hinh` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `khoa` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `gia_tri` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `kieu_du_lieu` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CHUOI',
  `nhom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'HE_THONG',
  `mo_ta` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cho_phep_sua` tinyint(1) NOT NULL DEFAULT '1',
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ngay_cap_nhat` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cau_hinh_khoa` (`khoa`),
  KEY `idx_cau_hinh_nhom` (`nhom`),
  CONSTRAINT `ck_cau_hinh_kieu` CHECK ((`kieu_du_lieu` in (_utf8mb4'CHUOI',_utf8mb4'SO',_utf8mb4'BOOLEAN',_utf8mb4'JSON')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `chi_tiet_dat_ban`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chi_tiet_dat_ban` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `dat_ban_id` bigint unsigned NOT NULL,
  `ban_an_id` bigint unsigned NOT NULL,
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ctdb_dat_ban_ban` (`dat_ban_id`,`ban_an_id`),
  KEY `idx_ctdb_ban_an_dat_ban` (`ban_an_id`,`dat_ban_id`),
  CONSTRAINT `fk_ctdb_ban_an` FOREIGN KEY (`ban_an_id`) REFERENCES `ban_an` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_ctdb_dat_ban` FOREIGN KEY (`dat_ban_id`) REFERENCES `dat_ban` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `danh_gia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `danh_gia` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `khach_hang_id` bigint unsigned NOT NULL,
  `dat_ban_id` bigint unsigned DEFAULT NULL,
  `so_sao` tinyint unsigned NOT NULL,
  `noi_dung` text COLLATE utf8mb4_unicode_ci,
  `phan_hoi` text COLLATE utf8mb4_unicode_ci,
  `nguoi_phan_hoi_id` bigint unsigned DEFAULT NULL,
  `thoi_gian_phan_hoi` datetime(3) DEFAULT NULL,
  `hien_thi` tinyint(1) NOT NULL DEFAULT '1',
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ngay_cap_nhat` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `ngay_xoa` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_danh_gia_dat_ban` (`dat_ban_id`),
  KEY `idx_danh_gia_khach_hang` (`khach_hang_id`),
  KEY `idx_danh_gia_so_sao` (`so_sao`),
  KEY `idx_danh_gia_hien_thi` (`hien_thi`),
  KEY `idx_danh_gia_nguoi_phan_hoi` (`nguoi_phan_hoi_id`),
  CONSTRAINT `fk_danh_gia_dat_ban` FOREIGN KEY (`dat_ban_id`) REFERENCES `dat_ban` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_danh_gia_khach_hang` FOREIGN KEY (`khach_hang_id`) REFERENCES `khach_hang` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_danh_gia_nguoi_phan_hoi` FOREIGN KEY (`nguoi_phan_hoi_id`) REFERENCES `nhan_vien` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `ck_danh_gia_so_sao` CHECK ((`so_sao` between 1 and 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `danh_muc_mon`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `danh_muc_mon` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ma_danh_muc` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ten_danh_muc` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `duong_dan` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mo_ta` text COLLATE utf8mb4_unicode_ci,
  `hinh_anh` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `thu_tu` int NOT NULL DEFAULT '0',
  `trang_thai` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'HOAT_DONG',
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ngay_cap_nhat` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `ngay_xoa` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_danh_muc_mon_ma` (`ma_danh_muc`),
  UNIQUE KEY `uk_danh_muc_mon_duong_dan` (`duong_dan`),
  KEY `idx_danh_muc_mon_thu_tu` (`thu_tu`),
  KEY `idx_danh_muc_mon_trang_thai` (`trang_thai`),
  CONSTRAINT `ck_danh_muc_mon_trang_thai` CHECK ((`trang_thai` in (_utf8mb4'HOAT_DONG',_utf8mb4'NGUNG_HOAT_DONG')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `dat_ban`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dat_ban` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ma_dat_ban` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `khach_hang_id` bigint unsigned DEFAULT NULL,
  `khu_vuc_id` bigint unsigned DEFAULT NULL COMMENT 'Khu vực mong muốn/sắp xếp chính',
  `ho_ten` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Snapshot thông tin khách tại thời điểm đặt',
  `so_dien_thoai` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngay_dat` date NOT NULL,
  `gio_bat_dau` datetime(3) NOT NULL,
  `gio_ket_thuc` datetime(3) NOT NULL,
  `so_nguoi` int unsigned NOT NULL,
  `trang_thai` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CHO_XAC_NHAN',
  `nguon_dat` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'WEBSITE',
  `kieu_xep_ban` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'HE_THONG_SAP_XEP',
  `ghi_chu_khach` text COLLATE utf8mb4_unicode_ci,
  `ghi_chu_noi_bo` text COLLATE utf8mb4_unicode_ci,
  `nguoi_xac_nhan_id` bigint unsigned DEFAULT NULL,
  `thoi_gian_xac_nhan` datetime(3) DEFAULT NULL,
  `thoi_gian_check_in` datetime(3) DEFAULT NULL,
  `thoi_gian_hoan_thanh` datetime(3) DEFAULT NULL,
  `thoi_gian_huy` datetime(3) DEFAULT NULL,
  `ly_do_huy` text COLLATE utf8mb4_unicode_ci,
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ngay_cap_nhat` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_dat_ban_ma` (`ma_dat_ban`),
  KEY `idx_dat_ban_khach_hang` (`khach_hang_id`),
  KEY `idx_dat_ban_khu_vuc` (`khu_vuc_id`),
  KEY `idx_dat_ban_sdt` (`so_dien_thoai`),
  KEY `idx_dat_ban_ngay` (`ngay_dat`),
  KEY `idx_dat_ban_trang_thai_ngay` (`trang_thai`,`ngay_dat`),
  KEY `idx_dat_ban_thoi_gian` (`gio_bat_dau`,`gio_ket_thuc`),
  KEY `idx_dat_ban_nguon` (`nguon_dat`),
  KEY `fk_dat_ban_nguoi_xac_nhan` (`nguoi_xac_nhan_id`),
  CONSTRAINT `fk_dat_ban_khach_hang` FOREIGN KEY (`khach_hang_id`) REFERENCES `khach_hang` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_dat_ban_khu_vuc` FOREIGN KEY (`khu_vuc_id`) REFERENCES `khu_vuc` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_dat_ban_nguoi_xac_nhan` FOREIGN KEY (`nguoi_xac_nhan_id`) REFERENCES `nhan_vien` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `ck_dat_ban_kieu_xep` CHECK ((`kieu_xep_ban` in (_utf8mb4'KHACH_CHON_BAN',_utf8mb4'HE_THONG_SAP_XEP',_utf8mb4'NHAN_VIEN_SAP_XEP'))),
  CONSTRAINT `ck_dat_ban_nguon` CHECK ((`nguon_dat` in (_utf8mb4'WEBSITE',_utf8mb4'DIEN_THOAI',_utf8mb4'FACEBOOK',_utf8mb4'TRUC_TIEP',_utf8mb4'KHAC'))),
  CONSTRAINT `ck_dat_ban_so_nguoi` CHECK ((`so_nguoi` >= 1)),
  CONSTRAINT `ck_dat_ban_thoi_gian` CHECK ((`gio_ket_thuc` > `gio_bat_dau`)),
  CONSTRAINT `ck_dat_ban_trang_thai` CHECK ((`trang_thai` in (_utf8mb4'CHO_XAC_NHAN',_utf8mb4'DA_XAC_NHAN',_utf8mb4'DA_CHECK_IN',_utf8mb4'DA_HOAN_THANH',_utf8mb4'DA_HUY',_utf8mb4'KHONG_DEN')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `gio_hoat_dong`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gio_hoat_dong` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `thu_trong_tuan` tinyint unsigned NOT NULL COMMENT '1=Thứ Hai ... 7=Chủ Nhật',
  `ca_so` tinyint unsigned NOT NULL DEFAULT '1' COMMENT 'Cho phép nhiều ca trong cùng một ngày',
  `gio_mo_cua` time NOT NULL,
  `gio_dong_cua` time NOT NULL,
  `hoat_dong` tinyint(1) NOT NULL DEFAULT '1',
  `ghi_chu` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ngay_cap_nhat` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_gio_hoat_dong_thu_ca` (`thu_trong_tuan`,`ca_so`),
  KEY `idx_gio_hoat_dong_thu` (`thu_trong_tuan`,`hoat_dong`),
  CONSTRAINT `ck_gio_hoat_dong_ca` CHECK ((`ca_so` >= 1)),
  CONSTRAINT `ck_gio_hoat_dong_gio` CHECK ((`gio_dong_cua` > `gio_mo_cua`)),
  CONSTRAINT `ck_gio_hoat_dong_thu` CHECK ((`thu_trong_tuan` between 1 and 7))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `hinh_anh_mon`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hinh_anh_mon` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `mon_an_id` bigint unsigned NOT NULL,
  `duong_dan_anh` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `alt_text` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `thu_tu` int NOT NULL DEFAULT '0',
  `la_anh_chinh` tinyint(1) NOT NULL DEFAULT '0',
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_hinh_anh_mon` (`mon_an_id`,`thu_tu`),
  CONSTRAINT `fk_hinh_anh_mon` FOREIGN KEY (`mon_an_id`) REFERENCES `mon_an` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `khach_hang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `khach_hang` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tai_khoan_id` bigint unsigned DEFAULT NULL,
  `ma_khach_hang` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ho_ten` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `so_dien_thoai` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngay_sinh` date DEFAULT NULL,
  `gioi_tinh` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ghi_chu` text COLLATE utf8mb4_unicode_ci,
  `trang_thai` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'HOAT_DONG',
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ngay_cap_nhat` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `ngay_xoa` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_khach_hang_sdt` (`so_dien_thoai`),
  UNIQUE KEY `uk_khach_hang_tai_khoan` (`tai_khoan_id`),
  UNIQUE KEY `uk_khach_hang_ma` (`ma_khach_hang`),
  KEY `idx_khach_hang_ho_ten` (`ho_ten`),
  KEY `idx_khach_hang_email` (`email`),
  KEY `idx_khach_hang_trang_thai` (`trang_thai`),
  CONSTRAINT `fk_khach_hang_tai_khoan` FOREIGN KEY (`tai_khoan_id`) REFERENCES `tai_khoan` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `ck_khach_hang_gioi_tinh` CHECK (((`gioi_tinh` is null) or (`gioi_tinh` in (_utf8mb4'NAM',_utf8mb4'NU',_utf8mb4'KHAC')))),
  CONSTRAINT `ck_khach_hang_trang_thai` CHECK ((`trang_thai` in (_utf8mb4'HOAT_DONG',_utf8mb4'BI_KHOA',_utf8mb4'NGUNG_HOAT_DONG')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `khu_vuc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `khu_vuc` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ma_khu_vuc` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ten_khu_vuc` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mo_ta` text COLLATE utf8mb4_unicode_ci,
  `hinh_anh` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `thu_tu` int NOT NULL DEFAULT '0',
  `trang_thai` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'HOAT_DONG',
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ngay_cap_nhat` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `ngay_xoa` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_khu_vuc_ma` (`ma_khu_vuc`),
  KEY `idx_khu_vuc_thu_tu` (`thu_tu`),
  KEY `idx_khu_vuc_trang_thai` (`trang_thai`),
  CONSTRAINT `ck_khu_vuc_trang_thai` CHECK ((`trang_thai` in (_utf8mb4'HOAT_DONG',_utf8mb4'NGUNG_HOAT_DONG')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `khuyen_mai`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `khuyen_mai` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ma_khuyen_mai` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ten_khuyen_mai` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mo_ta` text COLLATE utf8mb4_unicode_ci,
  `loai_giam` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `gia_tri` decimal(15,2) NOT NULL,
  `gia_tri_don_toi_thieu` decimal(15,2) DEFAULT NULL,
  `giam_toi_da` decimal(15,2) DEFAULT NULL,
  `ngay_bat_dau` datetime(3) NOT NULL,
  `ngay_ket_thuc` datetime(3) NOT NULL,
  `so_luot_toi_da` int unsigned DEFAULT NULL,
  `so_luot_da_dung` int unsigned NOT NULL DEFAULT '0',
  `trang_thai` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'HOAT_DONG',
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ngay_cap_nhat` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `ngay_xoa` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_khuyen_mai_ma` (`ma_khuyen_mai`),
  KEY `idx_khuyen_mai_thoi_gian` (`ngay_bat_dau`,`ngay_ket_thuc`),
  KEY `idx_khuyen_mai_trang_thai` (`trang_thai`),
  CONSTRAINT `ck_khuyen_mai_gia_tri` CHECK ((((`loai_giam` = _utf8mb4'PHAN_TRAM') and (`gia_tri` > 0) and (`gia_tri` <= 100)) or ((`loai_giam` = _utf8mb4'SO_TIEN') and (`gia_tri` > 0)))),
  CONSTRAINT `ck_khuyen_mai_loai_giam` CHECK ((`loai_giam` in (_utf8mb4'PHAN_TRAM',_utf8mb4'SO_TIEN'))),
  CONSTRAINT `ck_khuyen_mai_thoi_gian` CHECK ((`ngay_ket_thuc` > `ngay_bat_dau`)),
  CONSTRAINT `ck_khuyen_mai_trang_thai` CHECK ((`trang_thai` in (_utf8mb4'HOAT_DONG',_utf8mb4'NGUNG_HOAT_DONG')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `lich_su_dat_ban`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lich_su_dat_ban` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `dat_ban_id` bigint unsigned NOT NULL,
  `trang_thai_cu` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trang_thai_moi` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nguoi_thuc_hien_id` bigint unsigned DEFAULT NULL COMMENT 'Tài khoản thực hiện; NULL nếu hệ thống tự động',
  `hanh_dong` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ghi_chu` text COLLATE utf8mb4_unicode_ci,
  `thoi_gian` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_lich_su_dat_ban` (`dat_ban_id`,`thoi_gian`),
  KEY `idx_lich_su_nguoi_thuc_hien` (`nguoi_thuc_hien_id`),
  CONSTRAINT `fk_lich_su_dat_ban` FOREIGN KEY (`dat_ban_id`) REFERENCES `dat_ban` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_lich_su_nguoi_thuc_hien` FOREIGN KEY (`nguoi_thuc_hien_id`) REFERENCES `tai_khoan` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `ck_lich_su_trang_thai_cu` CHECK (((`trang_thai_cu` is null) or (`trang_thai_cu` in (_utf8mb4'CHO_XAC_NHAN',_utf8mb4'DA_XAC_NHAN',_utf8mb4'DA_CHECK_IN',_utf8mb4'DA_HOAN_THANH',_utf8mb4'DA_HUY',_utf8mb4'KHONG_DEN')))),
  CONSTRAINT `ck_lich_su_trang_thai_moi` CHECK ((`trang_thai_moi` in (_utf8mb4'CHO_XAC_NHAN',_utf8mb4'DA_XAC_NHAN',_utf8mb4'DA_CHECK_IN',_utf8mb4'DA_HOAN_THANH',_utf8mb4'DA_HUY',_utf8mb4'KHONG_DEN')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `lien_ket_ban`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lien_ket_ban` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ban_1_id` bigint unsigned NOT NULL,
  `ban_2_id` bigint unsigned NOT NULL,
  `co_the_ghep` tinyint(1) NOT NULL DEFAULT '1',
  `ghi_chu` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ngay_cap_nhat` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_lien_ket_ban_cap` (`ban_1_id`,`ban_2_id`),
  KEY `idx_lien_ket_ban_2` (`ban_2_id`),
  CONSTRAINT `fk_lien_ket_ban_1` FOREIGN KEY (`ban_1_id`) REFERENCES `ban_an` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_lien_ket_ban_2` FOREIGN KEY (`ban_2_id`) REFERENCES `ban_an` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `mon_an`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mon_an` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ma_mon` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `danh_muc_id` bigint unsigned NOT NULL,
  `ten_mon` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `duong_dan` varchar(220) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mo_ta` text COLLATE utf8mb4_unicode_ci,
  `gia` decimal(15,2) NOT NULL,
  `gia_khuyen_mai` decimal(15,2) DEFAULT NULL,
  `hinh_anh_chinh` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `la_mon_noi_bat` tinyint(1) NOT NULL DEFAULT '0',
  `con_mon` tinyint(1) NOT NULL DEFAULT '1',
  `trang_thai` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'HOAT_DONG',
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ngay_cap_nhat` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `ngay_xoa` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_mon_an_ma` (`ma_mon`),
  UNIQUE KEY `uk_mon_an_duong_dan` (`duong_dan`),
  KEY `idx_mon_an_danh_muc` (`danh_muc_id`),
  KEY `idx_mon_an_ten` (`ten_mon`),
  KEY `idx_mon_an_con_mon` (`con_mon`),
  KEY `idx_mon_an_noi_bat` (`la_mon_noi_bat`),
  KEY `idx_mon_an_trang_thai` (`trang_thai`),
  KEY `idx_mon_an_danh_muc_trang_thai` (`danh_muc_id`,`trang_thai`,`con_mon`),
  CONSTRAINT `fk_mon_an_danh_muc` FOREIGN KEY (`danh_muc_id`) REFERENCES `danh_muc_mon` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ck_mon_an_gia` CHECK ((`gia` >= 0)),
  CONSTRAINT `ck_mon_an_gia_khuyen_mai` CHECK (((`gia_khuyen_mai` is null) or ((`gia_khuyen_mai` >= 0) and (`gia_khuyen_mai` <= `gia`)))),
  CONSTRAINT `ck_mon_an_trang_thai` CHECK ((`trang_thai` in (_utf8mb4'HOAT_DONG',_utf8mb4'NGUNG_HOAT_DONG')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `ngay_nghi_dac_biet`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ngay_nghi_dac_biet` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ngay` date NOT NULL,
  `ten_su_kien` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dong_cua_ca_ngay` tinyint(1) NOT NULL DEFAULT '1',
  `gio_mo_cua` time DEFAULT NULL,
  `gio_dong_cua` time DEFAULT NULL,
  `ghi_chu` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ngay_cap_nhat` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ngay_nghi_dac_biet_ngay` (`ngay`),
  KEY `idx_ngay_nghi_dac_biet_ngay` (`ngay`),
  CONSTRAINT `ck_ngay_nghi_dac_biet_gio` CHECK (((`dong_cua_ca_ngay` = 1) or ((`gio_mo_cua` is not null) and (`gio_dong_cua` is not null) and (`gio_dong_cua` > `gio_mo_cua`))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `nhan_vien`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nhan_vien` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tai_khoan_id` bigint unsigned NOT NULL,
  `ma_nhan_vien` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ho_ten` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `so_dien_thoai` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngay_vao_lam` date DEFAULT NULL,
  `ghi_chu` text COLLATE utf8mb4_unicode_ci,
  `trang_thai` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'HOAT_DONG',
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ngay_cap_nhat` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `ngay_xoa` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_nhan_vien_tai_khoan` (`tai_khoan_id`),
  UNIQUE KEY `uk_nhan_vien_ma` (`ma_nhan_vien`),
  KEY `idx_nhan_vien_ho_ten` (`ho_ten`),
  KEY `idx_nhan_vien_sdt` (`so_dien_thoai`),
  KEY `idx_nhan_vien_trang_thai` (`trang_thai`),
  CONSTRAINT `fk_nhan_vien_tai_khoan` FOREIGN KEY (`tai_khoan_id`) REFERENCES `tai_khoan` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ck_nhan_vien_trang_thai` CHECK ((`trang_thai` in (_utf8mb4'HOAT_DONG',_utf8mb4'TAM_NGHI',_utf8mb4'DA_NGHI')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `nhat_ky_hoat_dong`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nhat_ky_hoat_dong` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tai_khoan_id` bigint unsigned DEFAULT NULL,
  `hanh_dong` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `doi_tuong` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `doi_tuong_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `du_lieu_cu` json DEFAULT NULL,
  `du_lieu_moi` json DEFAULT NULL,
  `dia_chi_ip` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ma_yeu_cau` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Request ID / correlation ID',
  `thoi_gian` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_nhat_ky_tai_khoan` (`tai_khoan_id`,`thoi_gian`),
  KEY `idx_nhat_ky_doi_tuong` (`doi_tuong`,`doi_tuong_id`),
  KEY `idx_nhat_ky_hanh_dong` (`hanh_dong`),
  KEY `idx_nhat_ky_thoi_gian` (`thoi_gian`),
  CONSTRAINT `fk_nhat_ky_tai_khoan` FOREIGN KEY (`tai_khoan_id`) REFERENCES `tai_khoan` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `quyen`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quyen` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ma_quyen` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ten_quyen` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nhom_quyen` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mo_ta` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ngay_cap_nhat` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_quyen_ma` (`ma_quyen`),
  KEY `idx_quyen_nhom` (`nhom_quyen`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `tai_khoan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tai_khoan` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ten_dang_nhap` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mat_khau` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Chỉ lưu password hash (bcrypt/argon2), không lưu mật khẩu thô',
  `vai_tro_id` bigint unsigned NOT NULL,
  `refresh_token_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trang_thai` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'HOAT_DONG',
  `bat_buoc_doi_mat_khau` tinyint(1) NOT NULL DEFAULT '0',
  `so_lan_dang_nhap_sai` int unsigned NOT NULL DEFAULT '0',
  `khoa_den` datetime(3) DEFAULT NULL,
  `lan_dang_nhap_cuoi` datetime(3) DEFAULT NULL,
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ngay_cap_nhat` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `ngay_xoa` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tai_khoan_email` (`email`),
  UNIQUE KEY `uk_tai_khoan_ten_dang_nhap` (`ten_dang_nhap`),
  KEY `idx_tai_khoan_vai_tro` (`vai_tro_id`),
  KEY `idx_tai_khoan_trang_thai` (`trang_thai`),
  CONSTRAINT `fk_tai_khoan_vai_tro` FOREIGN KEY (`vai_tro_id`) REFERENCES `vai_tro` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ck_tai_khoan_trang_thai` CHECK ((`trang_thai` in (_utf8mb4'HOAT_DONG',_utf8mb4'BI_KHOA',_utf8mb4'NGUNG_HOAT_DONG')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `thong_bao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `thong_bao` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tai_khoan_id` bigint unsigned DEFAULT NULL,
  `dat_ban_id` bigint unsigned DEFAULT NULL,
  `loai_thong_bao` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tieu_de` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `noi_dung` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `duong_dan` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `da_doc` tinyint(1) NOT NULL DEFAULT '0',
  `thoi_gian_doc` datetime(3) DEFAULT NULL,
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_thong_bao_tai_khoan` (`tai_khoan_id`,`da_doc`,`ngay_tao`),
  KEY `idx_thong_bao_dat_ban` (`dat_ban_id`),
  KEY `idx_thong_bao_loai` (`loai_thong_bao`),
  CONSTRAINT `fk_thong_bao_dat_ban` FOREIGN KEY (`dat_ban_id`) REFERENCES `dat_ban` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_thong_bao_tai_khoan` FOREIGN KEY (`tai_khoan_id`) REFERENCES `tai_khoan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `token_dat_lai_mat_khau`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `token_dat_lai_mat_khau` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tai_khoan_id` bigint unsigned NOT NULL,
  `token_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `het_han_luc` datetime(3) NOT NULL,
  `da_su_dung` tinyint(1) NOT NULL DEFAULT '0',
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ngay_su_dung` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_token_dat_lai_hash` (`token_hash`),
  KEY `idx_token_dat_lai_tai_khoan` (`tai_khoan_id`),
  KEY `idx_token_dat_lai_het_han` (`het_han_luc`),
  CONSTRAINT `fk_token_dat_lai_tai_khoan` FOREIGN KEY (`tai_khoan_id`) REFERENCES `tai_khoan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `v_dat_ban_tong_quan`;
/*!50001 DROP VIEW IF EXISTS `v_dat_ban_tong_quan`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_dat_ban_tong_quan` AS SELECT 
 1 AS `id`,
 1 AS `ma_dat_ban`,
 1 AS `khach_hang_id`,
 1 AS `ho_ten`,
 1 AS `so_dien_thoai`,
 1 AS `email`,
 1 AS `ngay_dat`,
 1 AS `gio_bat_dau`,
 1 AS `gio_ket_thuc`,
 1 AS `so_nguoi`,
 1 AS `trang_thai`,
 1 AS `nguon_dat`,
 1 AS `khu_vuc_id`,
 1 AS `ten_khu_vuc`,
 1 AS `danh_sach_ma_ban`,
 1 AS `danh_sach_ten_ban`,
 1 AS `so_ban`,
 1 AS `ngay_tao`,
 1 AS `ngay_cap_nhat`*/;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `v_thong_ke_khach_hang`;
/*!50001 DROP VIEW IF EXISTS `v_thong_ke_khach_hang`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_thong_ke_khach_hang` AS SELECT 
 1 AS `id`,
 1 AS `ma_khach_hang`,
 1 AS `ho_ten`,
 1 AS `so_dien_thoai`,
 1 AS `email`,
 1 AS `tong_dat_ban`,
 1 AS `tong_hoan_thanh`,
 1 AS `tong_huy`,
 1 AS `tong_khong_den`,
 1 AS `lan_dat_gan_nhat`*/;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `vai_tro`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vai_tro` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ma_vai_tro` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ten_vai_tro` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mo_ta` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `la_he_thong` tinyint(1) NOT NULL DEFAULT '0',
  `trang_thai` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'HOAT_DONG',
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ngay_cap_nhat` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_vai_tro_ma` (`ma_vai_tro`),
  KEY `idx_vai_tro_trang_thai` (`trang_thai`),
  CONSTRAINT `ck_vai_tro_trang_thai` CHECK ((`trang_thai` in (_utf8mb4'HOAT_DONG',_utf8mb4'NGUNG_HOAT_DONG')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `vai_tro_quyen`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vai_tro_quyen` (
  `vai_tro_id` bigint unsigned NOT NULL,
  `quyen_id` bigint unsigned NOT NULL,
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`vai_tro_id`,`quyen_id`),
  KEY `idx_vtq_quyen` (`quyen_id`),
  CONSTRAINT `fk_vtq_quyen` FOREIGN KEY (`quyen_id`) REFERENCES `quyen` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_vtq_vai_tro` FOREIGN KEY (`vai_tro_id`) REFERENCES `vai_tro` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50001 DROP VIEW IF EXISTS `v_dat_ban_tong_quan`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=CURRENT_USER SQL SECURITY DEFINER */
/*!50001 VIEW `v_dat_ban_tong_quan` AS select `db`.`id` AS `id`,`db`.`ma_dat_ban` AS `ma_dat_ban`,`db`.`khach_hang_id` AS `khach_hang_id`,`db`.`ho_ten` AS `ho_ten`,`db`.`so_dien_thoai` AS `so_dien_thoai`,`db`.`email` AS `email`,`db`.`ngay_dat` AS `ngay_dat`,`db`.`gio_bat_dau` AS `gio_bat_dau`,`db`.`gio_ket_thuc` AS `gio_ket_thuc`,`db`.`so_nguoi` AS `so_nguoi`,`db`.`trang_thai` AS `trang_thai`,`db`.`nguon_dat` AS `nguon_dat`,`kv`.`id` AS `khu_vuc_id`,`kv`.`ten_khu_vuc` AS `ten_khu_vuc`,group_concat(`ba`.`ma_ban` order by `ba`.`ma_ban` ASC separator ', ') AS `danh_sach_ma_ban`,group_concat(`ba`.`ten_ban` order by `ba`.`ma_ban` ASC separator ', ') AS `danh_sach_ten_ban`,count(`ba`.`id`) AS `so_ban`,`db`.`ngay_tao` AS `ngay_tao`,`db`.`ngay_cap_nhat` AS `ngay_cap_nhat` from (((`dat_ban` `db` left join `khu_vuc` `kv` on((`kv`.`id` = `db`.`khu_vuc_id`))) left join `chi_tiet_dat_ban` `ctdb` on((`ctdb`.`dat_ban_id` = `db`.`id`))) left join `ban_an` `ba` on((`ba`.`id` = `ctdb`.`ban_an_id`))) group by `db`.`id`,`db`.`ma_dat_ban`,`db`.`khach_hang_id`,`db`.`ho_ten`,`db`.`so_dien_thoai`,`db`.`email`,`db`.`ngay_dat`,`db`.`gio_bat_dau`,`db`.`gio_ket_thuc`,`db`.`so_nguoi`,`db`.`trang_thai`,`db`.`nguon_dat`,`kv`.`id`,`kv`.`ten_khu_vuc`,`db`.`ngay_tao`,`db`.`ngay_cap_nhat` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `v_thong_ke_khach_hang`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=CURRENT_USER SQL SECURITY DEFINER */
/*!50001 VIEW `v_thong_ke_khach_hang` AS select `kh`.`id` AS `id`,`kh`.`ma_khach_hang` AS `ma_khach_hang`,`kh`.`ho_ten` AS `ho_ten`,`kh`.`so_dien_thoai` AS `so_dien_thoai`,`kh`.`email` AS `email`,count(`db`.`id`) AS `tong_dat_ban`,sum((case when (`db`.`trang_thai` = 'DA_HOAN_THANH') then 1 else 0 end)) AS `tong_hoan_thanh`,sum((case when (`db`.`trang_thai` = 'DA_HUY') then 1 else 0 end)) AS `tong_huy`,sum((case when (`db`.`trang_thai` = 'KHONG_DEN') then 1 else 0 end)) AS `tong_khong_den`,max(`db`.`gio_bat_dau`) AS `lan_dat_gan_nhat` from (`khach_hang` `kh` left join `dat_ban` `db` on((`db`.`khach_hang_id` = `kh`.`id`))) where (`kh`.`ngay_xoa` is null) group by `kh`.`id`,`kh`.`ma_khach_hang`,`kh`.`ho_ten`,`kh`.`so_dien_thoai`,`kh`.`email` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

