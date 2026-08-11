import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../../co-so-du-lieu/prisma.service';
import { LoiNghiepVuException } from '../../dung-chung/exception/loi-nghiep-vu.exception';
import type { NguoiDungXacThuc } from '../../dung-chung/types/nguoi-dung-xac-thuc.type';
import { DangNhapDto } from './dto/dang-nhap.dto';
import { DangKyDto } from './dto/dang-ky.dto';
import { DatLaiMatKhauDto } from './dto/dat-lai-mat-khau.dto';
import { DoiMatKhauDto } from './dto/doi-mat-khau.dto';
import { QuenMatKhauDto } from './dto/quen-mat-khau.dto';

interface RefreshPayload {
  sub: string;
  loai: 'refresh';
}

interface TokenDatLaiHopLe {
  id: bigint;
  tai_khoan_id: bigint;
}

@Injectable()
export class XacThucService {
  private readonly soLanSaiToiDa = 5;
  private readonly soPhutKhoa = 15;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async dangNhap(dto: DangNhapDto) {
    const taiKhoan = await this.prisma.tai_khoan.findFirst({
      where: {
        ngay_xoa: null,
        OR: [{ email: dto.taiKhoan }, { ten_dang_nhap: dto.taiKhoan }],
      },
    });

    if (!taiKhoan) {
      throw new LoiNghiepVuException('XAC_THUC_001', 'Tài khoản hoặc mật khẩu không đúng.', HttpStatus.UNAUTHORIZED);
    }

    if (taiKhoan.trang_thai !== 'HOAT_DONG') {
      throw new LoiNghiepVuException('XAC_THUC_003', 'Tài khoản đang bị khóa hoặc ngừng hoạt động.', HttpStatus.FORBIDDEN);
    }

    if (taiKhoan.khoa_den && taiKhoan.khoa_den > new Date()) {
      throw new LoiNghiepVuException(
        'XAC_THUC_007',
        `Tài khoản đang tạm khóa đến ${taiKhoan.khoa_den.toISOString()}.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const dungMatKhau = await argon2.verify(taiKhoan.mat_khau, dto.matKhau);

    if (!dungMatKhau) {
      const soLanSaiMoi = taiKhoan.so_lan_dang_nhap_sai + 1;
      const khoaDen = soLanSaiMoi >= this.soLanSaiToiDa
        ? new Date(Date.now() + this.soPhutKhoa * 60_000)
        : null;

      await this.prisma.tai_khoan.update({
        where: { id: taiKhoan.id },
        data: { so_lan_dang_nhap_sai: soLanSaiMoi, khoa_den: khoaDen },
      });

      throw new LoiNghiepVuException('XAC_THUC_002', 'Tài khoản hoặc mật khẩu không đúng.', HttpStatus.UNAUTHORIZED);
    }

    await this.prisma.tai_khoan.update({
      where: { id: taiKhoan.id },
      data: { so_lan_dang_nhap_sai: 0, khoa_den: null, lan_dang_nhap_cuoi: new Date() },
    });

    return this.taoBoToken(taiKhoan.id);
  }

  async dangKy(dto: DangKyDto) {
    const tonTai = await this.prisma.tai_khoan.findFirst({
      where: { ngay_xoa: null, OR: [{ email: dto.email }, { ten_dang_nhap: dto.email }] },
      select: { id: true },
    });

    if (tonTai) {
      throw new LoiNghiepVuException('XAC_THUC_008', 'Email đã được sử dụng.', HttpStatus.CONFLICT);
    }

    const khachCungSo = await this.prisma.khach_hang.findFirst({
      where: { so_dien_thoai: dto.soDienThoai, ngay_xoa: null },
    });

    if (khachCungSo?.tai_khoan_id) {
      throw new LoiNghiepVuException('XAC_THUC_009', 'Số điện thoại đã gắn với tài khoản khác.', HttpStatus.CONFLICT);
    }

    const vaiTro = await this.prisma.vai_tro.findUnique({ where: { ma_vai_tro: 'KHACH_HANG' } });
    if (!vaiTro) {
      throw new LoiNghiepVuException('HE_THONG_001', 'Thiếu vai trò KHACH_HANG trong hệ thống.', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const matKhauHash = await argon2.hash(dto.matKhau);

    const taiKhoan = await this.prisma.$transaction(async (tx) => {
      const moi = await tx.tai_khoan.create({
        data: {
          ten_dang_nhap: dto.email,
          email: dto.email,
          mat_khau: matKhauHash,
          vai_tro_id: vaiTro.id,
          trang_thai: 'HOAT_DONG',
        },
      });

      if (khachCungSo) {
        await tx.khach_hang.update({
          where: { id: khachCungSo.id },
          data: { tai_khoan_id: moi.id, ho_ten: dto.hoTen, email: dto.email },
        });
      } else {
        await tx.khach_hang.create({
          data: {
            tai_khoan_id: moi.id,
            ho_ten: dto.hoTen,
            so_dien_thoai: dto.soDienThoai,
            email: dto.email,
            trang_thai: 'HOAT_DONG',
          },
        });
      }

      return moi;
    });

    return this.taoBoToken(taiKhoan.id);
  }

  async lamMoiToken(refreshToken: string) {
    let payload: RefreshPayload;

    try {
      payload = await this.jwt.verifyAsync<RefreshPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new LoiNghiepVuException('XAC_THUC_004', 'Refresh token không hợp lệ hoặc đã hết hạn.', HttpStatus.UNAUTHORIZED);
    }

    if (payload.loai !== 'refresh') {
      throw new LoiNghiepVuException('XAC_THUC_004', 'Sai loại token.', HttpStatus.UNAUTHORIZED);
    }

    const taiKhoan = await this.prisma.tai_khoan.findUnique({ where: { id: BigInt(payload.sub) } });
    if (!taiKhoan?.refresh_token_hash || taiKhoan.trang_thai !== 'HOAT_DONG') {
      throw new LoiNghiepVuException('XAC_THUC_004', 'Refresh token không còn hiệu lực.', HttpStatus.UNAUTHORIZED);
    }

    const hopLe = await argon2.verify(taiKhoan.refresh_token_hash, refreshToken);
    if (!hopLe) {
      throw new LoiNghiepVuException('XAC_THUC_004', 'Refresh token không còn hiệu lực.', HttpStatus.UNAUTHORIZED);
    }

    return this.taoBoToken(taiKhoan.id);
  }

  async dangXuat(taiKhoanId: string) {
    await this.prisma.tai_khoan.update({
      where: { id: BigInt(taiKhoanId) },
      data: { refresh_token_hash: null },
    });
    return { thongBao: 'Đăng xuất thành công.' };
  }

  async doiMatKhau(taiKhoanIdChuoi: string, dto: DoiMatKhauDto) {
    const taiKhoanId = BigInt(taiKhoanIdChuoi);
    const taiKhoan = await this.prisma.tai_khoan.findUnique({ where: { id: taiKhoanId } });
    if (!taiKhoan || taiKhoan.ngay_xoa) {
      throw new LoiNghiepVuException('XAC_THUC_010', 'Tài khoản không tồn tại.', HttpStatus.NOT_FOUND);
    }

    const dungMatKhau = await argon2.verify(taiKhoan.mat_khau, dto.matKhauHienTai);
    if (!dungMatKhau) {
      throw new LoiNghiepVuException('XAC_THUC_011', 'Mật khẩu hiện tại không đúng.', HttpStatus.UNAUTHORIZED);
    }

    if (await argon2.verify(taiKhoan.mat_khau, dto.matKhauMoi)) {
      throw new LoiNghiepVuException('XAC_THUC_012', 'Mật khẩu mới phải khác mật khẩu hiện tại.', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const matKhauHash = await argon2.hash(dto.matKhauMoi);
    await this.prisma.tai_khoan.update({
      where: { id: taiKhoanId },
      data: {
        mat_khau: matKhauHash,
        bat_buoc_doi_mat_khau: false,
        refresh_token_hash: null,
        so_lan_dang_nhap_sai: 0,
        khoa_den: null,
      },
    });

    return { thongBao: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.' };
  }

  async quenMatKhau(dto: QuenMatKhauDto) {
    const thongBao = 'Nếu email tồn tại trong hệ thống, yêu cầu đặt lại mật khẩu đã được ghi nhận.';
    const taiKhoan = await this.prisma.tai_khoan.findFirst({
      where: { email: dto.email, ngay_xoa: null, trang_thai: 'HOAT_DONG' },
      select: { id: true },
    });

    if (!taiKhoan) return { thongBao };

    const token = randomBytes(32).toString('hex');
    const tokenHash = this.bamToken(token);
    const soPhut = Number(this.config.get<string>('RESET_PASSWORD_EXPIRES_MINUTES', '30'));
    const hetHanLuc = new Date(Date.now() + Math.max(5, soPhut) * 60_000);

    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `UPDATE token_dat_lai_mat_khau
         SET da_su_dung = 1, ngay_su_dung = COALESCE(ngay_su_dung, NOW(3))
         WHERE tai_khoan_id = ? AND da_su_dung = 0`,
        taiKhoan.id,
      );
      await tx.$executeRawUnsafe(
        `INSERT INTO token_dat_lai_mat_khau (tai_khoan_id, token_hash, het_han_luc, da_su_dung)
         VALUES (?, ?, ?, 0)`,
        taiKhoan.id,
        tokenHash,
        hetHanLuc,
      );
    });

    return {
      thongBao,
      ...(this.config.get<string>('NODE_ENV', 'development') !== 'production'
        ? { tokenDatLaiMatKhau: token, hetHanLuc }
        : {}),
    };
  }

  async datLaiMatKhau(dto: DatLaiMatKhauDto) {
    const tokenHash = this.bamToken(dto.token.trim());
    const matKhauHash = await argon2.hash(dto.matKhauMoi);

    await this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRawUnsafe<TokenDatLaiHopLe[]>(
        `SELECT id, tai_khoan_id
         FROM token_dat_lai_mat_khau
         WHERE token_hash = ? AND da_su_dung = 0 AND het_han_luc > NOW(3)
         LIMIT 1 FOR UPDATE`,
        tokenHash,
      );
      const token = rows[0];
      if (!token) {
        throw new LoiNghiepVuException('XAC_THUC_013', 'Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.', HttpStatus.UNAUTHORIZED);
      }

      const taiKhoan = await tx.tai_khoan.findUnique({ where: { id: token.tai_khoan_id } });
      if (!taiKhoan || taiKhoan.ngay_xoa || taiKhoan.trang_thai !== 'HOAT_DONG') {
        throw new LoiNghiepVuException('XAC_THUC_013', 'Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.', HttpStatus.UNAUTHORIZED);
      }

      if (await argon2.verify(taiKhoan.mat_khau, dto.matKhauMoi)) {
        throw new LoiNghiepVuException('XAC_THUC_012', 'Mật khẩu mới phải khác mật khẩu hiện tại.', HttpStatus.UNPROCESSABLE_ENTITY);
      }

      await tx.tai_khoan.update({
        where: { id: taiKhoan.id },
        data: {
          mat_khau: matKhauHash,
          bat_buoc_doi_mat_khau: false,
          refresh_token_hash: null,
          so_lan_dang_nhap_sai: 0,
          khoa_den: null,
        },
      });
      await tx.$executeRawUnsafe(
        `UPDATE token_dat_lai_mat_khau
         SET da_su_dung = 1, ngay_su_dung = COALESCE(ngay_su_dung, NOW(3))
         WHERE tai_khoan_id = ? AND da_su_dung = 0`,
        taiKhoan.id,
      );
    }, { timeout: 10_000 });

    return { thongBao: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.' };
  }

  async thongTinHienTai(nguoiDung: NguoiDungXacThuc) {
    const taiKhoan = await this.prisma.tai_khoan.findUnique({
      where: { id: BigInt(nguoiDung.taiKhoanId) },
      select: {
        id: true,
        ten_dang_nhap: true,
        email: true,
        trang_thai: true,
        bat_buoc_doi_mat_khau: true,
        lan_dang_nhap_cuoi: true,
      },
    });

    const vaiTroId = BigInt(nguoiDung.vaiTroId);
    const lienKet = await this.prisma.vai_tro_quyen.findMany({
      where: { vai_tro_id: vaiTroId },
      select: { quyen_id: true },
    });

    const danhSachQuyen = lienKet.length
      ? await this.prisma.quyen.findMany({
          where: {
            id: {
              in: lienKet.map((item) => item.quyen_id),
            },
          },
          select: { ma_quyen: true },
          orderBy: { ma_quyen: 'asc' },
        })
      : [];

    return {
      ...taiKhoan,
      vaiTro: {
        id: nguoiDung.vaiTroId,
        maVaiTro: nguoiDung.maVaiTro,
      },
      quyen: danhSachQuyen.map((item) => item.ma_quyen),
    };
  }

  private bamToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async taoBoToken(taiKhoanId: bigint) {
    const accessExpires = Number(this.config.get<string>('JWT_ACCESS_EXPIRES_SECONDS', '900'));
    const refreshExpires = Number(this.config.get<string>('JWT_REFRESH_EXPIRES_SECONDS', '2592000'));

    const accessToken = await this.jwt.signAsync(
      { sub: taiKhoanId.toString(), loai: 'access' },
      { secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'), expiresIn: accessExpires },
    );

    const refreshToken = await this.jwt.signAsync(
      { sub: taiKhoanId.toString(), loai: 'refresh' },
      { secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'), expiresIn: refreshExpires },
    );

    const refreshHash = await argon2.hash(refreshToken);
    await this.prisma.tai_khoan.update({
      where: { id: taiKhoanId },
      data: { refresh_token_hash: refreshHash },
    });

    return {
      accessToken,
      refreshToken,
      loaiToken: 'Bearer',
      accessHetHanSauGiay: accessExpires,
    };
  }
}
