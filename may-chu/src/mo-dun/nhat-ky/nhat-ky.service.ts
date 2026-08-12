import {
  Injectable,
  Logger,
} from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../co-so-du-lieu/prisma.service';
import { chuyenBigIntThanhChuoi } from '../../dung-chung/tien-ich/chuyen-bigint';
import { bigintTuChuoi } from '../../dung-chung/tien-ich/id';
import { DanhSachNhatKyDto } from './dto/danh-sach-nhat-ky.dto';

export interface GhiNhatKyInput {
  taiKhoanId?: string | null;
  hanhDong: string;
  doiTuong: string;
  doiTuongId?: string | null;
  duLieuCu?: unknown;
  duLieuMoi?: unknown;
  diaChiIp?: string | null;
  userAgent?: string | null;
  maYeuCau?: string | null;
}

@Injectable()
export class NhatKyService {
  private readonly logger = new Logger(
    NhatKyService.name,
  );

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async ghiNhan(
    input: GhiNhatKyInput,
  ): Promise<void> {
    try {
      await this.prisma.nhat_ky_hoat_dong.create({
        data: {
          tai_khoan_id: input.taiKhoanId
            ? bigintTuChuoi(
                input.taiKhoanId,
                'ID tài khoản',
              )
            : null,
          hanh_dong: input.hanhDong,
          doi_tuong: input.doiTuong,
          doi_tuong_id:
            input.doiTuongId ?? null,
          du_lieu_cu:
            input.duLieuCu == null
              ? undefined
              : (chuyenBigIntThanhChuoi(
                  input.duLieuCu,
                ) as Prisma.InputJsonValue),
          du_lieu_moi:
            input.duLieuMoi == null
              ? undefined
              : (chuyenBigIntThanhChuoi(
                  input.duLieuMoi,
                ) as Prisma.InputJsonValue),
          dia_chi_ip:
            input.diaChiIp ?? null,
          user_agent:
            input.userAgent ?? null,
          ma_yeu_cau:
            input.maYeuCau ?? null,
        },
      });
    } catch (error: unknown) {
      this.logger.warn(
        `Không ghi được audit log: ${
          error instanceof Error
            ? error.message
            : String(error)
        }`,
      );
    }
  }

  async danhSach(
    dto: DanhSachNhatKyDto,
  ) {
    const where: Prisma.nhat_ky_hoat_dongWhereInput = {
      ...(dto.hanhDong
        ? {
            hanh_dong: dto.hanhDong,
          }
        : {}),
      ...(dto.doiTuong
        ? {
            doi_tuong: dto.doiTuong,
          }
        : {}),
      ...(dto.taiKhoanId
        ? {
            tai_khoan_id:
              bigintTuChuoi(
                dto.taiKhoanId,
                'ID tài khoản',
              ),
          }
        : {}),
      ...(dto.maYeuCau
        ? {
            ma_yeu_cau: dto.maYeuCau,
          }
        : {}),
    };

    const skip =
      (dto.trang - 1) * dto.kichThuoc;

    const [rows, tong] =
      await Promise.all([
        this.prisma.nhat_ky_hoat_dong.findMany({
          where,
          orderBy: {
            thoi_gian: 'desc',
          },
          skip,
          take: dto.kichThuoc,
          include: {
            tai_khoan: {
              select: {
                email: true,
              },
            },
          },
        }),
        this.prisma.nhat_ky_hoat_dong.count({
          where,
        }),
      ]);

    const danhSach = rows.map(
      ({
        tai_khoan: taiKhoan,
        ...row
      }) => ({
        ...row,
        email_tai_khoan:
          taiKhoan?.email ?? null,
      }),
    );

    return {
      danhSach,
      phanTrang: {
        trang: dto.trang,
        kichThuoc: dto.kichThuoc,
        tong,
        tongTrang: Math.ceil(
          tong / dto.kichThuoc,
        ),
      },
    };
  }
}
