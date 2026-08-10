import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../co-so-du-lieu/prisma.service';
import { LoiNghiepVuException } from '../../dung-chung/exception/loi-nghiep-vu.exception';
import { bigintTuChuoi } from '../../dung-chung/tien-ich/id';
import { CapNhatBanAnDto } from './dto/cap-nhat-ban-an.dto';
import { DanhSachBanAnDto } from './dto/danh-sach-ban-an.dto';
import { TaoBanAnDto } from './dto/tao-ban-an.dto';

@Injectable()
export class BanAnService {
  constructor(private readonly prisma: PrismaService) {}

  async danhSach(dto: DanhSachBanAnDto) {
    const where = {
      ngay_xoa: null,
      ...(dto.khuVucId ? { khu_vuc_id: bigintTuChuoi(dto.khuVucId, 'ID khu vực') } : {}),
      ...(dto.trangThai ? { trang_thai: dto.trangThai } : {}),
      ...(dto.tuKhoa
        ? {
            OR: [
              { ma_ban: { contains: dto.tuKhoa } },
              { ten_ban: { contains: dto.tuKhoa } },
            ],
          }
        : {}),
    };

    const [tongBanGhi, danhSach] = await this.prisma.$transaction([
      this.prisma.ban_an.count({ where }),
      this.prisma.ban_an.findMany({
        where,
        orderBy: [{ khu_vuc_id: 'asc' }, { ma_ban: 'asc' }],
        skip: (dto.trang - 1) * dto.kichThuoc,
        take: dto.kichThuoc,
      }),
    ]);

    return {
      danhSach,
      phanTrang: {
        trang: dto.trang,
        kichThuoc: dto.kichThuoc,
        tong: tongBanGhi,
        tongTrang: Math.ceil(tongBanGhi / dto.kichThuoc),
      },
    };
  }

  async chiTiet(id: string) {
    const ban = await this.prisma.ban_an.findFirst({
      where: { id: bigintTuChuoi(id, 'ID bàn'), ngay_xoa: null },
    });
    if (!ban) {
      throw new LoiNghiepVuException('BAN_AN_001', 'Không tìm thấy bàn.', HttpStatus.NOT_FOUND);
    }
    return ban;
  }

  async tao(dto: TaoBanAnDto) {
    this.kiemTraSucChua(dto.sucChua, dto.sucChuaToiDa);
    const khuVucId = bigintTuChuoi(dto.khuVucId, 'ID khu vực');
    await this.kiemTraKhuVuc(khuVucId);

    const trung = await this.prisma.ban_an.findUnique({ where: { ma_ban: dto.maBan } });
    if (trung) {
      throw new LoiNghiepVuException('BAN_AN_002', 'Mã bàn đã tồn tại.', HttpStatus.CONFLICT);
    }

    return this.prisma.ban_an.create({
      data: {
        ma_ban: dto.maBan,
        ten_ban: dto.tenBan,
        khu_vuc_id: khuVucId,
        suc_chua: dto.sucChua,
        suc_chua_toi_da: dto.sucChuaToiDa,
        vi_tri_x: dto.viTriX,
        vi_tri_y: dto.viTriY,
        trang_thai: dto.trangThai ?? 'TRONG',
        ghi_chu: dto.ghiChu,
      },
    });
  }

  async capNhat(id: string, dto: CapNhatBanAnDto) {
    const ban = await this.chiTiet(id);
    const sucChua = dto.sucChua ?? ban.suc_chua;
    const sucChuaToiDa = dto.sucChuaToiDa ?? ban.suc_chua_toi_da;
    this.kiemTraSucChua(sucChua, sucChuaToiDa);

    let khuVucId = ban.khu_vuc_id;
    if (dto.khuVucId) {
      khuVucId = bigintTuChuoi(dto.khuVucId, 'ID khu vực');
      await this.kiemTraKhuVuc(khuVucId);
    }

    if (dto.maBan && dto.maBan !== ban.ma_ban) {
      const trung = await this.prisma.ban_an.findUnique({ where: { ma_ban: dto.maBan } });
      if (trung) {
        throw new LoiNghiepVuException('BAN_AN_002', 'Mã bàn đã tồn tại.', HttpStatus.CONFLICT);
      }
    }

    return this.prisma.ban_an.update({
      where: { id: ban.id },
      data: {
        ...(dto.maBan !== undefined ? { ma_ban: dto.maBan } : {}),
        ...(dto.tenBan !== undefined ? { ten_ban: dto.tenBan } : {}),
        ...(dto.khuVucId !== undefined ? { khu_vuc_id: khuVucId } : {}),
        ...(dto.sucChua !== undefined ? { suc_chua: dto.sucChua } : {}),
        ...(dto.sucChuaToiDa !== undefined ? { suc_chua_toi_da: dto.sucChuaToiDa } : {}),
        ...(dto.viTriX !== undefined ? { vi_tri_x: dto.viTriX } : {}),
        ...(dto.viTriY !== undefined ? { vi_tri_y: dto.viTriY } : {}),
        ...(dto.trangThai !== undefined ? { trang_thai: dto.trangThai } : {}),
        ...(dto.ghiChu !== undefined ? { ghi_chu: dto.ghiChu } : {}),
      },
    });
  }

  async xoa(id: string) {
    const ban = await this.chiTiet(id);
    const rows = await this.prisma.$queryRawUnsafe<Array<{ tong: bigint }>>(
      `SELECT COUNT(*) AS tong
       FROM chi_tiet_dat_ban ctdb
       INNER JOIN dat_ban db ON db.id = ctdb.dat_ban_id
       WHERE ctdb.ban_an_id = ?
         AND db.trang_thai IN ('CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DA_CHECK_IN')
         AND db.gio_ket_thuc > NOW()`,
      ban.id,
    );

    if (Number(rows[0]?.tong ?? 0) > 0) {
      throw new LoiNghiepVuException(
        'BAN_AN_003',
        'Bàn đang có lịch đặt còn hiệu lực nên không thể xóa.',
        HttpStatus.CONFLICT,
      );
    }

    await this.prisma.$transaction([
      this.prisma.lien_ket_ban.deleteMany({
        where: { OR: [{ ban_1_id: ban.id }, { ban_2_id: ban.id }] },
      }),
      this.prisma.ban_an.update({
        where: { id: ban.id },
        data: { ngay_xoa: new Date(), trang_thai: 'NGUNG_SU_DUNG' },
      }),
    ]);

    return { daXoa: true };
  }

  async soDo() {
    const khuVuc = await this.prisma.khu_vuc.findMany({
      where: { ngay_xoa: null },
      orderBy: [{ thu_tu: 'asc' }, { ten_khu_vuc: 'asc' }],
      select: { id: true, ma_khu_vuc: true, ten_khu_vuc: true, trang_thai: true },
    });
    const ban = await this.prisma.ban_an.findMany({
      where: { ngay_xoa: null },
      orderBy: [{ khu_vuc_id: 'asc' }, { ma_ban: 'asc' }],
    });

    return khuVuc.map((kv) => ({
      ...kv,
      banAns: ban.filter((item) => item.khu_vuc_id === kv.id),
    }));
  }

  private kiemTraSucChua(sucChua: number, sucChuaToiDa: number): void {
    if (sucChua < 1 || sucChuaToiDa < sucChua) {
      throw new LoiNghiepVuException(
        'BAN_AN_004',
        'Sức chứa tối đa phải lớn hơn hoặc bằng sức chứa chuẩn và tối thiểu là 1.',
      );
    }
  }

  private async kiemTraKhuVuc(id: bigint): Promise<void> {
    const khuVuc = await this.prisma.khu_vuc.findFirst({
      where: { id, ngay_xoa: null, trang_thai: 'HOAT_DONG' },
      select: { id: true },
    });
    if (!khuVuc) {
      throw new LoiNghiepVuException('KHU_VUC_001', 'Khu vực không tồn tại hoặc đã ngừng hoạt động.', HttpStatus.NOT_FOUND);
    }
  }
}
