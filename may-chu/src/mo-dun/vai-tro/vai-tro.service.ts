import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../co-so-du-lieu/prisma.service';
import { LoiNghiepVuException } from '../../dung-chung/exception/loi-nghiep-vu.exception';
import { bigintTuChuoi } from '../../dung-chung/tien-ich/id';
import type { NguoiDungXacThuc } from '../../dung-chung/types/nguoi-dung-xac-thuc.type';
import { NhatKyService } from '../nhat-ky/nhat-ky.service';
import { CapNhatQuyenVaiTroDto } from './dto/cap-nhat-quyen-vai-tro.dto';

@Injectable()
export class VaiTroService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly nhatKy: NhatKyService,
  ) {}

  async danhSach() {
    const vaiTro = await this.prisma.vai_tro.findMany({
      where: { trang_thai: 'HOAT_DONG' },
      orderBy: { id: 'asc' },
    });

    const ketQua = [];
    for (const item of vaiTro) {
      ketQua.push(await this.ganQuyen(item));
    }
    return ketQua;
  }

  async danhSachQuyen() {
    return this.prisma.quyen.findMany({
      orderBy: [{ nhom_quyen: 'asc' }, { ma_quyen: 'asc' }],
    });
  }

  async chiTiet(id: string) {
    const vaiTroId = bigintTuChuoi(id, 'ID vai trò');
    const vaiTro = await this.prisma.vai_tro.findUnique({ where: { id: vaiTroId } });
    if (!vaiTro) {
      throw new LoiNghiepVuException('VAI_TRO_001', 'Vai trò không tồn tại.', HttpStatus.NOT_FOUND);
    }
    return this.ganQuyen(vaiTro);
  }

  async capNhatQuyen(
    id: string,
    dto: CapNhatQuyenVaiTroDto,
    nguoiDung: NguoiDungXacThuc,
    maYeuCau?: string | null,
  ) {
    const vaiTroId = bigintTuChuoi(id, 'ID vai trò');
    const vaiTro = await this.prisma.vai_tro.findUnique({ where: { id: vaiTroId } });
    if (!vaiTro) {
      throw new LoiNghiepVuException('VAI_TRO_001', 'Vai trò không tồn tại.', HttpStatus.NOT_FOUND);
    }
    if (vaiTro.ma_vai_tro === 'QUAN_TRI_VIEN') {
      throw new LoiNghiepVuException(
        'VAI_TRO_002',
        'Không cho phép sửa quyền của vai trò QUAN_TRI_VIEN để tránh tự khóa quyền quản trị hệ thống.',
        HttpStatus.CONFLICT,
      );
    }

    const maQuyens = [...new Set(dto.maQuyens.map((x) => x.trim()).filter(Boolean))];
    const quyen = maQuyens.length
      ? await this.prisma.quyen.findMany({ where: { ma_quyen: { in: maQuyens } } })
      : [];

    if (quyen.length !== maQuyens.length) {
      const tonTai = new Set(quyen.map((x) => x.ma_quyen));
      const khongTonTai = maQuyens.filter((x) => !tonTai.has(x));
      throw new LoiNghiepVuException(
        'VAI_TRO_003',
        'Có mã quyền không tồn tại.',
        HttpStatus.BAD_REQUEST,
        { maQuyenKhongTonTai: khongTonTai },
      );
    }

    const cu = await this.chiTiet(id);
    await this.prisma.$transaction(async (tx) => {
      await tx.vai_tro_quyen.deleteMany({ where: { vai_tro_id: vaiTroId } });
      if (quyen.length) {
        await tx.vai_tro_quyen.createMany({
          data: quyen.map((item) => ({ vai_tro_id: vaiTroId, quyen_id: item.id })),
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

  private async ganQuyen<T extends { id: bigint }>(vaiTro: T) {
    const lienKet = await this.prisma.vai_tro_quyen.findMany({
      where: { vai_tro_id: vaiTro.id },
      select: { quyen_id: true },
    });

    const quyen = lienKet.length
      ? await this.prisma.quyen.findMany({
          where: { id: { in: lienKet.map((x) => x.quyen_id) } },
          orderBy: [{ nhom_quyen: 'asc' }, { ma_quyen: 'asc' }],
        })
      : [];

    return { ...vaiTro, quyen };
  }
}
