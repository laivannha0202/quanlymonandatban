import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../co-so-du-lieu/prisma.service';
import { LoiNghiepVuException } from '../../dung-chung/exception/loi-nghiep-vu.exception';
import { taoDuongDan } from '../../dung-chung/tien-ich/duong-dan';
import { bigintTuChuoi } from '../../dung-chung/tien-ich/id';
import type { NguoiDungXacThuc } from '../../dung-chung/types/nguoi-dung-xac-thuc.type';
import { NhatKyService } from '../nhat-ky/nhat-ky.service';
import { CapNhatDanhMucMonDto } from './dto/cap-nhat-danh-muc-mon.dto';
import { TaoDanhMucMonDto } from './dto/tao-danh-muc-mon.dto';

@Injectable()
export class DanhMucMonService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly nhatKy: NhatKyService,
  ) {}

  async danhSachCongKhai() {
    const rows = await this.prisma.danh_muc_mon.findMany({
      where: {
        ngay_xoa: null,
        trang_thai: 'HOAT_DONG',
      },
      orderBy: [
        { thu_tu: 'asc' },
        { ten_danh_muc: 'asc' },
      ],
      include: {
        _count: {
          select: {
            mon_an: {
              where: {
                ngay_xoa: null,
                trang_thai: 'HOAT_DONG',
              },
            },
          },
        },
      },
    });

    return rows.map(({ _count, ...row }) => ({
      ...row,
      so_mon: _count.mon_an,
    }));
  }

  async danhSachQuanTri() {
    const rows = await this.prisma.danh_muc_mon.findMany({
      where: {
        ngay_xoa: null,
      },
      orderBy: [
        { thu_tu: 'asc' },
        { ten_danh_muc: 'asc' },
      ],
      include: {
        _count: {
          select: {
            mon_an: {
              where: {
                ngay_xoa: null,
              },
            },
          },
        },
      },
    });

    return rows.map(({ _count, ...row }) => ({
      ...row,
      so_mon: _count.mon_an,
    }));
  }

  async chiTiet(id: string) {
    const row = await this.prisma.danh_muc_mon.findFirst({
      where: {
        id: bigintTuChuoi(id, 'ID danh mục món'),
        ngay_xoa: null,
      },
    });

    if (!row) {
      throw new LoiNghiepVuException(
        'DANH_MUC_MON_001',
        'Không tìm thấy danh mục món.',
        HttpStatus.NOT_FOUND,
      );
    }

    return row;
  }

  async tao(
    dto: TaoDanhMucMonDto,
    nguoiDung: NguoiDungXacThuc,
    maYeuCau?: string | null,
  ) {
    const duongDan = dto.duongDan?.trim() || taoDuongDan(dto.tenDanhMuc);
    await this.damBaoKhongTrung(dto.maDanhMuc, duongDan);

    const row = await this.prisma.danh_muc_mon.create({
      data: {
        ma_danh_muc: dto.maDanhMuc,
        ten_danh_muc: dto.tenDanhMuc,
        duong_dan: duongDan,
        mo_ta: dto.moTa ?? null,
        thu_tu: dto.thuTu ?? 0,
        trang_thai: dto.trangThai ?? 'HOAT_DONG',
      },
    });

    await this.nhatKy.ghiNhan({
      taiKhoanId: nguoiDung.taiKhoanId,
      hanhDong: 'TAO_DANH_MUC_MON',
      doiTuong: 'DANH_MUC_MON',
      doiTuongId: row.id.toString(),
      duLieuMoi: row,
      maYeuCau,
    });

    return row;
  }

  async capNhat(
    id: string,
    dto: CapNhatDanhMucMonDto,
    nguoiDung: NguoiDungXacThuc,
    maYeuCau?: string | null,
  ) {
    const cu = await this.chiTiet(id);
    const danhMucId = bigintTuChuoi(id, 'ID danh mục món');

    if (
      dto.maDanhMuc !== undefined &&
      dto.maDanhMuc !== cu.ma_danh_muc
    ) {
      throw new LoiNghiepVuException(
        'DANH_MUC_MON_004',
        'Mã danh mục được cố định sau khi tạo và không thể thay đổi.',
        HttpStatus.CONFLICT,
      );
    }

    const duongDanMoi =
      dto.duongDan !== undefined
        ? dto.duongDan.trim() ||
          taoDuongDan(dto.tenDanhMuc ?? cu.ten_danh_muc)
        : undefined;

    if (
      duongDanMoi !== undefined &&
      duongDanMoi !== cu.duong_dan
    ) {
      const trung = await this.prisma.danh_muc_mon.findFirst({
        where: {
          id: { not: danhMucId },
          duong_dan: duongDanMoi,
        },
        select: { id: true },
      });

      if (trung) {
        throw new LoiNghiepVuException(
          'DANH_MUC_MON_002',
          'Mã hoặc đường dẫn danh mục đã tồn tại.',
          HttpStatus.CONFLICT,
        );
      }
    }

    const row = await this.prisma.danh_muc_mon.update({
      where: { id: danhMucId },
      data: {
        ...(dto.tenDanhMuc !== undefined
          ? { ten_danh_muc: dto.tenDanhMuc }
          : {}),
        ...(duongDanMoi !== undefined
          ? { duong_dan: duongDanMoi }
          : {}),
        ...(dto.moTa !== undefined
          ? { mo_ta: dto.moTa }
          : {}),
        ...(dto.thuTu !== undefined
          ? { thu_tu: dto.thuTu }
          : {}),
        ...(dto.trangThai !== undefined
          ? { trang_thai: dto.trangThai }
          : {}),
      },
    });

    await this.nhatKy.ghiNhan({
      taiKhoanId: nguoiDung.taiKhoanId,
      hanhDong: 'CAP_NHAT_DANH_MUC_MON',
      doiTuong: 'DANH_MUC_MON',
      doiTuongId: id,
      duLieuCu: cu,
      duLieuMoi: row,
      maYeuCau,
    });

    return row;
  }

  async xoa(
    id: string,
    nguoiDung: NguoiDungXacThuc,
    maYeuCau?: string | null,
  ) {
    const cu = await this.chiTiet(id);
    const danhMucId = bigintTuChuoi(id, 'ID danh mục món');

    const soMon = await this.prisma.mon_an.count({
      where: {
        danh_muc_id: danhMucId,
        ngay_xoa: null,
      },
    });

    if (soMon > 0) {
      throw new LoiNghiepVuException(
        'DANH_MUC_MON_003',
        'Danh mục vẫn còn món ăn. Hãy chuyển hoặc xóa món trước.',
        HttpStatus.CONFLICT,
      );
    }

    await this.prisma.danh_muc_mon.update({
      where: { id: danhMucId },
      data: {
        ngay_xoa: new Date(),
        trang_thai: 'NGUNG_HOAT_DONG',
      },
    });

    await this.nhatKy.ghiNhan({
      taiKhoanId: nguoiDung.taiKhoanId,
      hanhDong: 'XOA_DANH_MUC_MON',
      doiTuong: 'DANH_MUC_MON',
      doiTuongId: id,
      duLieuCu: cu,
      maYeuCau,
    });

    return { daXoa: true };
  }

  private async damBaoKhongTrung(
    maDanhMuc: string,
    duongDan: string,
  ): Promise<void> {
    const trung = await this.prisma.danh_muc_mon.findFirst({
      where: {
        OR: [
          { ma_danh_muc: maDanhMuc },
          { duong_dan: duongDan },
        ],
      },
      select: { id: true },
    });

    if (trung) {
      throw new LoiNghiepVuException(
        'DANH_MUC_MON_002',
        'Mã hoặc đường dẫn danh mục đã tồn tại.',
        HttpStatus.CONFLICT,
      );
    }
  }
}
