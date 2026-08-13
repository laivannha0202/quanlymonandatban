import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../co-so-du-lieu/prisma.service';
import { LoiNghiepVuException } from '../../dung-chung/exception/loi-nghiep-vu.exception';
import { bigintTuChuoi } from '../../dung-chung/tien-ich/id';
import { ngayGioSql } from '../../dung-chung/tien-ich/ngay-gio';
import { CauHinhService } from '../cau-hinh/cau-hinh.service';
import { ThanhToanService } from '../thanh-toan/thanh-toan.service';
import { BanAnRepository, BanKhaDung } from './ban-an.repository';
import { TimBanTrongDto } from './dto/tim-ban-trong.dto';
import { LichPhucVuService } from './lich-phuc-vu.service';
import { LienKetBanService } from './lien-ket-ban.service';

export interface PhuongAnBan {
  kieu: 'BAN_DON' | 'GHEP_BAN';
  banAns: Array<BanKhaDung & { tenKhuVuc: string }>;
  tongSucChua: number;
  tongSucChuaToiDa: number;
}

export interface KetQuaTimBanTrong {
  ngay: string;
  gioBatDau: string;
  gioKetThuc: string;
  soNguoi: number;
  khuVucId: string | null;
  coBan: boolean;
  phuongAn: PhuongAnBan[];
}

@Injectable()
export class TimBanTrongService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cauHinh: CauHinhService,
    private readonly lichPhucVu: LichPhucVuService,
    private readonly repository: BanAnRepository,
    private readonly lienKetBan: LienKetBanService,
    private readonly thanhToan: ThanhToanService,
  ) {}

  async tim(dto: TimBanTrongDto): Promise<KetQuaTimBanTrong> {
    await this.thanhToan.huyDatBanQuaHanThanhToan();
    const choPhep = await this.cauHinh.layBoolean('CHO_PHEP_DAT_BAN');
    if (!choPhep) {
      throw new LoiNghiepVuException(
        'DAT_BAN_010',
        'Nhà hàng đang tạm ngừng nhận đặt bàn trực tuyến.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const soNguoiToiDa = await this.cauHinh.laySo('SO_NGUOI_TOI_DA_MOI_DAT_BAN');
    if (dto.soNguoi > soNguoiToiDa) {
      throw new LoiNghiepVuException(
        'DAT_BAN_004',
        `Mỗi lượt đặt online tối đa ${soNguoiToiDa} khách.`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    await this.lichPhucVu.kiemTraQuyTacThoiGian(dto.ngay, dto.gioBatDau);
    const gioKetThuc = await this.lichPhucVu.tinhGioKetThuc(dto.ngay, dto.gioBatDau);
    const khuVucId = dto.khuVucId ? bigintTuChuoi(dto.khuVucId, 'ID khu vực') : undefined;

    if (khuVucId) {
      const khuVuc = await this.prisma.khu_vuc.findFirst({
        where: { id: khuVucId, ngay_xoa: null, trang_thai: 'HOAT_DONG' },
        select: { id: true },
      });
      if (!khuVuc) {
        throw new LoiNghiepVuException('KHU_VUC_001', 'Khu vực không tồn tại hoặc đã ngừng hoạt động.', HttpStatus.NOT_FOUND);
      }
    }

    const tatCaBan = await this.repository.layTatCaBanCoTheDat(khuVucId);
    const gioBatDauSql = ngayGioSql(dto.ngay, dto.gioBatDau);
    const gioKetThucSql = ngayGioSql(dto.ngay, gioKetThuc);
    const banBiChiem = await this.repository.layIdBanDangBiChiem(
      tatCaBan.map((ban) => ban.id),
      gioBatDauSql,
      gioKetThucSql,
    );

    const banTrong = tatCaBan.filter((ban) => !banBiChiem.has(ban.id.toString()));
    const khuVucIds = [...new Set(banTrong.map((ban) => ban.khu_vuc_id.toString()))].map(BigInt);
    const khuVucs = khuVucIds.length
      ? await this.prisma.khu_vuc.findMany({
          where: { id: { in: khuVucIds } },
          select: { id: true, ten_khu_vuc: true },
        })
      : [];
    const tenKhuVuc = new Map(khuVucs.map((item) => [item.id.toString(), item.ten_khu_vuc]));
    const boSungTen = (ban: BanKhaDung) => ({
      ...ban,
      tenKhuVuc: tenKhuVuc.get(ban.khu_vuc_id.toString()) ?? '',
    });

    const banDon: PhuongAnBan[] = banTrong
      .filter((ban) => ban.suc_chua_toi_da >= dto.soNguoi)
      .sort((a, b) => {
        const duA = a.suc_chua_toi_da - dto.soNguoi;
        const duB = b.suc_chua_toi_da - dto.soNguoi;
        return duA - duB || a.ma_ban.localeCompare(b.ma_ban);
      })
      .slice(0, 10)
      .map((ban) => ({
        kieu: 'BAN_DON',
        banAns: [boSungTen(ban)],
        tongSucChua: ban.suc_chua,
        tongSucChuaToiDa: ban.suc_chua_toi_da,
      }));

    let phuongAn = banDon;

    if (!phuongAn.length) {
      const mapBan = new Map(banTrong.map((ban) => [ban.id.toString(), ban]));
      const cacCap = await this.lienKetBan.layCapCoTheGhep(banTrong.map((ban) => ban.id));
      phuongAn = cacCap
        .map<PhuongAnBan | null>((cap) => {
          const ban1 = mapBan.get(cap.ban_1_id.toString());
          const ban2 = mapBan.get(cap.ban_2_id.toString());
          if (!ban1 || !ban2 || ban1.khu_vuc_id !== ban2.khu_vuc_id) return null;

          const tongSucChua = ban1.suc_chua + ban2.suc_chua;
          const tongSucChuaToiDa = ban1.suc_chua_toi_da + ban2.suc_chua_toi_da;
          if (tongSucChuaToiDa < dto.soNguoi) return null;

          return {
            kieu: 'GHEP_BAN',
            banAns: [boSungTen(ban1), boSungTen(ban2)],
            tongSucChua,
            tongSucChuaToiDa,
          };
        })
        .filter((item): item is PhuongAnBan => item !== null)
        .sort(
          (a, b) =>
            (a.tongSucChuaToiDa - dto.soNguoi) -
            (b.tongSucChuaToiDa - dto.soNguoi),
        )
        .slice(0, 10);
    }

    return {
      ngay: dto.ngay,
      gioBatDau: dto.gioBatDau,
      gioKetThuc,
      soNguoi: dto.soNguoi,
      khuVucId: dto.khuVucId ?? null,
      coBan: phuongAn.length > 0,
      phuongAn,
    };
  }
}
