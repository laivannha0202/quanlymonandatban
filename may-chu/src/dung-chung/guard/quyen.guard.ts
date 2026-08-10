import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { KHOA_QUYEN } from '../decorator/can-quyen.decorator';
import type { RequestCoNguoiDung } from '../types/request-co-nguoi-dung.type';
import { PrismaService } from '../../co-so-du-lieu/prisma.service';

@Injectable()
export class QuyenGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const quyenCanCo = this.reflector.getAllAndOverride<string[]>(KHOA_QUYEN, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!quyenCanCo?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestCoNguoiDung>();
    const nguoiDung = request.nguoiDung;

    if (!nguoiDung) {
      throw new ForbiddenException('Chưa xác định được người dùng.');
    }

    const lienKet = await this.prisma.vai_tro_quyen.findMany({
      where: { vai_tro_id: BigInt(nguoiDung.vaiTroId) },
      select: { quyen_id: true },
    });

    const danhSachId = lienKet.map((phanTu) => phanTu.quyen_id);
    const danhSachQuyen = danhSachId.length
      ? await this.prisma.quyen.findMany({
          where: { id: { in: danhSachId } },
          select: { ma_quyen: true },
        })
      : [];

    const tapQuyen = new Set(danhSachQuyen.map((phanTu) => phanTu.ma_quyen));
    const duQuyen = quyenCanCo.every((maQuyen) => tapQuyen.has(maQuyen));

    if (!duQuyen) {
      throw new ForbiddenException('Bạn không có quyền thực hiện chức năng này.');
    }

    return true;
  }
}
