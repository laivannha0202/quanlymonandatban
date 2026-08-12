import { HttpStatus, Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../co-so-du-lieu/prisma.service';
import { LoiNghiepVuException } from '../../dung-chung/exception/loi-nghiep-vu.exception';
import { taoDuongDan } from '../../dung-chung/tien-ich/duong-dan';
import { bigintTuChuoi } from '../../dung-chung/tien-ich/id';
import type { NguoiDungXacThuc } from '../../dung-chung/types/nguoi-dung-xac-thuc.type';
import { NhatKyService } from '../nhat-ky/nhat-ky.service';
import { CapNhatHinhAnhMonDto } from './dto/cap-nhat-hinh-anh-mon.dto';
import { CapNhatMonAnDto } from './dto/cap-nhat-mon-an.dto';
import { DanhSachMonAnDto } from './dto/danh-sach-mon-an.dto';
import { TaoHinhAnhMonDto } from './dto/tao-hinh-anh-mon.dto';
import { TaoMonAnDto } from './dto/tao-mon-an.dto';

type GiaTriSo = number | string | { toString(): string };

type MonAnPrismaView = {
  id: bigint;
  ma_mon: string;
  danh_muc_id: bigint;
  ten_mon: string;
  duong_dan: string;
  mo_ta: string | null;
  gia: GiaTriSo;
  gia_khuyen_mai: GiaTriSo | null;
  hinh_anh_chinh: string | null;
  la_mon_noi_bat: boolean;
  con_mon: boolean;
  trang_thai: string;
  ngay_tao: Date;
  ngay_cap_nhat: Date;
  danh_muc_mon: {
    ten_danh_muc: string;
    duong_dan: string;
  };
};

@Injectable()
export class MonAnService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly nhatKy: NhatKyService,
  ) {}

  async danhSachCongKhai(dto: DanhSachMonAnDto) {
    return this.danhSachNoiBo(dto, true);
  }

  async danhSachQuanTri(dto: DanhSachMonAnDto) {
    return this.danhSachNoiBo(dto, false);
  }

  private async danhSachNoiBo(
    dto: DanhSachMonAnDto,
    congKhai: boolean,
  ) {
    const tuKhoa = dto.tuKhoa?.trim();

    const where = {
      ngay_xoa: null,
      danh_muc_mon: {
        ngay_xoa: null,
        ...(congKhai ? { trang_thai: 'HOAT_DONG' } : {}),
      },
      ...(congKhai
        ? { trang_thai: 'HOAT_DONG' }
        : dto.trangThai
          ? { trang_thai: dto.trangThai }
          : {}),
      ...(dto.danhMucId
        ? {
            danh_muc_id: bigintTuChuoi(
              dto.danhMucId,
              'ID danh mục món',
            ),
          }
        : {}),
      ...(dto.conMon !== undefined
        ? { con_mon: dto.conMon === 'true' }
        : {}),
      ...(dto.noiBat !== undefined
        ? { la_mon_noi_bat: dto.noiBat === 'true' }
        : {}),
      ...(tuKhoa
        ? {
            OR: [
              { ten_mon: { contains: tuKhoa } },
              { ma_mon: { contains: tuKhoa } },
              { mo_ta: { contains: tuKhoa } },
            ],
          }
        : {}),
    };

    const skip = (dto.trang - 1) * dto.kichThuoc;

    const [rows, tong] = await Promise.all([
      this.prisma.mon_an.findMany({
        where,
        orderBy: [
          { la_mon_noi_bat: 'desc' },
          { ten_mon: 'asc' },
        ],
        skip,
        take: dto.kichThuoc,
        select: {
          id: true,
          ma_mon: true,
          danh_muc_id: true,
          ten_mon: true,
          duong_dan: true,
          mo_ta: true,
          gia: true,
          gia_khuyen_mai: true,
          hinh_anh_chinh: true,
          la_mon_noi_bat: true,
          con_mon: true,
          trang_thai: true,
          ngay_tao: true,
          ngay_cap_nhat: true,
          danh_muc_mon: {
            select: {
              ten_danh_muc: true,
              duong_dan: true,
            },
          },
        },
      }),
      this.prisma.mon_an.count({ where }),
    ]);

    return {
      danhSach: rows.map((row) => this.toView(row)),
      phanTrang: {
        trang: dto.trang,
        kichThuoc: dto.kichThuoc,
        tong,
        tongTrang: Math.ceil(tong / dto.kichThuoc),
      },
    };
  }

  async chiTietQuanTri(id: string) {
    return this.chiTietNoiBo(
      {
        id: bigintTuChuoi(id, 'ID món ăn'),
      },
      false,
    );
  }

  async chiTietCongKhai(duongDan: string) {
    return this.chiTietNoiBo(
      {
        duong_dan: duongDan,
      },
      true,
    );
  }

  private async chiTietNoiBo(
    dinhDanh: { id?: bigint; duong_dan?: string },
    congKhai: boolean,
  ) {
    const row = await this.prisma.mon_an.findFirst({
      where: {
        ...dinhDanh,
        ngay_xoa: null,
        ...(congKhai ? { trang_thai: 'HOAT_DONG' } : {}),
        danh_muc_mon: {
          ngay_xoa: null,
          ...(congKhai ? { trang_thai: 'HOAT_DONG' } : {}),
        },
      },
      select: {
        id: true,
        ma_mon: true,
        danh_muc_id: true,
        ten_mon: true,
        duong_dan: true,
        mo_ta: true,
        gia: true,
        gia_khuyen_mai: true,
        hinh_anh_chinh: true,
        la_mon_noi_bat: true,
        con_mon: true,
        trang_thai: true,
        ngay_tao: true,
        ngay_cap_nhat: true,
        danh_muc_mon: {
          select: {
            ten_danh_muc: true,
            duong_dan: true,
          },
        },
        hinh_anh_mon: {
          orderBy: [
            { la_anh_chinh: 'desc' },
            { thu_tu: 'asc' },
            { id: 'asc' },
          ],
        },
      },
    });

    if (!row) {
      throw new LoiNghiepVuException(
        'MON_AN_001',
        'Không tìm thấy món ăn.',
        HttpStatus.NOT_FOUND,
      );
    }

    const { hinh_anh_mon: hinhAnh, ...monAn } = row;

    return {
      ...this.toView(monAn),
      hinhAnh,
    };
  }

  async tao(
    dto: TaoMonAnDto,
    nguoiDung: NguoiDungXacThuc,
    maYeuCau?: string | null,
  ) {
    const danhMucId = bigintTuChuoi(
      dto.danhMucId,
      'ID danh mục món',
    );

    await this.damBaoDanhMucHoatDong(danhMucId);
    this.kiemTraGia(dto.gia, dto.giaKhuyenMai);

    const duongDan =
      dto.duongDan?.trim() ||
      taoDuongDan(dto.tenMon);

    await this.damBaoKhongTrung(dto.maMon, duongDan);

    const row = await this.prisma.mon_an.create({
      data: {
        ma_mon: dto.maMon,
        danh_muc_id: danhMucId,
        ten_mon: dto.tenMon,
        duong_dan: duongDan,
        mo_ta: dto.moTa ?? null,
        gia: dto.gia,
        gia_khuyen_mai: dto.giaKhuyenMai ?? null,
        hinh_anh_chinh: dto.hinhAnhChinh ?? null,
        la_mon_noi_bat: dto.laMonNoiBat ?? false,
        con_mon: dto.conMon !== false,
        trang_thai: dto.trangThai ?? 'HOAT_DONG',
      },
      select: {
        id: true,
      },
    });

    const moi = await this.chiTietQuanTri(row.id.toString());

    await this.nhatKy.ghiNhan({
      taiKhoanId: nguoiDung.taiKhoanId,
      hanhDong: 'TAO_MON_AN',
      doiTuong: 'MON_AN',
      doiTuongId: row.id.toString(),
      duLieuMoi: moi,
      maYeuCau,
    });

    return moi;
  }

  async capNhat(
    id: string,
    dto: CapNhatMonAnDto,
    nguoiDung: NguoiDungXacThuc,
    maYeuCau?: string | null,
  ) {
    const cu = await this.chiTietQuanTri(id);
    const monAnId = bigintTuChuoi(id, 'ID món ăn');

    if (
      dto.maMon !== undefined &&
      dto.maMon !== cu.ma_mon
    ) {
      throw new LoiNghiepVuException(
        'MON_AN_005',
        'Mã món được cố định sau khi tạo và không thể thay đổi.',
        HttpStatus.CONFLICT,
      );
    }

    const duongDanMoi =
      dto.duongDan !== undefined
        ? dto.duongDan.trim() ||
          taoDuongDan(dto.tenMon ?? cu.ten_mon)
        : undefined;

    if (
      duongDanMoi !== undefined &&
      duongDanMoi !== cu.duong_dan
    ) {
      throw new LoiNghiepVuException(
        'MON_AN_006',
        'Đường dẫn món được cố định sau khi tạo để không làm hỏng liên kết công khai.',
        HttpStatus.CONFLICT,
      );
    }

    let danhMucIdMoi: bigint | undefined;
    if (dto.danhMucId !== undefined) {
      danhMucIdMoi = bigintTuChuoi(
        dto.danhMucId,
        'ID danh mục món',
      );

      if (danhMucIdMoi !== cu.danh_muc_id) {
        await this.damBaoDanhMucHoatDong(danhMucIdMoi);
      }
    }

    const giaKhuyenMaiNhap =
      dto.giaKhuyenMai as number | null | undefined;

    const giaMoi =
      dto.gia ?? Number(cu.gia);

    const giaKhuyenMaiMoi =
      giaKhuyenMaiNhap !== undefined
        ? giaKhuyenMaiNhap
        : cu.gia_khuyen_mai == null
          ? null
          : Number(cu.gia_khuyen_mai);

    this.kiemTraGia(giaMoi, giaKhuyenMaiMoi);

    await this.prisma.mon_an.update({
      where: {
        id: monAnId,
      },
      data: {
        ...(danhMucIdMoi !== undefined
          ? { danh_muc_id: danhMucIdMoi }
          : {}),
        ...(dto.tenMon !== undefined
          ? { ten_mon: dto.tenMon }
          : {}),
        ...(dto.moTa !== undefined
          ? { mo_ta: dto.moTa }
          : {}),
        ...(dto.gia !== undefined
          ? { gia: dto.gia }
          : {}),
        ...(giaKhuyenMaiNhap !== undefined
          ? { gia_khuyen_mai: giaKhuyenMaiNhap }
          : {}),
        ...(dto.hinhAnhChinh !== undefined
          ? { hinh_anh_chinh: dto.hinhAnhChinh }
          : {}),
        ...(dto.laMonNoiBat !== undefined
          ? { la_mon_noi_bat: dto.laMonNoiBat }
          : {}),
        ...(dto.conMon !== undefined
          ? { con_mon: dto.conMon }
          : {}),
        ...(dto.trangThai !== undefined
          ? { trang_thai: dto.trangThai }
          : {}),
      },
    });

    const moi = await this.chiTietQuanTri(id);

    await this.nhatKy.ghiNhan({
      taiKhoanId: nguoiDung.taiKhoanId,
      hanhDong: 'CAP_NHAT_MON_AN',
      doiTuong: 'MON_AN',
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
    const cu = await this.chiTietQuanTri(id);
    const monAnId = bigintTuChuoi(id, 'ID món ăn');

    await this.prisma.mon_an.update({
      where: {
        id: monAnId,
      },
      data: {
        ngay_xoa: new Date(),
        trang_thai: 'NGUNG_HOAT_DONG',
        con_mon: false,
      },
    });

    await this.nhatKy.ghiNhan({
      taiKhoanId: nguoiDung.taiKhoanId,
      hanhDong: 'XOA_MON_AN',
      doiTuong: 'MON_AN',
      doiTuongId: id,
      duLieuCu: cu,
      maYeuCau,
    });

    return { daXoa: true };
  }

  async themHinhAnh(
    monAnIdChuoi: string,
    dto: TaoHinhAnhMonDto,
    nguoiDung: NguoiDungXacThuc,
    maYeuCau?: string | null,
  ) {
    await this.chiTietQuanTri(monAnIdChuoi);

    const monAnId = bigintTuChuoi(
      monAnIdChuoi,
      'ID món ăn',
    );

    const hinh = await this.prisma.$transaction(
      async (tx) => {
        if (dto.laAnhChinh) {
          await tx.hinh_anh_mon.updateMany({
            where: {
              mon_an_id: monAnId,
            },
            data: {
              la_anh_chinh: false,
            },
          });
        }

        const moi = await tx.hinh_anh_mon.create({
          data: {
            mon_an_id: monAnId,
            duong_dan_anh: dto.duongDanAnh,
            alt_text: dto.altText ?? null,
            thu_tu: dto.thuTu ?? 0,
            la_anh_chinh: dto.laAnhChinh ?? false,
          },
        });

        if (dto.laAnhChinh) {
          await tx.mon_an.update({
            where: {
              id: monAnId,
            },
            data: {
              hinh_anh_chinh: dto.duongDanAnh,
            },
          });
        }

        return moi;
      },
    );

    await this.nhatKy.ghiNhan({
      taiKhoanId: nguoiDung.taiKhoanId,
      hanhDong: 'THEM_HINH_ANH_MON',
      doiTuong: 'HINH_ANH_MON',
      doiTuongId: hinh.id.toString(),
      duLieuMoi: dto,
      maYeuCau,
    });

    return this.chiTietQuanTri(monAnIdChuoi);
  }

  async capNhatHinhAnh(
    monAnIdChuoi: string,
    hinhIdChuoi: string,
    dto: CapNhatHinhAnhMonDto,
    nguoiDung: NguoiDungXacThuc,
    maYeuCau?: string | null,
  ) {
    const monAnId = bigintTuChuoi(
      monAnIdChuoi,
      'ID món ăn',
    );
    const hinhId = bigintTuChuoi(
      hinhIdChuoi,
      'ID hình ảnh',
    );

    await this.chiTietQuanTri(monAnIdChuoi);

    const hienTai = await this.prisma.hinh_anh_mon.findFirst({
      where: {
        id: hinhId,
        mon_an_id: monAnId,
      },
    });

    if (!hienTai) {
      throw new LoiNghiepVuException(
        'MON_AN_003',
        'Không tìm thấy hình ảnh món.',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      if (dto.laAnhChinh === true) {
        await tx.hinh_anh_mon.updateMany({
          where: {
            mon_an_id: monAnId,
            id: {
              not: hinhId,
            },
          },
          data: {
            la_anh_chinh: false,
          },
        });
      }

      const daCapNhat = await tx.hinh_anh_mon.update({
        where: {
          id: hinhId,
        },
        data: {
          ...(dto.duongDanAnh !== undefined
            ? { duong_dan_anh: dto.duongDanAnh }
            : {}),
          ...(dto.altText !== undefined
            ? { alt_text: dto.altText }
            : {}),
          ...(dto.thuTu !== undefined
            ? { thu_tu: dto.thuTu }
            : {}),
          ...(dto.laAnhChinh !== undefined
            ? { la_anh_chinh: dto.laAnhChinh }
            : {}),
        },
      });

      if (dto.laAnhChinh === true) {
        await tx.mon_an.update({
          where: {
            id: monAnId,
          },
          data: {
            hinh_anh_chinh: daCapNhat.duong_dan_anh,
          },
        });
        return;
      }

      if (
        hienTai.la_anh_chinh &&
        dto.laAnhChinh === false
      ) {
        await this.chonAnhChinhThayThe(
          tx,
          monAnId,
          hinhId,
        );
        return;
      }

      if (
        hienTai.la_anh_chinh &&
        dto.duongDanAnh !== undefined
      ) {
        await tx.mon_an.update({
          where: {
            id: monAnId,
          },
          data: {
            hinh_anh_chinh: daCapNhat.duong_dan_anh,
          },
        });
      }
    });

    await this.nhatKy.ghiNhan({
      taiKhoanId: nguoiDung.taiKhoanId,
      hanhDong: 'CAP_NHAT_HINH_ANH_MON',
      doiTuong: 'HINH_ANH_MON',
      doiTuongId: hinhIdChuoi,
      duLieuCu: hienTai,
      duLieuMoi: dto,
      maYeuCau,
    });

    return this.chiTietQuanTri(monAnIdChuoi);
  }

  async xoaHinhAnh(
    monAnIdChuoi: string,
    hinhIdChuoi: string,
    nguoiDung: NguoiDungXacThuc,
    maYeuCau?: string | null,
  ) {
    const monAnId = bigintTuChuoi(
      monAnIdChuoi,
      'ID món ăn',
    );
    const hinhId = bigintTuChuoi(
      hinhIdChuoi,
      'ID hình ảnh',
    );

    await this.chiTietQuanTri(monAnIdChuoi);

    const hinh = await this.prisma.hinh_anh_mon.findFirst({
      where: {
        id: hinhId,
        mon_an_id: monAnId,
      },
    });

    if (!hinh) {
      throw new LoiNghiepVuException(
        'MON_AN_003',
        'Không tìm thấy hình ảnh món.',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.hinh_anh_mon.delete({
        where: {
          id: hinhId,
        },
      });

      if (hinh.la_anh_chinh) {
        await this.chonAnhChinhThayThe(
          tx,
          monAnId,
          hinhId,
        );
      }
    });

    await this.nhatKy.ghiNhan({
      taiKhoanId: nguoiDung.taiKhoanId,
      hanhDong: 'XOA_HINH_ANH_MON',
      doiTuong: 'HINH_ANH_MON',
      doiTuongId: hinhIdChuoi,
      duLieuCu: hinh,
      maYeuCau,
    });

    return this.chiTietQuanTri(monAnIdChuoi);
  }

  private async chonAnhChinhThayThe(
    tx: Prisma.TransactionClient,
    monAnId: bigint,
    boQuaHinhId: bigint,
  ): Promise<void> {
    const anhMoi = await tx.hinh_anh_mon.findFirst({
      where: {
        mon_an_id: monAnId,
        id: {
          not: boQuaHinhId,
        },
      },
      orderBy: [
        { thu_tu: 'asc' },
        { id: 'asc' },
      ],
    });

    if (!anhMoi) {
      await tx.mon_an.update({
        where: {
          id: monAnId,
        },
        data: {
          hinh_anh_chinh: null,
        },
      });
      return;
    }

    await tx.hinh_anh_mon.updateMany({
      where: {
        mon_an_id: monAnId,
      },
      data: {
        la_anh_chinh: false,
      },
    });

    await tx.hinh_anh_mon.update({
      where: {
        id: anhMoi.id,
      },
      data: {
        la_anh_chinh: true,
      },
    });

    await tx.mon_an.update({
      where: {
        id: monAnId,
      },
      data: {
        hinh_anh_chinh: anhMoi.duong_dan_anh,
      },
    });
  }

  private async damBaoDanhMucHoatDong(
    id: bigint,
  ): Promise<void> {
    const row = await this.prisma.danh_muc_mon.findFirst({
      where: {
        id,
        ngay_xoa: null,
        trang_thai: 'HOAT_DONG',
      },
      select: {
        id: true,
      },
    });

    if (!row) {
      throw new LoiNghiepVuException(
        'DANH_MUC_MON_001',
        'Danh mục món không tồn tại hoặc đã ngừng hoạt động.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async damBaoKhongTrung(
    maMon: string,
    duongDan: string,
  ): Promise<void> {
    const trung = await this.prisma.mon_an.findFirst({
      where: {
        OR: [
          { ma_mon: maMon },
          { duong_dan: duongDan },
        ],
      },
      select: {
        id: true,
      },
    });

    if (trung) {
      throw new LoiNghiepVuException(
        'MON_AN_002',
        'Mã món hoặc đường dẫn đã tồn tại.',
        HttpStatus.CONFLICT,
      );
    }
  }

  private kiemTraGia(
    gia: number,
    giaKhuyenMai?: number | null,
  ): void {
    if (
      giaKhuyenMai != null &&
      giaKhuyenMai > gia
    ) {
      throw new LoiNghiepVuException(
        'MON_AN_004',
        'Giá khuyến mãi không được lớn hơn giá gốc.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private toView(row: MonAnPrismaView) {
    const {
      danh_muc_mon: danhMuc,
      ...monAn
    } = row;

    return {
      ...monAn,
      gia: Number(monAn.gia),
      gia_khuyen_mai:
        monAn.gia_khuyen_mai == null
          ? null
          : Number(monAn.gia_khuyen_mai),
      ten_danh_muc: danhMuc.ten_danh_muc,
      duong_dan_danh_muc: danhMuc.duong_dan,
    };
  }
}
