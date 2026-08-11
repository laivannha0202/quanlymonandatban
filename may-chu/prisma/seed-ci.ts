import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client';

const XAC_NHAN = 'SEED_CI_CONFIRM';

function taoPrisma(): PrismaClient {
  if (process.env[XAC_NHAN] !== 'YES') {
    throw new Error(
      `Chỉ được chạy seed CI khi ${XAC_NHAN}=YES.`,
    );
  }

  const databaseUrl = process.env.DATABASE_URL || '';
  const diaChi = new URL(databaseUrl);
  const database = diaChi.pathname.replace(/^\//, '');

  if (!/_ci(?:_|$)/i.test(database) && !/ci$/i.test(database)) {
    throw new Error(
      `Từ chối seed CI vào database không có hậu tố/phần tên "_ci": ${database}`,
    );
  }

  const adapter = new PrismaMariaDb({
    host: diaChi.hostname,
    port: Number(diaChi.port || 3306),
    user: decodeURIComponent(diaChi.username),
    password: decodeURIComponent(diaChi.password),
    database,
    connectionLimit: 2,
    allowPublicKeyRetrieval: true,
  });

  return new PrismaClient({ adapter });
}

const quyen = [
  ['DASHBOARD_XEM', 'DASHBOARD'],
  ['DAT_BAN_XEM', 'DAT_BAN'],
  ['DAT_BAN_TAO', 'DAT_BAN'],
  ['DAT_BAN_SUA', 'DAT_BAN'],
  ['DAT_BAN_XAC_NHAN', 'DAT_BAN'],
  ['DAT_BAN_SAP_BAN', 'DAT_BAN'],
  ['DAT_BAN_CHECK_IN', 'DAT_BAN'],
  ['DAT_BAN_HOAN_THANH', 'DAT_BAN'],
  ['DAT_BAN_HUY', 'DAT_BAN'],
  ['DAT_BAN_KHONG_DEN', 'DAT_BAN'],
  ['KHU_VUC_XEM', 'KHU_VUC'],
  ['KHU_VUC_QUAN_LY', 'KHU_VUC'],
  ['BAN_AN_XEM', 'BAN_AN'],
  ['BAN_AN_QUAN_LY', 'BAN_AN'],
  ['DANH_MUC_MON_XEM', 'THUC_DON'],
  ['DANH_MUC_MON_QUAN_LY', 'THUC_DON'],
  ['MON_AN_XEM', 'THUC_DON'],
  ['MON_AN_QUAN_LY', 'THUC_DON'],
  ['KHACH_HANG_XEM', 'KHACH_HANG'],
  ['KHACH_HANG_SUA', 'KHACH_HANG'],
  ['KHACH_HANG_KHOA', 'KHACH_HANG'],
  ['NHAN_VIEN_XEM', 'NHAN_VIEN'],
  ['NHAN_VIEN_QUAN_LY', 'NHAN_VIEN'],
  ['KHUYEN_MAI_XEM', 'KHUYEN_MAI'],
  ['KHUYEN_MAI_QUAN_LY', 'KHUYEN_MAI'],
  ['DANH_GIA_XEM', 'DANH_GIA'],
  ['DANH_GIA_QUAN_LY', 'DANH_GIA'],
  ['BAO_CAO_XEM', 'BAO_CAO'],
  ['TAI_KHOAN_QUAN_LY', 'HE_THONG'],
  ['VAI_TRO_QUAN_LY', 'HE_THONG'],
  ['NHAT_KY_XEM', 'HE_THONG'],
  ['CAU_HINH_QUAN_LY', 'HE_THONG'],
] as const;

const quyenNhanVien = new Set([
  'BAN_AN_XEM',
  'DANH_GIA_XEM',
  'DANH_MUC_MON_XEM',
  'DASHBOARD_XEM',
  'DAT_BAN_CHECK_IN',
  'DAT_BAN_HOAN_THANH',
  'DAT_BAN_HUY',
  'DAT_BAN_KHONG_DEN',
  'DAT_BAN_SAP_BAN',
  'DAT_BAN_SUA',
  'DAT_BAN_TAO',
  'DAT_BAN_XAC_NHAN',
  'DAT_BAN_XEM',
  'KHACH_HANG_SUA',
  'KHACH_HANG_XEM',
  'KHU_VUC_XEM',
  'MON_AN_XEM',
]);

const cauHinh = [
  ['TEN_NHA_HANG', 'Nhà hàng CI', 'CHUOI', 'THONG_TIN_NHA_HANG'],
  ['DIA_CHI_NHA_HANG', 'Môi trường kiểm thử CI', 'CHUOI', 'THONG_TIN_NHA_HANG'],
  ['SO_DIEN_THOAI_NHA_HANG', '0900000000', 'CHUOI', 'THONG_TIN_NHA_HANG'],
  ['EMAIL_NHA_HANG', 'ci@example.local', 'CHUOI', 'THONG_TIN_NHA_HANG'],
  ['CHO_PHEP_DAT_BAN', 'true', 'BOOLEAN', 'DAT_BAN'],
  ['THOI_LUONG_DAT_BAN_PHUT', '120', 'SO', 'DAT_BAN'],
  ['DAT_TRUOC_TOI_THIEU_PHUT', '30', 'SO', 'DAT_BAN'],
  ['DAT_TRUOC_TOI_DA_NGAY', '30', 'SO', 'DAT_BAN'],
  ['THOI_GIAN_CHO_KHACH_PHUT', '15', 'SO', 'DAT_BAN'],
  ['THOI_GIAN_HUY_TRUOC_PHUT', '60', 'SO', 'DAT_BAN'],
  ['SO_NGUOI_TOI_DA_MOI_DAT_BAN', '20', 'SO', 'DAT_BAN'],
  ['CHO_PHEP_KHACH_CHON_BAN', 'true', 'BOOLEAN', 'DAT_BAN'],
  ['KHOANG_CACH_SLOT_PHUT', '30', 'SO', 'DAT_BAN'],
  ['CHECK_IN_SOM_TOI_DA_PHUT', '30', 'SO', 'DAT_BAN'],
] as const;

async function main(): Promise<void> {
  const prisma = taoPrisma();

  try {
    const vaiTroData = [
      ['QUAN_TRI_VIEN', 'Quản trị viên CI'],
      ['NHAN_VIEN', 'Nhân viên CI'],
      ['KHACH_HANG', 'Khách hàng CI'],
    ] as const;

    const vaiTroIds = new Map<string, bigint>();

    for (const [maVaiTro, tenVaiTro] of vaiTroData) {
      const vaiTro = await prisma.vai_tro.upsert({
        where: { ma_vai_tro: maVaiTro },
        create: {
          ma_vai_tro: maVaiTro,
          ten_vai_tro: tenVaiTro,
          la_he_thong: true,
          trang_thai: 'HOAT_DONG',
        },
        update: {
          ten_vai_tro: tenVaiTro,
          la_he_thong: true,
          trang_thai: 'HOAT_DONG',
        },
      });

      vaiTroIds.set(maVaiTro, vaiTro.id);
    }

    const quyenIds = new Map<string, bigint>();

    for (const [maQuyen, nhomQuyen] of quyen) {
      const banGhi = await prisma.quyen.upsert({
        where: { ma_quyen: maQuyen },
        create: {
          ma_quyen: maQuyen,
          ten_quyen: maQuyen,
          nhom_quyen: nhomQuyen,
          mo_ta: 'Quyền fixture dành cho CI',
        },
        update: {
          ten_quyen: maQuyen,
          nhom_quyen: nhomQuyen,
          mo_ta: 'Quyền fixture dành cho CI',
        },
      });

      quyenIds.set(maQuyen, banGhi.id);
    }

    const adminId = vaiTroIds.get('QUAN_TRI_VIEN')!;
    const nhanVienId = vaiTroIds.get('NHAN_VIEN')!;

    for (const [maQuyen] of quyen) {
      const quyenId = quyenIds.get(maQuyen)!;

      await prisma.vai_tro_quyen.upsert({
        where: {
          vai_tro_id_quyen_id: {
            vai_tro_id: adminId,
            quyen_id: quyenId,
          },
        },
        create: {
          vai_tro_id: adminId,
          quyen_id: quyenId,
        },
        update: {},
      });

      if (quyenNhanVien.has(maQuyen)) {
        await prisma.vai_tro_quyen.upsert({
          where: {
            vai_tro_id_quyen_id: {
              vai_tro_id: nhanVienId,
              quyen_id: quyenId,
            },
          },
          create: {
            vai_tro_id: nhanVienId,
            quyen_id: quyenId,
          },
          update: {},
        });
      }
    }

    for (const [khoa, giaTri, kieuDuLieu, nhom] of cauHinh) {
      await prisma.cau_hinh.upsert({
        where: { khoa },
        create: {
          khoa,
          gia_tri: giaTri,
          kieu_du_lieu: kieuDuLieu,
          nhom,
          mo_ta: 'Giá trị fixture dành cho CI',
          cho_phep_sua: true,
        },
        update: {
          gia_tri: giaTri,
          kieu_du_lieu: kieuDuLieu,
          nhom,
          mo_ta: 'Giá trị fixture dành cho CI',
          cho_phep_sua: true,
        },
      });
    }

    const gioMo = new Date('1970-01-01T10:00:00.000Z');
    const gioDong = new Date('1970-01-01T22:00:00.000Z');

    for (let thu = 1; thu <= 7; thu += 1) {
      await prisma.gio_hoat_dong.upsert({
        where: {
          thu_trong_tuan_ca_so: {
            thu_trong_tuan: thu,
            ca_so: 1,
          },
        },
        create: {
          thu_trong_tuan: thu,
          ca_so: 1,
          gio_mo_cua: gioMo,
          gio_dong_cua: gioDong,
          hoat_dong: true,
          ghi_chu: 'Ca CI',
        },
        update: {
          gio_mo_cua: gioMo,
          gio_dong_cua: gioDong,
          hoat_dong: true,
          ghi_chu: 'Ca CI',
        },
      });
    }

    const khuVuc = await prisma.khu_vuc.upsert({
      where: { ma_khu_vuc: 'CI_KHU_VUC' },
      create: {
        ma_khu_vuc: 'CI_KHU_VUC',
        ten_khu_vuc: 'Khu vực CI',
        mo_ta: 'Fixture kiểm thử tự động',
        thu_tu: 1,
        trang_thai: 'HOAT_DONG',
      },
      update: {
        ten_khu_vuc: 'Khu vực CI',
        mo_ta: 'Fixture kiểm thử tự động',
        thu_tu: 1,
        trang_thai: 'HOAT_DONG',
        ngay_xoa: null,
      },
    });

    for (const [maBan, tenBan] of [
      ['CI_BAN_01', 'Bàn CI 01'],
      ['CI_BAN_02', 'Bàn CI 02'],
    ] as const) {
      await prisma.ban_an.upsert({
        where: { ma_ban: maBan },
        create: {
          ma_ban: maBan,
          ten_ban: tenBan,
          khu_vuc_id: khuVuc.id,
          suc_chua: 2,
          suc_chua_toi_da: 4,
          trang_thai: 'TRONG',
          ghi_chu: 'Fixture kiểm thử tự động',
        },
        update: {
          ten_ban: tenBan,
          khu_vuc_id: khuVuc.id,
          suc_chua: 2,
          suc_chua_toi_da: 4,
          trang_thai: 'TRONG',
          ghi_chu: 'Fixture kiểm thử tự động',
          ngay_xoa: null,
        },
      });
    }

    const danhMuc = await prisma.danh_muc_mon.upsert({
      where: { ma_danh_muc: 'CI_DANH_MUC' },
      create: {
        ma_danh_muc: 'CI_DANH_MUC',
        ten_danh_muc: 'Danh mục CI',
        duong_dan: 'ci-danh-muc',
        mo_ta: 'Fixture kiểm thử tự động',
        thu_tu: 1,
        trang_thai: 'HOAT_DONG',
      },
      update: {
        ten_danh_muc: 'Danh mục CI',
        duong_dan: 'ci-danh-muc',
        mo_ta: 'Fixture kiểm thử tự động',
        thu_tu: 1,
        trang_thai: 'HOAT_DONG',
        ngay_xoa: null,
      },
    });

    const monAn = [
      ['CI_MON_01', 'Món CI 01', 'ci-mon-01', 50000],
      ['CI_MON_02', 'Món CI 02', 'ci-mon-02', 60000],
    ] as const;

    for (const [maMon, tenMon, duongDan, gia] of monAn) {
      await prisma.mon_an.upsert({
        where: { ma_mon: maMon },
        create: {
          ma_mon: maMon,
          danh_muc_id: danhMuc.id,
          ten_mon: tenMon,
          duong_dan: duongDan,
          mo_ta: 'Fixture kiểm thử tự động',
          gia,
          la_mon_noi_bat: true,
          con_mon: true,
          trang_thai: 'HOAT_DONG',
        },
        update: {
          danh_muc_id: danhMuc.id,
          ten_mon: tenMon,
          duong_dan: duongDan,
          mo_ta: 'Fixture kiểm thử tự động',
          gia,
          la_mon_noi_bat: true,
          con_mon: true,
          trang_thai: 'HOAT_DONG',
          ngay_xoa: null,
        },
      });
    }

    console.log('SEED_CI_REFERENCE_OK');
  } finally {
    await prisma.$disconnect();
  }
}

void main();
