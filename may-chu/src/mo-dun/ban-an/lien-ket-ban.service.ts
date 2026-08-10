import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../co-so-du-lieu/prisma.service';
import { LoiNghiepVuException } from '../../dung-chung/exception/loi-nghiep-vu.exception';
import { bigintTuChuoi } from '../../dung-chung/tien-ich/id';
import { CapNhatLienKetBanDto } from './dto/cap-nhat-lien-ket-ban.dto';
import { TaoLienKetBanDto } from './dto/tao-lien-ket-ban.dto';

@Injectable()
export class LienKetBanService {
  constructor(private readonly prisma: PrismaService) {}

  danhSach() {
    return this.prisma.lien_ket_ban.findMany({
      orderBy: [{ ban_1_id: 'asc' }, { ban_2_id: 'asc' }],
    });
  }

  async tao(dto: TaoLienKetBanDto) {
    let ban1Id = bigintTuChuoi(dto.ban1Id, 'Bàn 1');
    let ban2Id = bigintTuChuoi(dto.ban2Id, 'Bàn 2');
    if (ban1Id === ban2Id) {
      throw new LoiNghiepVuException('LIEN_KET_BAN_001', 'Không thể liên kết một bàn với chính nó.');
    }
    if (ban1Id > ban2Id) [ban1Id, ban2Id] = [ban2Id, ban1Id];

    const ban = await this.prisma.ban_an.findMany({
      where: { id: { in: [ban1Id, ban2Id] }, ngay_xoa: null },
      select: { id: true, khu_vuc_id: true },
    });
    if (ban.length !== 2) {
      throw new LoiNghiepVuException('LIEN_KET_BAN_002', 'Một trong hai bàn không tồn tại.', HttpStatus.NOT_FOUND);
    }
    if (ban[0].khu_vuc_id !== ban[1].khu_vuc_id) {
      throw new LoiNghiepVuException('LIEN_KET_BAN_003', 'Chỉ cho phép ghép các bàn trong cùng khu vực.');
    }

    const daCo = await this.prisma.lien_ket_ban.findFirst({
      where: { ban_1_id: ban1Id, ban_2_id: ban2Id },
    });
    if (daCo) {
      throw new LoiNghiepVuException('LIEN_KET_BAN_004', 'Cặp bàn này đã được khai báo.', HttpStatus.CONFLICT);
    }

    return this.prisma.lien_ket_ban.create({
      data: {
        ban_1_id: ban1Id,
        ban_2_id: ban2Id,
        co_the_ghep: dto.coTheGhep ?? true,
        ghi_chu: dto.ghiChu,
      },
    });
  }

  async capNhat(id: string, dto: CapNhatLienKetBanDto) {
    const idSo = bigintTuChuoi(id);
    const hienTai = await this.prisma.lien_ket_ban.findUnique({ where: { id: idSo } });
    if (!hienTai) {
      throw new LoiNghiepVuException('LIEN_KET_BAN_005', 'Không tìm thấy liên kết bàn.', HttpStatus.NOT_FOUND);
    }
    return this.prisma.lien_ket_ban.update({
      where: { id: idSo },
      data: {
        ...(dto.coTheGhep !== undefined ? { co_the_ghep: dto.coTheGhep } : {}),
        ...(dto.ghiChu !== undefined ? { ghi_chu: dto.ghiChu } : {}),
      },
    });
  }

  async xoa(id: string) {
    const ketQua = await this.prisma.lien_ket_ban.deleteMany({ where: { id: bigintTuChuoi(id) } });
    if (!ketQua.count) {
      throw new LoiNghiepVuException('LIEN_KET_BAN_005', 'Không tìm thấy liên kết bàn.', HttpStatus.NOT_FOUND);
    }
    return { daXoa: true };
  }

  async layCapCoTheGhep(banIds: bigint[]) {
    if (!banIds.length) return [];
    return this.prisma.lien_ket_ban.findMany({
      where: {
        co_the_ghep: true,
        ban_1_id: { in: banIds },
        ban_2_id: { in: banIds },
      },
      orderBy: [{ ban_1_id: 'asc' }, { ban_2_id: 'asc' }],
    });
  }
}
