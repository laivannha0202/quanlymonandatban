import {
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../co-so-du-lieu/prisma.service';
import { LoiNghiepVuException } from '../../dung-chung/exception/loi-nghiep-vu.exception';
import { bigintTuChuoi } from '../../dung-chung/tien-ich/id';
import { DanhSachThongBaoDto } from './dto/danh-sach-thong-bao.dto';

@Injectable()
export class ThongBaoService {
  private readonly logger = new Logger(
    ThongBaoService.name,
  );

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async taoChoDatBan(
    datBanId: bigint,
    loai: string,
    tieuDe: string,
    noiDung: string,
  ): Promise<void> {
    try {
      const datBan =
        await this.prisma.dat_ban.findUnique({
          where: {
            id: datBanId,
          },
          select: {
            khach_hang: {
              select: {
                tai_khoan_id: true,
              },
            },
          },
        });

      const taiKhoanId =
        datBan?.khach_hang?.tai_khoan_id;

      if (!taiKhoanId) {
        return;
      }

      await this.prisma.thong_bao.create({
        data: {
          tai_khoan_id: taiKhoanId,
          dat_ban_id: datBanId,
          loai_thong_bao: loai,
          tieu_de: tieuDe,
          noi_dung: noiDung,
          duong_dan:
            `/tai-khoan/dat-ban/${datBanId.toString()}`,
        },
      });
    } catch (error: unknown) {
      this.logger.warn(
        `Không tạo được thông báo: ${
          error instanceof Error
            ? error.message
            : String(error)
        }`,
      );
    }
  }

  async danhSach(
    taiKhoanIdChuoi: string,
    dto: DanhSachThongBaoDto,
  ) {
    const taiKhoanId = bigintTuChuoi(
      taiKhoanIdChuoi,
      'ID tài khoản',
    );

    const where: Prisma.thong_baoWhereInput = {
      tai_khoan_id: taiKhoanId,
      ...(dto.daDoc !== undefined
        ? {
            da_doc: dto.daDoc === 'true',
          }
        : {}),
    };

    const skip =
      (dto.trang - 1) * dto.kichThuoc;

    const [danhSach, tong] =
      await Promise.all([
        this.prisma.thong_bao.findMany({
          where,
          orderBy: {
            ngay_tao: 'desc',
          },
          skip,
          take: dto.kichThuoc,
          select: {
            id: true,
            tai_khoan_id: true,
            dat_ban_id: true,
            loai_thong_bao: true,
            tieu_de: true,
            noi_dung: true,
            duong_dan: true,
            da_doc: true,
            thoi_gian_doc: true,
            ngay_tao: true,
          },
        }),
        this.prisma.thong_bao.count({
          where,
        }),
      ]);

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

  async soChuaDoc(
    taiKhoanIdChuoi: string,
  ) {
    const taiKhoanId = bigintTuChuoi(
      taiKhoanIdChuoi,
      'ID tài khoản',
    );

    const soChuaDoc =
      await this.prisma.thong_bao.count({
        where: {
          tai_khoan_id: taiKhoanId,
          da_doc: false,
        },
      });

    return {
      soChuaDoc,
    };
  }

  async danhDauDaDoc(
    taiKhoanIdChuoi: string,
    id: string,
  ) {
    const thongBaoId = bigintTuChuoi(
      id,
      'ID thông báo',
    );
    const taiKhoanId = bigintTuChuoi(
      taiKhoanIdChuoi,
      'ID tài khoản',
    );

    const thongBao =
      await this.prisma.thong_bao.findFirst({
        where: {
          id: thongBaoId,
          tai_khoan_id: taiKhoanId,
        },
        select: {
          id: true,
          da_doc: true,
          thoi_gian_doc: true,
        },
      });

    if (!thongBao) {
      throw new LoiNghiepVuException(
        'THONG_BAO_001',
        'Không tìm thấy thông báo.',
        HttpStatus.NOT_FOUND,
      );
    }

    if (!thongBao.da_doc) {
      await this.prisma.thong_bao.update({
        where: {
          id: thongBao.id,
        },
        data: {
          da_doc: true,
          thoi_gian_doc:
            thongBao.thoi_gian_doc ??
            new Date(),
        },
      });
    }

    return {
      daDoc: true,
    };
  }

  async docTatCa(
    taiKhoanIdChuoi: string,
  ) {
    const taiKhoanId = bigintTuChuoi(
      taiKhoanIdChuoi,
      'ID tài khoản',
    );

    const ketQua =
      await this.prisma.thong_bao.updateMany({
        where: {
          tai_khoan_id: taiKhoanId,
          da_doc: false,
        },
        data: {
          da_doc: true,
          thoi_gian_doc: new Date(),
        },
      });

    return {
      soThongBaoDaDoc: ketQua.count,
    };
  }
}
