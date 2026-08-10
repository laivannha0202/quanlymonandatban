import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { RequestCoNguoiDung } from '../types/request-co-nguoi-dung.type';
import { LoiNghiepVuException } from '../exception/loi-nghiep-vu.exception';
import { PrismaService } from '../../co-so-du-lieu/prisma.service';

interface JwtPayload {
  sub: string;
  loai: 'access';
}

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestCoNguoiDung>();
    const authorization = request.header('authorization');

    if (!authorization?.startsWith('Bearer ')) {
      throw new LoiNghiepVuException(
        'XAC_THUC_004',
        'Thiếu access token.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const token = authorization.slice(7).trim();

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });

      if (payload.loai !== 'access') {
        throw new Error('Sai loại token');
      }

      const taiKhoan = await this.prisma.tai_khoan.findUnique({
        where: { id: BigInt(payload.sub) },
      });

      if (!taiKhoan || taiKhoan.ngay_xoa || taiKhoan.trang_thai !== 'HOAT_DONG') {
        throw new LoiNghiepVuException(
          'XAC_THUC_003',
          'Tài khoản không còn hoạt động.',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const vaiTro = await this.prisma.vai_tro.findUnique({
        where: { id: taiKhoan.vai_tro_id },
      });

      if (!vaiTro || vaiTro.trang_thai !== 'HOAT_DONG') {
        throw new LoiNghiepVuException(
          'XAC_THUC_006',
          'Vai trò tài khoản không hợp lệ.',
          HttpStatus.FORBIDDEN,
        );
      }

      request.nguoiDung = {
        taiKhoanId: taiKhoan.id.toString(),
        vaiTroId: taiKhoan.vai_tro_id.toString(),
        maVaiTro: vaiTro.ma_vai_tro,
      };

      return true;
    } catch (error) {
      if (error instanceof LoiNghiepVuException) {
        throw error;
      }

      throw new LoiNghiepVuException(
        'XAC_THUC_004',
        'Access token không hợp lệ hoặc đã hết hạn.',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
