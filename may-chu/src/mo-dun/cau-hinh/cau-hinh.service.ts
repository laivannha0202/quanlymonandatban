import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../co-so-du-lieu/prisma.service';
import { LoiNghiepVuException } from '../../dung-chung/exception/loi-nghiep-vu.exception';
import { CapNhatCauHinhDto } from './dto/cap-nhat-cau-hinh.dto';

@Injectable()
export class CauHinhService {
  private boNhoDem = new Map<string, { giaTri: string; hetHan: number }>();
  private readonly thoiGianDemMs = 30_000;

  constructor(private readonly prisma: PrismaService) {}

  async danhSach(nhom?: string) {
    return this.prisma.cau_hinh.findMany({
      where: nhom ? { nhom } : undefined,
      orderBy: [{ nhom: 'asc' }, { khoa: 'asc' }],
    });
  }

  async layChuoi(khoa: string): Promise<string> {
    const trongBoNho = this.boNhoDem.get(khoa);
    if (trongBoNho && trongBoNho.hetHan > Date.now()) {
      return trongBoNho.giaTri;
    }

    const cauHinh = await this.prisma.cau_hinh.findUnique({ where: { khoa } });
    if (!cauHinh) {
      throw new LoiNghiepVuException(
        'CAU_HINH_001',
        `Không tìm thấy cấu hình ${khoa}.`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    this.boNhoDem.set(khoa, {
      giaTri: cauHinh.gia_tri,
      hetHan: Date.now() + this.thoiGianDemMs,
    });

    return cauHinh.gia_tri;
  }

  async laySo(khoa: string): Promise<number> {
    const giaTri = Number(await this.layChuoi(khoa));
    if (!Number.isFinite(giaTri)) {
      throw new LoiNghiepVuException(
        'CAU_HINH_002',
        `Cấu hình ${khoa} không phải kiểu số hợp lệ.`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return giaTri;
  }

  async layBoolean(khoa: string): Promise<boolean> {
    const giaTri = (await this.layChuoi(khoa)).trim().toLowerCase();
    if (!['true', 'false'].includes(giaTri)) {
      throw new LoiNghiepVuException(
        'CAU_HINH_003',
        `Cấu hình ${khoa} không phải boolean hợp lệ.`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return giaTri === 'true';
  }

  async capNhat(dto: CapNhatCauHinhDto) {
    const cacKhoa = [...new Set(dto.danhSach.map((item) => item.khoa))];
    const hienTai = await this.prisma.cau_hinh.findMany({
      where: { khoa: { in: cacKhoa } },
    });

    if (hienTai.length !== cacKhoa.length) {
      const co = new Set(hienTai.map((item) => item.khoa));
      const thieu = cacKhoa.filter((khoa) => !co.has(khoa));
      throw new LoiNghiepVuException(
        'CAU_HINH_004',
        `Không tồn tại cấu hình: ${thieu.join(', ')}.`,
        HttpStatus.NOT_FOUND,
      );
    }

    const mapHienTai = new Map(hienTai.map((item) => [item.khoa, item]));
    for (const item of dto.danhSach) {
      const cauHinh = mapHienTai.get(item.khoa)!;
      if (!cauHinh.cho_phep_sua) {
        throw new LoiNghiepVuException(
          'CAU_HINH_005',
          `Cấu hình ${item.khoa} không cho phép sửa.`,
          HttpStatus.FORBIDDEN,
        );
      }
      this.kiemTraKieuDuLieu(cauHinh.kieu_du_lieu, item.giaTri, item.khoa);
    }

    await this.prisma.$transaction(
      dto.danhSach.map((item) =>
        this.prisma.cau_hinh.update({
          where: { khoa: item.khoa },
          data: { gia_tri: item.giaTri },
        }),
      ),
    );

    this.boNhoDem.clear();
    return this.danhSach();
  }

  xoaBoNhoDem(): void {
    this.boNhoDem.clear();
  }

  private kiemTraKieuDuLieu(kieu: string, giaTri: string, khoa: string): void {
    if (kieu === 'SO' && !Number.isFinite(Number(giaTri))) {
      throw new LoiNghiepVuException('CAU_HINH_006', `${khoa} phải là số.`);
    }

    if (kieu === 'BOOLEAN' && !['true', 'false'].includes(giaTri.toLowerCase())) {
      throw new LoiNghiepVuException('CAU_HINH_007', `${khoa} phải là true hoặc false.`);
    }

    if (kieu === 'JSON') {
      try {
        JSON.parse(giaTri);
      } catch {
        throw new LoiNghiepVuException('CAU_HINH_008', `${khoa} phải là JSON hợp lệ.`);
      }
    }
  }
}
