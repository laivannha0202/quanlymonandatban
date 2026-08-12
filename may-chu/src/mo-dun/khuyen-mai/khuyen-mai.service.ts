import { HttpStatus, Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../co-so-du-lieu/prisma.service';
import { LoiNghiepVuException } from '../../dung-chung/exception/loi-nghiep-vu.exception';
import { bigintTuChuoi } from '../../dung-chung/tien-ich/id';
import type { NguoiDungXacThuc } from '../../dung-chung/types/nguoi-dung-xac-thuc.type';
import { NhatKyService } from '../nhat-ky/nhat-ky.service';
import { CapNhatKhuyenMaiDto } from './dto/cap-nhat-khuyen-mai.dto';
import { DanhSachKhuyenMaiDto } from './dto/danh-sach-khuyen-mai.dto';
import { TaoKhuyenMaiDto } from './dto/tao-khuyen-mai.dto';

type GiaTriSo = number | string | { toString(): string };

type KhuyenMaiRow = {
  id: bigint;
  ma_khuyen_mai: string;
  ten_khuyen_mai: string;
  mo_ta: string | null;
  loai_giam: string;
  gia_tri: GiaTriSo;
  gia_tri_don_toi_thieu: GiaTriSo | null;
  giam_toi_da: GiaTriSo | null;
  ngay_bat_dau: Date;
  ngay_ket_thuc: Date;
  so_luot_toi_da: number | null;
  so_luot_da_dung: number;
  trang_thai: string;
  ngay_tao: Date;
  ngay_cap_nhat: Date;
  ngay_xoa: Date | null;
};

@Injectable()
export class KhuyenMaiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly nhatKy: NhatKyService,
  ) {}

  async dangApDung() {
    const hienTai = new Date();

    const rows = await this.prisma.khuyen_mai.findMany({
      where: {
        ngay_xoa: null,
        trang_thai: 'HOAT_DONG',
        ngay_bat_dau: { lte: hienTai },
        ngay_ket_thuc: { gte: hienTai },
      },
      orderBy: [
        { ngay_ket_thuc: 'asc' },
        { ten_khuyen_mai: 'asc' },
      ],
    });

    return rows
      .filter(
        (row) =>
          row.so_luot_toi_da == null ||
          row.so_luot_da_dung < row.so_luot_toi_da,
      )
      .map((row) => this.toView(row as KhuyenMaiRow));
  }

  async danhSach(dto: DanhSachKhuyenMaiDto) {
    const tuKhoa = dto.tuKhoa?.trim();

    const where: Prisma.khuyen_maiWhereInput = {
      ngay_xoa: null,
      ...(dto.trangThai
        ? { trang_thai: dto.trangThai }
        : {}),
      ...(tuKhoa
        ? {
            OR: [
              { ma_khuyen_mai: { contains: tuKhoa } },
              { ten_khuyen_mai: { contains: tuKhoa } },
            ],
          }
        : {}),
    };

    const skip = (dto.trang - 1) * dto.kichThuoc;

    const [rows, tong] = await Promise.all([
      this.prisma.khuyen_mai.findMany({
        where,
        orderBy: { ngay_tao: 'desc' },
        skip,
        take: dto.kichThuoc,
      }),
      this.prisma.khuyen_mai.count({ where }),
    ]);

    return {
      danhSach: rows.map((row) =>
        this.toView(row as KhuyenMaiRow),
      ),
      phanTrang: {
        trang: dto.trang,
        kichThuoc: dto.kichThuoc,
        tong,
        tongTrang: Math.ceil(tong / dto.kichThuoc),
      },
    };
  }

  async chiTiet(id: string) {
    const row = await this.prisma.khuyen_mai.findFirst({
      where: {
        id: bigintTuChuoi(id, 'ID khuyến mãi'),
        ngay_xoa: null,
      },
    });

    if (!row) {
      throw new LoiNghiepVuException(
        'KHUYEN_MAI_001',
        'Không tìm thấy khuyến mãi.',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.toView(row as KhuyenMaiRow);
  }

  async tao(
    dto: TaoKhuyenMaiDto,
    nguoiDung: NguoiDungXacThuc,
    maYeuCau?: string | null,
  ) {
    this.kiemTra(
      dto.loaiGiam,
      dto.giaTri,
      dto.ngayBatDau,
      dto.ngayKetThuc,
      dto.giamToiDa ?? null,
    );

    await this.damBaoMaKhongTrung(dto.maKhuyenMai);

    const row = await this.prisma.khuyen_mai.create({
      data: {
        ma_khuyen_mai: dto.maKhuyenMai,
        ten_khuyen_mai: dto.tenKhuyenMai,
        mo_ta: dto.moTa ?? null,
        loai_giam: dto.loaiGiam,
        gia_tri: dto.giaTri,
        gia_tri_don_toi_thieu:
          dto.giaTriDonToiThieu ?? null,
        giam_toi_da:
          dto.loaiGiam === 'PHAN_TRAM'
            ? dto.giamToiDa ?? null
            : null,
        ngay_bat_dau: new Date(dto.ngayBatDau),
        ngay_ket_thuc: new Date(dto.ngayKetThuc),
        so_luot_toi_da: dto.soLuotToiDa ?? null,
        trang_thai: dto.trangThai ?? 'HOAT_DONG',
      },
    });

    const moi = this.toView(row as KhuyenMaiRow);

    await this.nhatKy.ghiNhan({
      taiKhoanId: nguoiDung.taiKhoanId,
      hanhDong: 'TAO_KHUYEN_MAI',
      doiTuong: 'KHUYEN_MAI',
      doiTuongId: row.id.toString(),
      duLieuMoi: moi,
      maYeuCau,
    });

    return moi;
  }

  async capNhat(
    id: string,
    dto: CapNhatKhuyenMaiDto,
    nguoiDung: NguoiDungXacThuc,
    maYeuCau?: string | null,
  ) {
    const cu = await this.chiTiet(id);
    const khuyenMaiId = bigintTuChuoi(
      id,
      'ID khuyến mãi',
    );

    if (
      dto.maKhuyenMai !== undefined &&
      dto.maKhuyenMai !== cu.ma_khuyen_mai
    ) {
      throw new LoiNghiepVuException(
        'KHUYEN_MAI_005',
        'Mã khuyến mãi được cố định sau khi tạo và không thể thay đổi.',
        HttpStatus.CONFLICT,
      );
    }

    const loaiMoi = dto.loaiGiam ?? cu.loai_giam;
    const giaTriMoi = dto.giaTri ?? cu.gia_tri;
    const ngayBatDauMoi =
      dto.ngayBatDau ?? cu.ngay_bat_dau.toISOString();
    const ngayKetThucMoi =
      dto.ngayKetThuc ?? cu.ngay_ket_thuc.toISOString();

    if (
      loaiMoi === 'SO_TIEN' &&
      dto.giamToiDa != null
    ) {
      throw new LoiNghiepVuException(
        'KHUYEN_MAI_004',
        'Khuyến mãi giảm số tiền không sử dụng trường giảm tối đa.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const giamToiDaMoi =
      loaiMoi === 'SO_TIEN'
        ? null
        : dto.giamToiDa !== undefined
          ? dto.giamToiDa
          : cu.giam_toi_da;

    this.kiemTra(
      loaiMoi,
      giaTriMoi,
      ngayBatDauMoi,
      ngayKetThucMoi,
      giamToiDaMoi,
    );

    if (
      dto.soLuotToiDa !== undefined &&
      dto.soLuotToiDa < cu.so_luot_da_dung
    ) {
      throw new LoiNghiepVuException(
        'KHUYEN_MAI_006',
        'Số lượt tối đa không được nhỏ hơn số lượt đã sử dụng.',
        HttpStatus.CONFLICT,
      );
    }

    const row = await this.prisma.khuyen_mai.update({
      where: { id: khuyenMaiId },
      data: {
        ...(dto.tenKhuyenMai !== undefined
          ? { ten_khuyen_mai: dto.tenKhuyenMai }
          : {}),
        ...(dto.moTa !== undefined
          ? { mo_ta: dto.moTa }
          : {}),
        ...(dto.loaiGiam !== undefined
          ? { loai_giam: dto.loaiGiam }
          : {}),
        ...(dto.giaTri !== undefined
          ? { gia_tri: dto.giaTri }
          : {}),
        ...(dto.giaTriDonToiThieu !== undefined
          ? {
              gia_tri_don_toi_thieu:
                dto.giaTriDonToiThieu,
            }
          : {}),
        ...(dto.loaiGiam === 'SO_TIEN'
          ? { giam_toi_da: null }
          : dto.giamToiDa !== undefined
            ? { giam_toi_da: dto.giamToiDa }
            : {}),
        ...(dto.ngayBatDau !== undefined
          ? { ngay_bat_dau: new Date(dto.ngayBatDau) }
          : {}),
        ...(dto.ngayKetThuc !== undefined
          ? { ngay_ket_thuc: new Date(dto.ngayKetThuc) }
          : {}),
        ...(dto.soLuotToiDa !== undefined
          ? { so_luot_toi_da: dto.soLuotToiDa }
          : {}),
        ...(dto.trangThai !== undefined
          ? { trang_thai: dto.trangThai }
          : {}),
      },
    });

    const moi = this.toView(row as KhuyenMaiRow);

    await this.nhatKy.ghiNhan({
      taiKhoanId: nguoiDung.taiKhoanId,
      hanhDong: 'CAP_NHAT_KHUYEN_MAI',
      doiTuong: 'KHUYEN_MAI',
      doiTuongId: id,
      duLieuCu: cu,
      duLieuMoi: moi,
      maYeuCau,
    });

    return moi;
  }

  async xoa(
    id: string,
    nguoiDung: NguoiDungXacThuc,
    maYeuCau?: string | null,
  ) {
    const cu = await this.chiTiet(id);
    const khuyenMaiId = bigintTuChuoi(
      id,
      'ID khuyến mãi',
    );

    await this.prisma.khuyen_mai.update({
      where: { id: khuyenMaiId },
      data: {
        ngay_xoa: new Date(),
        trang_thai: 'NGUNG_HOAT_DONG',
      },
    });

    await this.nhatKy.ghiNhan({
      taiKhoanId: nguoiDung.taiKhoanId,
      hanhDong: 'XOA_KHUYEN_MAI',
      doiTuong: 'KHUYEN_MAI',
      doiTuongId: id,
      duLieuCu: cu,
      maYeuCau,
    });

    return { daXoa: true };
  }

  private async damBaoMaKhongTrung(
    maKhuyenMai: string,
  ): Promise<void> {
    const trung = await this.prisma.khuyen_mai.findUnique({
      where: {
        ma_khuyen_mai: maKhuyenMai,
      },
      select: {
        id: true,
      },
    });

    if (trung) {
      throw new LoiNghiepVuException(
        'KHUYEN_MAI_002',
        'Mã khuyến mãi đã tồn tại.',
        HttpStatus.CONFLICT,
      );
    }
  }

  private kiemTra(
    loai: string,
    giaTri: number,
    batDau: string,
    ketThuc: string,
    giamToiDa?: number | null,
  ): void {
    const bd = new Date(batDau).getTime();
    const kt = new Date(ketThuc).getTime();

    if (
      !Number.isFinite(bd) ||
      !Number.isFinite(kt) ||
      kt <= bd
    ) {
      throw new LoiNghiepVuException(
        'KHUYEN_MAI_003',
        'Thời gian khuyến mãi không hợp lệ.',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      loai === 'PHAN_TRAM' &&
      (giaTri <= 0 || giaTri > 100)
    ) {
      throw new LoiNghiepVuException(
        'KHUYEN_MAI_004',
        'Khuyến mãi phần trăm phải lớn hơn 0 và không quá 100.',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      loai === 'SO_TIEN' &&
      giaTri <= 0
    ) {
      throw new LoiNghiepVuException(
        'KHUYEN_MAI_004',
        'Số tiền giảm phải lớn hơn 0.',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      loai === 'SO_TIEN' &&
      giamToiDa != null
    ) {
      throw new LoiNghiepVuException(
        'KHUYEN_MAI_004',
        'Khuyến mãi giảm số tiền không sử dụng trường giảm tối đa.',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      loai === 'PHAN_TRAM' &&
      giamToiDa != null &&
      giamToiDa <= 0
    ) {
      throw new LoiNghiepVuException(
        'KHUYEN_MAI_004',
        'Giảm tối đa phải lớn hơn 0 khi được khai báo.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private toView(row: KhuyenMaiRow) {
    const {
      ngay_xoa: _ngayXoa,
      ...duLieu
    } = row;

    return {
      ...duLieu,
      gia_tri: Number(row.gia_tri),
      gia_tri_don_toi_thieu:
        row.gia_tri_don_toi_thieu == null
          ? null
          : Number(row.gia_tri_don_toi_thieu),
      giam_toi_da:
        row.giam_toi_da == null
          ? null
          : Number(row.giam_toi_da),
    };
  }
}
