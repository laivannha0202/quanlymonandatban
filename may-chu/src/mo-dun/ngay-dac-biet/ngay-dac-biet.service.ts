import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../co-so-du-lieu/prisma.service';
import { LoiNghiepVuException } from '../../dung-chung/exception/loi-nghiep-vu.exception';
import { gioThanhPhut, laNgayHopLe } from '../../dung-chung/tien-ich/ngay-gio';
import { bigintTuChuoi } from '../../dung-chung/tien-ich/id';
import { CapNhatNgayDacBietDto } from './dto/cap-nhat-ngay-dac-biet.dto';
import { TaoNgayDacBietDto } from './dto/tao-ngay-dac-biet.dto';

export interface NgayDacBietView {
  id: bigint;
  ngay: string;
  ten_su_kien: string;
  dong_cua_ca_ngay: number | boolean;
  gio_mo_cua: string | null;
  gio_dong_cua: string | null;
  ghi_chu: string | null;
}

@Injectable()
export class NgayDacBietService {
  constructor(private readonly prisma: PrismaService) {}

  async danhSach(tuNgay?: string, denNgay?: string): Promise<NgayDacBietView[]> {
    if (tuNgay && !laNgayHopLe(tuNgay)) {
      throw new LoiNghiepVuException('NGAY_DAC_BIET_001', 'Từ ngày không hợp lệ.');
    }
    if (denNgay && !laNgayHopLe(denNgay)) {
      throw new LoiNghiepVuException('NGAY_DAC_BIET_002', 'Đến ngày không hợp lệ.');
    }

    const dieuKien: string[] = [];
    const thamSo: unknown[] = [];
    if (tuNgay) {
      dieuKien.push('ngay >= ?');
      thamSo.push(tuNgay);
    }
    if (denNgay) {
      dieuKien.push('ngay <= ?');
      thamSo.push(denNgay);
    }

    return this.prisma.$queryRawUnsafe<NgayDacBietView[]>(`
      SELECT
        id,
        DATE_FORMAT(ngay, '%Y-%m-%d') AS ngay,
        ten_su_kien,
        dong_cua_ca_ngay,
        IF(gio_mo_cua IS NULL, NULL, TIME_FORMAT(gio_mo_cua, '%H:%i')) AS gio_mo_cua,
        IF(gio_dong_cua IS NULL, NULL, TIME_FORMAT(gio_dong_cua, '%H:%i')) AS gio_dong_cua,
        ghi_chu
      FROM ngay_nghi_dac_biet
      ${dieuKien.length ? `WHERE ${dieuKien.join(' AND ')}` : ''}
      ORDER BY ngay ASC
    `, ...thamSo);
  }

  async layTheoNgay(ngay: string): Promise<NgayDacBietView | null> {
    const ketQua = await this.prisma.$queryRawUnsafe<NgayDacBietView[]>(`
      SELECT
        id,
        DATE_FORMAT(ngay, '%Y-%m-%d') AS ngay,
        ten_su_kien,
        dong_cua_ca_ngay,
        IF(gio_mo_cua IS NULL, NULL, TIME_FORMAT(gio_mo_cua, '%H:%i')) AS gio_mo_cua,
        IF(gio_dong_cua IS NULL, NULL, TIME_FORMAT(gio_dong_cua, '%H:%i')) AS gio_dong_cua,
        ghi_chu
      FROM ngay_nghi_dac_biet
      WHERE ngay = ?
      LIMIT 1
    `, ngay);
    return ketQua[0] ?? null;
  }

  async tao(dto: TaoNgayDacBietDto) {
    this.kiemTra(dto);
    const daCo = await this.layTheoNgay(dto.ngay);
    if (daCo) {
      throw new LoiNghiepVuException(
        'NGAY_DAC_BIET_003',
        'Ngày này đã có cấu hình đặc biệt.',
        HttpStatus.CONFLICT,
      );
    }

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO ngay_nghi_dac_biet
        (ngay, ten_su_kien, dong_cua_ca_ngay, gio_mo_cua, gio_dong_cua, ghi_chu)
       VALUES (?, ?, ?, ?, ?, ?)`,
      dto.ngay,
      dto.tenSuKien,
      dto.dongCuaCaNgay ? 1 : 0,
      dto.dongCuaCaNgay ? null : `${dto.gioMoCua}:00`,
      dto.dongCuaCaNgay ? null : `${dto.gioDongCua}:00`,
      dto.ghiChu ?? null,
    );

    return this.layTheoNgay(dto.ngay);
  }

  async capNhat(id: string, dto: CapNhatNgayDacBietDto) {
    const hienTai = await this.layTheoId(id);
    if (!hienTai) {
      throw new LoiNghiepVuException('NGAY_DAC_BIET_004', 'Không tìm thấy ngày đặc biệt.', HttpStatus.NOT_FOUND);
    }

    if (
      dto.ngay &&
      dto.ngay !== hienTai.ngay
    ) {
      const trungNgay =
        await this.layTheoNgay(
          dto.ngay,
        );

      if (
        trungNgay &&
        trungNgay.id.toString() !==
          hienTai.id.toString()
      ) {
        throw new LoiNghiepVuException(
          'NGAY_DAC_BIET_003',
          'Ngày này đã có cấu hình đặc biệt.',
          HttpStatus.CONFLICT,
        );
      }
    }

    const duLieu: TaoNgayDacBietDto = {
      ngay: dto.ngay ?? hienTai.ngay,
      tenSuKien: dto.tenSuKien ?? hienTai.ten_su_kien,
      dongCuaCaNgay: dto.dongCuaCaNgay ?? Boolean(hienTai.dong_cua_ca_ngay),
      gioMoCua: dto.gioMoCua ?? hienTai.gio_mo_cua ?? undefined,
      gioDongCua: dto.gioDongCua ?? hienTai.gio_dong_cua ?? undefined,
      ghiChu: dto.ghiChu ?? hienTai.ghi_chu ?? undefined,
    };
    this.kiemTra(duLieu);

    await this.prisma.$executeRawUnsafe(
      `UPDATE ngay_nghi_dac_biet
       SET ngay = ?, ten_su_kien = ?, dong_cua_ca_ngay = ?,
           gio_mo_cua = ?, gio_dong_cua = ?, ghi_chu = ?
       WHERE id = ?`,
      duLieu.ngay,
      duLieu.tenSuKien,
      duLieu.dongCuaCaNgay ? 1 : 0,
      duLieu.dongCuaCaNgay ? null : `${duLieu.gioMoCua}:00`,
      duLieu.dongCuaCaNgay ? null : `${duLieu.gioDongCua}:00`,
      duLieu.ghiChu ?? null,
      bigintTuChuoi(
        id,
        'ID ngày đặc biệt',
      ),
    );

    return this.layTheoId(id);
  }

  async xoa(id: string) {
    const ketQua =
      await this.prisma.ngay_nghi_dac_biet.deleteMany({
        where: {
          id: bigintTuChuoi(
            id,
            'ID ngày đặc biệt',
          ),
        },
      });
    if (!ketQua.count) {
      throw new LoiNghiepVuException('NGAY_DAC_BIET_004', 'Không tìm thấy ngày đặc biệt.', HttpStatus.NOT_FOUND);
    }
    return { daXoa: true };
  }

  private async layTheoId(id: string): Promise<NgayDacBietView | null> {
    const ketQua = await this.prisma.$queryRawUnsafe<NgayDacBietView[]>(`
      SELECT id, DATE_FORMAT(ngay, '%Y-%m-%d') AS ngay, ten_su_kien, dong_cua_ca_ngay,
        IF(gio_mo_cua IS NULL, NULL, TIME_FORMAT(gio_mo_cua, '%H:%i')) AS gio_mo_cua,
        IF(gio_dong_cua IS NULL, NULL, TIME_FORMAT(gio_dong_cua, '%H:%i')) AS gio_dong_cua,
        ghi_chu
      FROM ngay_nghi_dac_biet WHERE id = ? LIMIT 1
    `,
      bigintTuChuoi(
        id,
        'ID ngày đặc biệt',
      ),
    );
    return ketQua[0] ?? null;
  }

  private kiemTra(dto: TaoNgayDacBietDto): void {
    if (!laNgayHopLe(dto.ngay)) {
      throw new LoiNghiepVuException('NGAY_DAC_BIET_005', 'Ngày không hợp lệ.');
    }

    if (!dto.dongCuaCaNgay) {
      if (!dto.gioMoCua || !dto.gioDongCua) {
        throw new LoiNghiepVuException(
          'NGAY_DAC_BIET_006',
          'Ngày mở cửa đặc biệt phải có giờ mở và giờ đóng.',
        );
      }
      if (gioThanhPhut(dto.gioDongCua) <= gioThanhPhut(dto.gioMoCua)) {
        throw new LoiNghiepVuException('NGAY_DAC_BIET_007', 'Giờ đóng cửa phải sau giờ mở cửa.');
      }
    }
  }
}
