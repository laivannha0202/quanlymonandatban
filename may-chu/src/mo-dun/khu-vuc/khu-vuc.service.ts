import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../co-so-du-lieu/prisma.service';
import { LoiNghiepVuException } from '../../dung-chung/exception/loi-nghiep-vu.exception';
import { bigintTuChuoi } from '../../dung-chung/tien-ich/id';
import { hienTaiWallClockVietNam } from '../../dung-chung/tien-ich/ngay-gio';
import { CapNhatKhuVucDto } from './dto/cap-nhat-khu-vuc.dto';
import { TaoKhuVucDto } from './dto/tao-khu-vuc.dto';

@Injectable()
export class KhuVucService {
  constructor(private readonly prisma: PrismaService) {}

  danhSachCongKhai() {
    return this.prisma.khu_vuc.findMany({
      where: { ngay_xoa: null, trang_thai: 'HOAT_DONG' },
      orderBy: [{ thu_tu: 'asc' }, { ten_khu_vuc: 'asc' }],
      select: {
        id: true,
        ma_khu_vuc: true,
        ten_khu_vuc: true,
        mo_ta: true,
        hinh_anh: true,
        thu_tu: true,
      },
    });
  }

  danhSachQuanTri(tuKhoa?: string, trangThai?: string) {
    return this.prisma.khu_vuc.findMany({
      where: {
        ngay_xoa: null,
        ...(trangThai ? { trang_thai: trangThai } : {}),
        ...(tuKhoa
          ? {
              OR: [
                { ma_khu_vuc: { contains: tuKhoa } },
                { ten_khu_vuc: { contains: tuKhoa } },
              ],
            }
          : {}),
      },
      orderBy: [{ thu_tu: 'asc' }, { ten_khu_vuc: 'asc' }],
    });
  }

  async chiTiet(id: string) {
    const khuVuc = await this.prisma.khu_vuc.findFirst({
      where: { id: bigintTuChuoi(id, 'ID khu vực'), ngay_xoa: null },
    });
    if (!khuVuc) {
      throw new LoiNghiepVuException('KHU_VUC_001', 'Không tìm thấy khu vực.', HttpStatus.NOT_FOUND);
    }
    return khuVuc;
  }

  async tao(dto: TaoKhuVucDto) {
    const trung = await this.prisma.khu_vuc.findUnique({ where: { ma_khu_vuc: dto.maKhuVuc } });
    if (trung) {
      throw new LoiNghiepVuException('KHU_VUC_002', 'Mã khu vực đã tồn tại.', HttpStatus.CONFLICT);
    }

    return this.prisma.khu_vuc.create({
      data: {
        ma_khu_vuc: dto.maKhuVuc,
        ten_khu_vuc: dto.tenKhuVuc,
        mo_ta: dto.moTa,
        hinh_anh: dto.hinhAnh,
        thu_tu: dto.thuTu ?? 0,
        trang_thai: dto.trangThai ?? 'HOAT_DONG',
      },
    });
  }

  async capNhat(id: string, dto: CapNhatKhuVucDto) {
    const hienTai = await this.chiTiet(id);

    if (
      dto.maKhuVuc !== undefined &&
      dto.maKhuVuc !== hienTai.ma_khu_vuc
    ) {
      throw new LoiNghiepVuException(
        'KHU_VUC_004',
        'Mã khu vực được cố định sau khi tạo và không thể thay đổi.',
        HttpStatus.CONFLICT,
      );
    }

    const dangNgungHoatDong =
      dto.trangThai === 'NGUNG_HOAT_DONG' &&
      hienTai.trang_thai !== 'NGUNG_HOAT_DONG';

    if (dangNgungHoatDong) {
      await this.kiemTraKhongConLichDatHieuLuc(hienTai.id);
    }

    return this.prisma.khu_vuc.update({
      where: { id: hienTai.id },
      data: {
        ...(dto.maKhuVuc !== undefined ? { ma_khu_vuc: dto.maKhuVuc } : {}),
        ...(dto.tenKhuVuc !== undefined ? { ten_khu_vuc: dto.tenKhuVuc } : {}),
        ...(dto.moTa !== undefined ? { mo_ta: dto.moTa } : {}),
        ...(dto.hinhAnh !== undefined ? { hinh_anh: dto.hinhAnh } : {}),
        ...(dto.thuTu !== undefined ? { thu_tu: dto.thuTu } : {}),
        ...(dto.trangThai !== undefined ? { trang_thai: dto.trangThai } : {}),
      },
    });
  }

  async xoa(id: string) {
    const khuVuc = await this.chiTiet(id);

    await this.kiemTraKhongConLichDatHieuLuc(khuVuc.id);

    const soBan = await this.prisma.ban_an.count({
      where: { khu_vuc_id: khuVuc.id, ngay_xoa: null },
    });
    if (soBan > 0) {
      throw new LoiNghiepVuException(
        'KHU_VUC_003',
        'Khu vực đang có bàn. Hãy di chuyển hoặc ngừng sử dụng các bàn trước.',
        HttpStatus.CONFLICT,
      );
    }

    await this.prisma.khu_vuc.update({
      where: { id: khuVuc.id },
      data: { ngay_xoa: new Date(), trang_thai: 'NGUNG_HOAT_DONG' },
    });
    return { daXoa: true };
  }

  private async kiemTraKhongConLichDatHieuLuc(
    khuVucId: bigint,
  ): Promise<void> {
    const soLichConHieuLuc = await this.prisma.dat_ban.count({
      where: {
        khu_vuc_id: khuVucId,
        trang_thai: {
          in: ['CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DA_CHECK_IN'],
        },
        gio_ket_thuc: {
          gt: hienTaiWallClockVietNam(),
        },
      },
    });

    if (soLichConHieuLuc > 0) {
      throw new LoiNghiepVuException(
        'KHU_VUC_005',
        'Khu vực đang có lịch đặt còn hiệu lực nên chưa thể ngừng hoạt động hoặc xóa.',
        HttpStatus.CONFLICT,
      );
    }
  }
}
