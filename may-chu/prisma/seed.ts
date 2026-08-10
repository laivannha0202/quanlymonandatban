import 'dotenv/config';
import * as argon2 from 'argon2';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client';

function taoPrisma(): PrismaClient {
  const diaChi = new URL(process.env.DATABASE_URL || '');
  const adapter = new PrismaMariaDb({
    host: diaChi.hostname,
    port: Number(diaChi.port || 3306),
    user: decodeURIComponent(diaChi.username),
    password: decodeURIComponent(diaChi.password),
    database: diaChi.pathname.replace(/^\//, ''),
    connectionLimit: 2,
    allowPublicKeyRetrieval: true,
  });

  return new PrismaClient({ adapter });
}

async function main(): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL?.trim();
  const matKhau = process.env.SEED_ADMIN_PASSWORD;
  const hoTen = process.env.SEED_ADMIN_HO_TEN?.trim() || 'Quản trị viên';

  if (!email || !matKhau) {
    throw new Error('Thiếu SEED_ADMIN_EMAIL hoặc SEED_ADMIN_PASSWORD trong .env');
  }

  const prisma = taoPrisma();

  try {
    const vaiTro = await prisma.vai_tro.findUnique({
      where: { ma_vai_tro: 'QUAN_TRI_VIEN' },
    });

    if (!vaiTro) {
      throw new Error('Không tìm thấy role QUAN_TRI_VIEN. Hãy import SQL trước.');
    }

    const matKhauHash = await argon2.hash(matKhau);

    const taiKhoan = await prisma.tai_khoan.upsert({
      where: { email },
      create: {
        ten_dang_nhap: email,
        email,
        mat_khau: matKhauHash,
        vai_tro_id: vaiTro.id,
        trang_thai: 'HOAT_DONG',
      },
      update: {
        vai_tro_id: vaiTro.id,
        trang_thai: 'HOAT_DONG',
      },
    });

    const nhanVien = await prisma.nhan_vien.findUnique({
      where: { tai_khoan_id: taiKhoan.id },
    });

    if (!nhanVien) {
      await prisma.nhan_vien.create({
        data: {
          tai_khoan_id: taiKhoan.id,
          ma_nhan_vien: `ADMIN_${taiKhoan.id.toString()}`,
          ho_ten: hoTen,
          email,
          trang_thai: 'HOAT_DONG',
        },
      });
    }

    console.log(`Đã bảo đảm tài khoản Admin: ${email}`);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
