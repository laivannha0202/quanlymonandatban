import { HttpStatus, Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../co-so-du-lieu/prisma.service';
import { LoiNghiepVuException } from '../../dung-chung/exception/loi-nghiep-vu.exception';
import { bigintTuChuoi } from '../../dung-chung/tien-ich/id';
import { CauHinhService } from '../cau-hinh/cau-hinh.service';
import type { MonDatTruocDto, TinhTienDatBanDto } from './dto/tinh-tien-dat-ban.dto';

type PricingClient = Pick<Prisma.TransactionClient, 'mon_an' | 'khuyen_mai'>;

type DongMon = {
  monAnId: string;
  maMon: string;
  tenMon: string;
  donGia: number;
  soLuong: number;
  thanhTien: number;
  ghiChu: string | null;
};

type KhuyenMaiApDung = {
  id: string;
  maKhuyenMai: string;
  tenKhuyenMai: string;
  loaiGiam: string;
  giaTri: number;
  giaTriMonToiThieu: number | null;
  giamToiDa: number | null;
};

function tienNguyen(value: unknown, ten: string): number {
  const so = Number(value);
  if (!Number.isFinite(so) || so < 0) {
    throw new LoiNghiepVuException(
      'DAT_BAN_024',
      `${ten} không hợp lệ.`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
  return Math.round(so);
}

@Injectable()
export class DatBanTinhTienService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cauHinh: CauHinhService,
  ) {}

  async tinh(dto: TinhTienDatBanDto) {
    const ketQua = await this.tinhVoiClient(this.prisma, dto);

    await this.kiemTraQuotaBaoGia(
      ketQua.khuyenMai?.id != null
        ? BigInt(String(ketQua.khuyenMai.id))
        : null,
      dto.soDienThoai,
    );

    return ketQua;
  }

  async tinhTrongTransaction(
    tx: Prisma.TransactionClient,
    dto: TinhTienDatBanDto,
  ) {
    return this.tinhVoiClient(tx, dto);
  }

  private async tinhVoiClient(
    client: PricingClient,
    dto: TinhTienDatBanDto,
  ) {
    const monYeuCau = dto.monAn ?? [];
    this.kiemTraMonKhongTrung(monYeuCau);

    const [choPhepDatMonTruoc, yeuCauThanhToanMonTruoc, tienCoc] =
      await Promise.all([
        this.cauHinh.layBoolean('CHO_PHEP_DAT_MON_TRUOC'),
        this.cauHinh.layBoolean('YEU_CAU_THANH_TOAN_MON_TRUOC'),
        this.cauHinh.laySo('TIEN_COC_GIU_BAN'),
      ]);

    if (monYeuCau.length > 0 && !choPhepDatMonTruoc) {
      throw new LoiNghiepVuException(
        'DAT_BAN_023',
        'Nhà hàng hiện không nhận món đặt trước.',
        HttpStatus.CONFLICT,
      );
    }

    const dongMon = await this.layDongMon(client, monYeuCau);
    const tamTinhMon = dongMon.reduce((tong, item) => tong + item.thanhTien, 0);

    const maKhuyenMai = dto.maKhuyenMai?.trim() || null;
    const { khuyenMai, tienGiam } = maKhuyenMai
      ? await this.apDungKhuyenMai(client, maKhuyenMai, tamTinhMon)
      : { khuyenMai: null, tienGiam: 0 };

    const tienMonSauGiam = Math.max(0, tamTinhMon - tienGiam);
    const tienMonThanhToanTruoc = yeuCauThanhToanMonTruoc
      ? tienMonSauGiam
      : 0;
    const tienCocChuan = tienNguyen(tienCoc, 'Tiền cọc giữ bàn');
    const tongThanhToanTruoc = tienCocChuan + tienMonThanhToanTruoc;

    return {
      monAn: dongMon,
      khuyenMai,
      tamTinhMon,
      tienGiam,
      tienMonSauGiam,
      tienMonThanhToanTruoc,
      tienCoc: tienCocChuan,
      tongThanhToanTruoc,
      yeuCauThanhToanMonTruoc,
    };
  }



  private async kiemTraQuotaBaoGia(
    khuyenMaiId: bigint | null,
    soDienThoai?: string,
  ): Promise<void> {
    if (khuyenMaiId == null) return;

    const khuyenMai =
      await this.prisma.khuyen_mai.findUnique({
        where: {
          id: khuyenMaiId,
        },
        select: {
          so_luot_toi_da: true,
          so_luot_moi_khach: true,
        },
      });

    if (!khuyenMai) return;

    const trangThaiChiemQuota = [
      'DA_GIU',
      'DA_DUNG',
    ];

    if (khuyenMai.so_luot_toi_da != null) {
      const tongDangChiem =
        await this.prisma.su_dung_khuyen_mai.count({
          where: {
            khuyen_mai_id: khuyenMaiId,
            trang_thai: {
              in: trangThaiChiemQuota,
            },
          },
        });

      if (
        tongDangChiem >=
        khuyenMai.so_luot_toi_da
      ) {
        throw new LoiNghiepVuException(
          'KHUYEN_MAI_009',
          'Mã ưu đãi đã hết lượt sử dụng.',
          HttpStatus.CONFLICT,
        );
      }
    }

    const soDienThoaiChuan =
      soDienThoai?.trim()
        ? this.chuanHoaSoDienThoaiQuota(
            soDienThoai,
          )
        : '';

    if (
      soDienThoaiChuan &&
      khuyenMai.so_luot_moi_khach != null
    ) {
      const cuaKhach =
        await this.prisma.su_dung_khuyen_mai.count({
          where: {
            khuyen_mai_id: khuyenMaiId,
            so_dien_thoai_chuan:
              soDienThoaiChuan,
            trang_thai: {
              in: trangThaiChiemQuota,
            },
          },
        });

      if (
        cuaKhach >=
        khuyenMai.so_luot_moi_khach
      ) {
        throw new LoiNghiepVuException(
          'KHUYEN_MAI_010',
          'Bạn đã sử dụng hết số lượt cho phép của mã ưu đãi này.',
          HttpStatus.CONFLICT,
        );
      }
    }
  }

  async giuKhuyenMaiTrongTransaction(
    tx: Prisma.TransactionClient,
    input: {
      khuyenMaiId: bigint;
      datBanId: bigint;
      soDienThoai: string;
    },
  ): Promise<void> {
    const soDienThoaiChuan =
      this.chuanHoaSoDienThoaiQuota(input.soDienThoai);

    const khuyenMai = await tx.$queryRaw<
      Array<{
        id: bigint;
        so_luot_toi_da: number | null;
        so_luot_moi_khach: number | null;
      }>
    >`
      SELECT
        id,
        so_luot_toi_da,
        so_luot_moi_khach
      FROM khuyen_mai
      WHERE id = ${input.khuyenMaiId}
        AND ngay_xoa IS NULL
      FOR UPDATE
    `;

    const row = khuyenMai[0];

    if (!row) {
      throw new LoiNghiepVuException(
        'KHUYEN_MAI_006',
        'Mã ưu đãi không còn khả dụng.',
        HttpStatus.CONFLICT,
      );
    }

    const trangThaiChiemQuota = [
      'DA_GIU',
      'DA_DUNG',
    ];

    const [tongDangChiem, cuaKhach] =
      await Promise.all([
        tx.su_dung_khuyen_mai.count({
          where: {
            khuyen_mai_id: input.khuyenMaiId,
            trang_thai: {
              in: trangThaiChiemQuota,
            },
          },
        }),
        tx.su_dung_khuyen_mai.count({
          where: {
            khuyen_mai_id: input.khuyenMaiId,
            so_dien_thoai_chuan: soDienThoaiChuan,
            trang_thai: {
              in: trangThaiChiemQuota,
            },
          },
        }),
      ]);

    const tongToiDa =
      row.so_luot_toi_da == null
        ? null
        : Number(row.so_luot_toi_da);

    if (
      tongToiDa != null &&
      tongDangChiem >= tongToiDa
    ) {
      throw new LoiNghiepVuException(
        'KHUYEN_MAI_009',
        'Mã ưu đãi đã hết lượt sử dụng.',
        HttpStatus.CONFLICT,
      );
    }

    const moiKhachToiDa =
      row.so_luot_moi_khach == null
        ? null
        : Number(row.so_luot_moi_khach);

    if (
      moiKhachToiDa != null &&
      cuaKhach >= moiKhachToiDa
    ) {
      throw new LoiNghiepVuException(
        'KHUYEN_MAI_010',
        'Bạn đã sử dụng hết số lượt cho phép của mã ưu đãi này.',
        HttpStatus.CONFLICT,
      );
    }

    await tx.su_dung_khuyen_mai.create({
      data: {
        khuyen_mai_id: input.khuyenMaiId,
        dat_ban_id: input.datBanId,
        so_dien_thoai_chuan: soDienThoaiChuan,
        trang_thai: 'DA_GIU',
      },
    });
  }

  private chuanHoaSoDienThoaiQuota(
    soDienThoai: string,
  ): string {
    const chuSo = soDienThoai.replace(/\D/g, '');

    if (
      chuSo.startsWith('84') &&
      chuSo.length >= 10
    ) {
      return `0${chuSo.slice(2)}`;
    }

    return chuSo;
  }

  private kiemTraMonKhongTrung(monAn: MonDatTruocDto[]): void {
    const ids = monAn.map((item) => item.monAnId);
    if (new Set(ids).size !== ids.length) {
      throw new LoiNghiepVuException(
        'DAT_BAN_021',
        'Mỗi món chỉ được xuất hiện một lần; hãy tăng số lượng thay vì gửi trùng món.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async layDongMon(
    client: PricingClient,
    monAn: MonDatTruocDto[],
  ): Promise<DongMon[]> {
    if (!monAn.length) return [];

    const ids = monAn.map((item) => bigintTuChuoi(item.monAnId, 'ID món ăn'));
    const rows = await client.mon_an.findMany({
      where: {
        id: { in: ids },
        ngay_xoa: null,
        trang_thai: 'HOAT_DONG',
        con_mon: true,
      },
      select: {
        id: true,
        ma_mon: true,
        ten_mon: true,
        gia: true,
        gia_khuyen_mai: true,
      },
    });

    if (rows.length !== ids.length) {
      const timThay = new Set(rows.map((row) => row.id.toString()));
      const khongHopLe = monAn
        .map((item) => item.monAnId)
        .filter((id) => !timThay.has(id));

      throw new LoiNghiepVuException(
        'DAT_BAN_022',
        `Món không tồn tại, đã ngừng phục vụ hoặc tạm hết: ${khongHopLe.join(', ')}.`,
        HttpStatus.CONFLICT,
      );
    }

    const map = new Map(rows.map((row) => [row.id.toString(), row]));

    return monAn.map((item) => {
      const row = map.get(item.monAnId)!;
      const donGia = tienNguyen(row.gia_khuyen_mai ?? row.gia, 'Đơn giá món');
      const thanhTien = donGia * item.soLuong;

      return {
        monAnId: row.id.toString(),
        maMon: row.ma_mon,
        tenMon: row.ten_mon,
        donGia,
        soLuong: item.soLuong,
        thanhTien,
        ghiChu: item.ghiChu?.trim() || null,
      };
    });
  }

  private async apDungKhuyenMai(
    client: PricingClient,
    maKhuyenMai: string,
    tamTinhMon: number,
  ): Promise<{ khuyenMai: KhuyenMaiApDung; tienGiam: number }> {
    if (tamTinhMon <= 0) {
      throw new LoiNghiepVuException(
        'KHUYEN_MAI_006',
        'Mã ưu đãi chỉ áp dụng cho món đặt trước.',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const row = await client.khuyen_mai.findUnique({
      where: { ma_khuyen_mai: maKhuyenMai },
      select: {
        id: true,
        ma_khuyen_mai: true,
        ten_khuyen_mai: true,
        loai_giam: true,
        gia_tri: true,
        gia_tri_don_toi_thieu: true,
        giam_toi_da: true,
        ngay_bat_dau: true,
        ngay_ket_thuc: true,
        trang_thai: true,
        ngay_xoa: true,
      },
    });

    const hienTai = Date.now();
    if (
      !row ||
      row.ngay_xoa ||
      row.trang_thai !== 'HOAT_DONG' ||
      row.ngay_bat_dau.getTime() > hienTai ||
      row.ngay_ket_thuc.getTime() < hienTai
    ) {
      throw new LoiNghiepVuException(
        'KHUYEN_MAI_006',
        'Mã ưu đãi không tồn tại hoặc hiện không còn hiệu lực.',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const giaTri = tienNguyen(row.gia_tri, 'Giá trị khuyến mãi');
    const giaTriMonToiThieu =
      row.gia_tri_don_toi_thieu == null
        ? null
        : tienNguyen(row.gia_tri_don_toi_thieu, 'Giá trị món tối thiểu');
    const giamToiDa =
      row.giam_toi_da == null
        ? null
        : tienNguyen(row.giam_toi_da, 'Giảm tối đa');

    if (giaTriMonToiThieu != null && tamTinhMon < giaTriMonToiThieu) {
      throw new LoiNghiepVuException(
        'KHUYEN_MAI_007',
        `Mã ưu đãi yêu cầu giá trị món tối thiểu ${giaTriMonToiThieu} đồng.`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    let tienGiam: number;
    if (row.loai_giam === 'PHAN_TRAM') {
      tienGiam = Math.round((tamTinhMon * giaTri) / 100);
      if (giamToiDa != null) tienGiam = Math.min(tienGiam, giamToiDa);
    } else if (row.loai_giam === 'SO_TIEN') {
      tienGiam = giaTri;
    } else {
      throw new LoiNghiepVuException(
        'KHUYEN_MAI_008',
        'Loại khuyến mãi không hợp lệ.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    tienGiam = Math.min(Math.max(0, tienGiam), tamTinhMon);

    return {
      khuyenMai: {
        id: row.id.toString(),
        maKhuyenMai: row.ma_khuyen_mai,
        tenKhuyenMai: row.ten_khuyen_mai,
        loaiGiam: row.loai_giam,
        giaTri,
        giaTriMonToiThieu,
        giamToiDa,
      },
      tienGiam,
    };
  }
}
