import { HttpStatus, Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../co-so-du-lieu/prisma.service';
import { LoiNghiepVuException } from '../../dung-chung/exception/loi-nghiep-vu.exception';
import { bigintTuChuoi } from '../../dung-chung/tien-ich/id';
import type { NguoiDungXacThuc } from '../../dung-chung/types/nguoi-dung-xac-thuc.type';
import { NhatKyService } from '../nhat-ky/nhat-ky.service';
import { CapNhatQuyenVaiTroDto } from './dto/cap-nhat-quyen-vai-tro.dto';

type VaiTroKemQuyen = Prisma.vai_troGetPayload<{
  include: {
    vai_tro_quyen: {
      include: {
        quyen: true;
      };
    };
  };
}>;

const KEM_QUYEN = {
  vai_tro_quyen: {
    include: {
      quyen: true,
    },
  },
} satisfies Prisma.vai_troInclude;

@Injectable()
export class VaiTroService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly nhatKy: NhatKyService,
  ) {}

  async danhSach() {
    const rows = await this.prisma.vai_tro.findMany({
      where: {
        trang_thai: 'HOAT_DONG',
      },
      orderBy: {
        id: 'asc',
      },
      include: KEM_QUYEN,
    });

    return rows.map((row) =>
      this.toView(row as VaiTroKemQuyen),
    );
  }

  async danhSachQuyen() {
    return this.prisma.quyen.findMany({
      orderBy: [
        { nhom_quyen: 'asc' },
        { ma_quyen: 'asc' },
      ],
    });
  }

  async chiTiet(id: string) {
    const vaiTroId = bigintTuChuoi(
      id,
      'ID vai trò',
    );

    const vaiTro = await this.prisma.vai_tro.findUnique({
      where: {
        id: vaiTroId,
      },
      include: KEM_QUYEN,
    });

    if (!vaiTro) {
      throw new LoiNghiepVuException(
        'VAI_TRO_001',
        'Vai trò không tồn tại.',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.toView(
      vaiTro as VaiTroKemQuyen,
    );
  }

  async capNhatQuyen(
    id: string,
    dto: CapNhatQuyenVaiTroDto,
    nguoiDung: NguoiDungXacThuc,
    maYeuCau?: string | null,
  ) {
    const vaiTroId = bigintTuChuoi(
      id,
      'ID vai trò',
    );

    const vaiTro = await this.prisma.vai_tro.findUnique({
      where: {
        id: vaiTroId,
      },
      select: {
        id: true,
        ma_vai_tro: true,
        trang_thai: true,
      },
    });

    if (!vaiTro) {
      throw new LoiNghiepVuException(
        'VAI_TRO_001',
        'Vai trò không tồn tại.',
        HttpStatus.NOT_FOUND,
      );
    }

    if (vaiTro.trang_thai !== 'HOAT_DONG') {
      throw new LoiNghiepVuException(
        'VAI_TRO_006',
        'Không thể cập nhật quyền cho vai trò đã ngừng hoạt động.',
        HttpStatus.CONFLICT,
      );
    }

    if (vaiTro.ma_vai_tro === 'QUAN_TRI_VIEN') {
      throw new LoiNghiepVuException(
        'VAI_TRO_002',
        'Không cho phép sửa quyền của vai trò QUAN_TRI_VIEN để tránh mất quyền quản trị hệ thống.',
        HttpStatus.CONFLICT,
      );
    }

    if (vaiTro.ma_vai_tro === 'KHACH_HANG') {
      throw new LoiNghiepVuException(
        'VAI_TRO_004',
        'Vai trò KHACH_HANG được cố định và không được gán quyền quản trị.',
        HttpStatus.CONFLICT,
      );
    }

    if (
      vaiTro.id.toString() ===
      nguoiDung.vaiTroId
    ) {
      throw new LoiNghiepVuException(
        'VAI_TRO_005',
        'Không thể tự thay đổi quyền của chính vai trò đang sử dụng.',
        HttpStatus.CONFLICT,
      );
    }

    const maQuyens = [
      ...new Set(
        dto.maQuyens
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    ];

    const quyen = maQuyens.length
      ? await this.prisma.quyen.findMany({
          where: {
            ma_quyen: {
              in: maQuyens,
            },
          },
          select: {
            id: true,
            ma_quyen: true,
          },
        })
      : [];

    if (quyen.length !== maQuyens.length) {
      const tonTai = new Set(
        quyen.map((item) => item.ma_quyen),
      );

      const khongTonTai = maQuyens.filter(
        (item) => !tonTai.has(item),
      );

      throw new LoiNghiepVuException(
        'VAI_TRO_003',
        'Có mã quyền không tồn tại.',
        HttpStatus.BAD_REQUEST,
        {
          maQuyenKhongTonTai: khongTonTai,
        },
      );
    }

    const cu = await this.chiTiet(id);

    await this.prisma.$transaction(async (tx) => {
      await tx.vai_tro_quyen.deleteMany({
        where: {
          vai_tro_id: vaiTroId,
        },
      });

      if (quyen.length) {
        await tx.vai_tro_quyen.createMany({
          data: quyen.map((item) => ({
            vai_tro_id: vaiTroId,
            quyen_id: item.id,
          })),
        });
      }
    });

    const moi = await this.chiTiet(id);

    await this.nhatKy.ghiNhan({
      taiKhoanId: nguoiDung.taiKhoanId,
      hanhDong: 'CAP_NHAT_QUYEN_VAI_TRO',
      doiTuong: 'VAI_TRO',
      doiTuongId: id,
      duLieuCu: cu,
      duLieuMoi: moi,
      maYeuCau,
    });

    return moi;
  }

  private toView(
    vaiTro: VaiTroKemQuyen,
  ) {
    const {
      vai_tro_quyen: lienKet,
      ...thongTinVaiTro
    } = vaiTro;

    const quyen = lienKet
      .map((item) => item.quyen)
      .sort((a, b) => {
        const theoNhom =
          a.nhom_quyen.localeCompare(
            b.nhom_quyen,
            'vi',
          );

        if (theoNhom !== 0) {
          return theoNhom;
        }

        return a.ma_quyen.localeCompare(
          b.ma_quyen,
          'vi',
        );
      });

    return {
      ...thongTinVaiTro,
      quyen,
    };
  }
}
