import { HttpStatus, Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../co-so-du-lieu/prisma.service';
import { LoiNghiepVuException } from '../../dung-chung/exception/loi-nghiep-vu.exception';
import { bigintTuChuoi } from '../../dung-chung/tien-ich/id';
import { ThongBaoService } from '../thong-bao/thong-bao.service';
import { CauHinhService } from '../cau-hinh/cau-hinh.service';
import { TraCuuThanhToanDto } from './dto/tra-cuu-thanh-toan.dto';
import { XacNhanThanhToanMoPhongDto } from './dto/xac-nhan-thanh-toan-mo-phong.dto';
import { DanhSachThanhToanQuanTriDto } from './dto/danh-sach-thanh-toan-quan-tri.dto';
import { XacNhanThanhToanThuCongDto } from './dto/xac-nhan-thanh-toan-thu-cong.dto';
import { XacNhanHoanTienDto } from './dto/xac-nhan-hoan-tien.dto';

type ThanhToanView = {
  id: bigint;
  ma_thanh_toan: string;
  dat_ban_id: bigint;
  so_tien: unknown;
  phuong_thuc: string;
  trang_thai: string;
  ma_giao_dich_cong: string | null;
  khoa_idempotency: string | null;
  thoi_gian_thanh_toan: Date | null;
  ngay_tao: Date;
  ngay_cap_nhat: Date;
};

@Injectable()
export class ThanhToanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly cauHinh: CauHinhService,
    private readonly thongBao: ThongBaoService,
  ) {}

  async traCuu(dto: TraCuuThanhToanDto) {
    await this.huyDatBanQuaHanThanhToan();
    const maDatBan = dto.maDatBan.trim();
    const soDienThoai = dto.soDienThoai.trim();

    const row = await this.prisma.thanh_toan.findFirst({
      where: {
        dat_ban: {
          ma_dat_ban: maDatBan,
          so_dien_thoai: soDienThoai,
        },
      },
      orderBy: [
        { ngay_tao: 'desc' },
        { id: 'desc' },
      ],
      select: {
        id: true,
        ma_thanh_toan: true,
        dat_ban_id: true,
        so_tien: true,
        phuong_thuc: true,
        trang_thai: true,
        ma_giao_dich_cong: true,
        khoa_idempotency: true,
        thoi_gian_thanh_toan: true,
        ngay_tao: true,
        ngay_cap_nhat: true,
        dat_ban: {
          select: {
            ma_dat_ban: true,
            trang_thai: true,
          },
        },
      },
    });

    if (!row) {
      throw new LoiNghiepVuException(
        'THANH_TOAN_001',
        'Không tìm thấy giao dịch thanh toán phù hợp với đặt bàn.',
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      ...this.toView(row),
      maDatBan: row.dat_ban.ma_dat_ban,
      trangThaiDatBan: row.dat_ban.trang_thai,
    };
  }

  async xacNhanMoPhong(dto: XacNhanThanhToanMoPhongDto) {
    this.damBaoMoPhongDuocPhep();

    const maDatBan = dto.maDatBan.trim();
    const soDienThoai = dto.soDienThoai.trim();
    const maThanhToan = dto.maThanhToan.trim();
    const khoaIdempotency = dto.khoaIdempotency.trim();

    const ketQua = await this.prisma.$transaction(async (tx) => {
      const row = await tx.thanh_toan.findUnique({
        where: {
          ma_thanh_toan: maThanhToan,
        },
        select: {
          id: true,
          ma_thanh_toan: true,
          dat_ban_id: true,
          so_tien: true,
          phuong_thuc: true,
          trang_thai: true,
          ma_giao_dich_cong: true,
          khoa_idempotency: true,
          thoi_gian_thanh_toan: true,
          ngay_tao: true,
          ngay_cap_nhat: true,
          dat_ban: {
            select: {
              id: true,
              ma_dat_ban: true,
              so_dien_thoai: true,
              trang_thai: true,
              tong_thanh_toan_truoc: true,
            },
          },
        },
      });

      if (
        !row ||
        row.dat_ban.ma_dat_ban !== maDatBan ||
        row.dat_ban.so_dien_thoai !== soDienThoai
      ) {
        throw new LoiNghiepVuException(
          'THANH_TOAN_001',
          'Không tìm thấy giao dịch thanh toán phù hợp với đặt bàn.',
          HttpStatus.NOT_FOUND,
        );
      }

      const soTien = Math.round(Number(row.so_tien));
      const soTienSnapshot =
        Math.round(Number(row.dat_ban.tong_thanh_toan_truoc));

      if (
        !Number.isFinite(soTien) ||
        !Number.isFinite(soTienSnapshot) ||
        soTien !== soTienSnapshot
      ) {
        throw new LoiNghiepVuException(
          'THANH_TOAN_003',
          'Số tiền giao dịch không khớp với số tiền đã chốt của đặt bàn.',
          HttpStatus.CONFLICT,
        );
      }

      if (
        ['DA_HUY', 'DA_HOAN_THANH', 'KHONG_DEN'].includes(
          row.dat_ban.trang_thai,
        )
      ) {
        throw new LoiNghiepVuException(
          'THANH_TOAN_005',
          'Đặt bàn đã kết thúc nên không thể tiếp tục thanh toán.',
          HttpStatus.CONFLICT,
        );
      }

      if (row.trang_thai === 'DA_THANH_TOAN') {
        return {
          thanhToan: this.toView(row),
          datBanId: row.dat_ban.id,
          maDatBan: row.dat_ban.ma_dat_ban,
          trangThaiDatBan: row.dat_ban.trang_thai,
          vuaThanhToan: false,
          vuaXacNhanDatBan: false,
        };
      }

      if (row.trang_thai !== 'CHO_THANH_TOAN') {
        throw new LoiNghiepVuException(
          'THANH_TOAN_002',
          `Giao dịch đang ở trạng thái ${row.trang_thai} và không thể xác nhận thanh toán.`,
          HttpStatus.CONFLICT,
        );
      }

      const trungIdempotency = await tx.thanh_toan.findUnique({
        where: {
          khoa_idempotency: khoaIdempotency,
        },
        select: {
          id: true,
          ma_thanh_toan: true,
        },
      });

      if (
        trungIdempotency &&
        trungIdempotency.id !== row.id
      ) {
        throw new LoiNghiepVuException(
          'THANH_TOAN_004',
          'Khóa idempotency đã được dùng cho một giao dịch khác.',
          HttpStatus.CONFLICT,
        );
      }

      const thoiGian = new Date();
      const maGiaoDichCong = `MO_PHONG-${randomUUID()}`;

      // Compare-and-set theo trạng thái để hai request đồng thời không thể
      // cùng chuyển một payment từ CHO_THANH_TOAN sang DA_THANH_TOAN.
      const capNhat = await tx.thanh_toan.updateMany({
        where: {
          id: row.id,
          trang_thai: 'CHO_THANH_TOAN',
        },
        data: {
          phuong_thuc: 'MO_PHONG',
          trang_thai: 'DA_THANH_TOAN',
          ma_giao_dich_cong: maGiaoDichCong,
          khoa_idempotency: khoaIdempotency,
          thoi_gian_thanh_toan: thoiGian,
        },
      });

      if (capNhat.count === 0) {
        const moiNhat = await tx.thanh_toan.findUnique({
          where: { id: row.id },
          select: {
            id: true,
            ma_thanh_toan: true,
            dat_ban_id: true,
            so_tien: true,
            phuong_thuc: true,
            trang_thai: true,
            ma_giao_dich_cong: true,
            khoa_idempotency: true,
            thoi_gian_thanh_toan: true,
            ngay_tao: true,
            ngay_cap_nhat: true,
          },
        });

        if (moiNhat?.trang_thai === 'DA_THANH_TOAN') {
          return {
            thanhToan: this.toView(moiNhat),
            datBanId: row.dat_ban.id,
            maDatBan: row.dat_ban.ma_dat_ban,
            trangThaiDatBan: row.dat_ban.trang_thai,
            vuaThanhToan: false,
            vuaXacNhanDatBan: false,
          };
        }

        throw new LoiNghiepVuException(
          'THANH_TOAN_002',
          'Giao dịch vừa thay đổi trạng thái và không thể thanh toán.',
          HttpStatus.CONFLICT,
        );
      }

      let trangThaiDatBan = row.dat_ban.trang_thai;
      await this.danhDauKhuyenMaiDaDungTrongTransaction(
        tx,
        row.dat_ban.id,
      );

      let vuaXacNhanDatBan = false;

      if (row.dat_ban.trang_thai === 'CHO_XAC_NHAN') {
        const xacNhan = await tx.dat_ban.updateMany({
          where: {
            id: row.dat_ban.id,
            trang_thai: 'CHO_XAC_NHAN',
          },
          data: {
            trang_thai: 'DA_XAC_NHAN',
            thoi_gian_xac_nhan: thoiGian,
          },
        });

        if (xacNhan.count === 1) {
          await tx.lich_su_dat_ban.create({
            data: {
              dat_ban_id: row.dat_ban.id,
              trang_thai_cu: 'CHO_XAC_NHAN',
              trang_thai_moi: 'DA_XAC_NHAN',
              nguoi_thuc_hien_id: null,
              hanh_dong: 'THANH_TOAN_TRUC_TUYEN',
              ghi_chu:
                `Thanh toán mô phỏng ${row.ma_thanh_toan} thành công.`,
            },
          });
          trangThaiDatBan = 'DA_XAC_NHAN';
          vuaXacNhanDatBan = true;
        }
      }

      const moi = await tx.thanh_toan.findUniqueOrThrow({
        where: { id: row.id },
        select: {
          id: true,
          ma_thanh_toan: true,
          dat_ban_id: true,
          so_tien: true,
          phuong_thuc: true,
          trang_thai: true,
          ma_giao_dich_cong: true,
          khoa_idempotency: true,
          thoi_gian_thanh_toan: true,
          ngay_tao: true,
          ngay_cap_nhat: true,
        },
      });

      return {
        thanhToan: this.toView(moi),
        datBanId: row.dat_ban.id,
        maDatBan: row.dat_ban.ma_dat_ban,
        trangThaiDatBan,
        vuaThanhToan: true,
        vuaXacNhanDatBan,
      };
    }, { timeout: 10_000 });

    if (ketQua.vuaXacNhanDatBan) {
      await this.thongBao.taoChoDatBan(
        ketQua.datBanId,
        'THANH_TOAN_THANH_CONG',
        'Thanh toán thành công',
        `Đặt bàn ${ketQua.maDatBan} đã thanh toán và được xác nhận.`,
      );
    }

    return {
      ...ketQua.thanhToan,
      maDatBan: ketQua.maDatBan,
      trangThaiDatBan: ketQua.trangThaiDatBan,
      vuaThanhToan: ketQua.vuaThanhToan,
      vuaXacNhanDatBan: ketQua.vuaXacNhanDatBan,
    };
  }


  async hoanTienDatBanTrongTransaction(
    tx: Prisma.TransactionClient,
    datBanId: bigint,
    tyLeHoanTien: number,
    lyDo: string,
    nguoiThucHienId: bigint | null,
    choPhepHoanTien: boolean,
  ) {
    const tyLe = Math.max(0, Math.min(100, Math.round(tyLeHoanTien)));

    await tx.thanh_toan.updateMany({
      where: {
        dat_ban_id: datBanId,
        trang_thai: 'CHO_THANH_TOAN',
      },
      data: {
        trang_thai: 'DA_HUY',
        ghi_chu: `Hủy cùng đặt bàn: ${lyDo}`,
      },
    });

    const payments = await tx.thanh_toan.findMany({
      where: {
        dat_ban_id: datBanId,
        trang_thai: {
          in: ['DA_THANH_TOAN', 'HOAN_MOT_PHAN'],
        },
      },
      orderBy: { id: 'asc' },
      select: {
        id: true,
        ma_thanh_toan: true,
        so_tien: true,
        phuong_thuc: true,
        trang_thai: true,
      },
    });

    const ketQua: Array<{
      thanhToanId: bigint;
      maThanhToan: string;
      soTienHoan: number;
      trangThaiHoan: string;
      maHoanTien: string;
    }> = [];

    for (const payment of payments) {
      const soTienDaThu = Math.round(Number(payment.so_tien));
      if (!Number.isFinite(soTienDaThu) || soTienDaThu <= 0) {
        continue;
      }

      const daDatChoHoan = await tx.hoan_tien.aggregate({
        where: {
          thanh_toan_id: payment.id,
          trang_thai: {
            in: ['CHO_HOAN', 'DANG_XU_LY', 'DA_HOAN'],
          },
        },
        _sum: {
          so_tien: true,
        },
      });

      const tongDaHoanHoacDatCho = Math.round(
        Number(daDatChoHoan._sum.so_tien ?? 0),
      );
      const mucTieuHoan = Math.round((soTienDaThu * tyLe) / 100);
      const soTienHoan = Math.max(
        0,
        Math.min(
          soTienDaThu - tongDaHoanHoacDatCho,
          mucTieuHoan - tongDaHoanHoacDatCho,
        ),
      );

      if (soTienHoan <= 0) {
        continue;
      }

      if (!choPhepHoanTien) {
        throw new LoiNghiepVuException(
          'THANH_TOAN_007',
          'Đặt bàn đã thanh toán. Tài khoản hiện tại cần quyền HOAN_TIEN_THUC_HIEN để hủy và hoàn tiền.',
          HttpStatus.FORBIDDEN,
        );
      }

      const laMoPhong = payment.phuong_thuc === 'MO_PHONG';
      const maHoanTien = `HT-${randomUUID()}`;
      const khoaIdempotency =
        `HUY_DAT_BAN:${datBanId.toString()}:${payment.id.toString()}`;
      const thoiGian = new Date();

      let refund;
      try {
        refund = await tx.hoan_tien.create({
          data: {
            ma_hoan_tien: maHoanTien,
            thanh_toan_id: payment.id,
            so_tien: soTienHoan,
            ly_do: lyDo,
            trang_thai: laMoPhong ? 'DA_HOAN' : 'CHO_HOAN',
            ma_giao_dich_cong:
              laMoPhong
                ? `REFUND-MO_PHONG-${randomUUID()}`
                : null,
            khoa_idempotency: khoaIdempotency,
            nguoi_thuc_hien_id: nguoiThucHienId,
            thoi_gian_hoan: laMoPhong ? thoiGian : null,
          },
          select: {
            id: true,
            ma_hoan_tien: true,
            so_tien: true,
            trang_thai: true,
          },
        });
      } catch (error: unknown) {
        const existing = await tx.hoan_tien.findUnique({
          where: {
            khoa_idempotency: khoaIdempotency,
          },
          select: {
            id: true,
            ma_hoan_tien: true,
            so_tien: true,
            trang_thai: true,
          },
        });

        if (!existing) {
          throw error;
        }
        refund = existing;
      }

      if (laMoPhong && refund.trang_thai === 'DA_HOAN') {
        const tongHoanThanhCong = await tx.hoan_tien.aggregate({
          where: {
            thanh_toan_id: payment.id,
            trang_thai: 'DA_HOAN',
          },
          _sum: {
            so_tien: true,
          },
        });

        const tongDaHoan = Math.round(
          Number(tongHoanThanhCong._sum.so_tien ?? 0),
        );

        await tx.thanh_toan.update({
          where: { id: payment.id },
          data: {
            trang_thai:
              tongDaHoan >= soTienDaThu
                ? 'DA_HOAN_TIEN'
                : 'HOAN_MOT_PHAN',
          },
        });
      }

      ketQua.push({
        thanhToanId: payment.id,
        maThanhToan: payment.ma_thanh_toan,
        soTienHoan: Math.round(Number(refund.so_tien)),
        trangThaiHoan: refund.trang_thai,
        maHoanTien: refund.ma_hoan_tien,
      });
    }

    return {
      tyLeHoanTien: tyLe,
      danhSach: ketQua,
      tongHoan: ketQua.reduce(
        (tong, item) => tong + item.soTienHoan,
        0,
      ),
    };
  }




  async danhDauKhuyenMaiDaDungTrongTransaction(
    tx: Prisma.TransactionClient,
    datBanId: bigint,
  ): Promise<number> {
    const ketQua =
      await tx.su_dung_khuyen_mai.updateMany({
        where: {
          dat_ban_id: datBanId,
          trang_thai: 'DA_GIU',
        },
        data: {
          trang_thai: 'DA_DUNG',
          thoi_gian_su_dung: new Date(),
          thoi_gian_huy: null,
          ly_do_huy: null,
        },
      });

    return ketQua.count;
  }

  async giaiPhongKhuyenMaiTrongTransaction(
    tx: Prisma.TransactionClient,
    datBanId: bigint,
    lyDo: string,
  ): Promise<number> {
    const lyDoChuan =
      lyDo.trim().slice(0, 255) ||
      'Giải phóng quota khuyến mãi';

    const ketQua =
      await tx.su_dung_khuyen_mai.updateMany({
        where: {
          dat_ban_id: datBanId,
          trang_thai: 'DA_GIU',
        },
        data: {
          trang_thai: 'DA_HUY',
          thoi_gian_huy: new Date(),
          ly_do_huy: lyDoChuan,
          thoi_gian_su_dung: null,
        },
      });

    return ketQua.count;
  }

  async huyDatBanQuaHanThanhToan(): Promise<number> {
    const thoiGianPhut = await this.cauHinh.laySo(
      'THOI_GIAN_THANH_TOAN_PHUT',
    );

    const hetHanTruoc = new Date(
      Date.now() - thoiGianPhut * 60_000,
    );

    const cacGiaoDich = await this.prisma.thanh_toan.findMany({
      where: {
        trang_thai: 'CHO_THANH_TOAN',
        ngay_tao: {
          lt: hetHanTruoc,
        },
        dat_ban: {
          is: {
            trang_thai: 'CHO_XAC_NHAN',
          },
        },
      },
      select: {
        id: true,
        dat_ban_id: true,
        ma_thanh_toan: true,
        dat_ban: {
          select: {
            id: true,
            ma_dat_ban: true,
          },
        },
      },
      orderBy: {
        ngay_tao: 'asc',
      },
      take: 100,
    });

    if (!cacGiaoDich.length) {
      return 0;
    }

    const daHuy: Array<{
      id: bigint;
      maDatBan: string;
    }> = [];

    for (const giaoDich of cacGiaoDich) {
      const ketQua = await this.prisma.$transaction(
        async (tx) => {
          // Payment row is the concurrency gate. Payment confirmation also
          // CASes CHO_THANH_TOAN -> DA_THANH_TOAN, therefore exactly one side
          // can win.
          const khoaThanhToan =
            await tx.thanh_toan.updateMany({
              where: {
                id: giaoDich.id,
                trang_thai: 'CHO_THANH_TOAN',
                ngay_tao: {
                  lt: hetHanTruoc,
                },
              },
              data: {
                trang_thai: 'DA_HUY',
              },
            });

          if (khoaThanhToan.count !== 1) {
            return false;
          }

          const huyDatBan = await tx.dat_ban.updateMany({
            where: {
              id: giaoDich.dat_ban_id,
              trang_thai: 'CHO_XAC_NHAN',
            },
            data: {
              trang_thai: 'DA_HUY',
            },
          });

          if (huyDatBan.count !== 1) {
            // Booking may have been confirmed by staff concurrently.
            // Restore pending payment in the same transaction rather than
            // leaving a confirmed booking with an accidentally-cancelled
            // payment intent.
            await tx.thanh_toan.updateMany({
              where: {
                id: giaoDich.id,
                trang_thai: 'DA_HUY',
              },
              data: {
                trang_thai: 'CHO_THANH_TOAN',
              },
            });
            return false;
          }

          await this.giaiPhongKhuyenMaiTrongTransaction(
            tx,
            giaoDich.dat_ban_id,
            'Hết hạn thanh toán',
          );

          await tx.lich_su_dat_ban.create({
            data: {
              dat_ban_id: giaoDich.dat_ban_id,
              trang_thai_cu: 'CHO_XAC_NHAN',
              trang_thai_moi: 'DA_HUY',
              nguoi_thuc_hien_id: null,
              hanh_dong: 'HET_HAN_THANH_TOAN',
              ghi_chu:
                `Hết ${thoiGianPhut} phút chờ thanh toán ` +
                `(${giaoDich.ma_thanh_toan}).`,
            },
          });

          return true;
        },
        { timeout: 10_000 },
      );

      if (ketQua) {
        daHuy.push({
          id: giaoDich.dat_ban.id,
          maDatBan: giaoDich.dat_ban.ma_dat_ban,
        });
      }
    }

    await Promise.allSettled(
      daHuy.map((datBan) =>
        this.thongBao.taoChoDatBan(
          datBan.id,
          'DAT_BAN_HET_HAN_THANH_TOAN',
          'Đặt bàn đã hết hạn thanh toán',
          `Đặt bàn ${datBan.maDatBan} đã tự hủy do quá thời gian thanh toán.`,
        ),
      ),
    );

    return daHuy.length;
  }

  async danhSachQuanTri(dto: DanhSachThanhToanQuanTriDto) {
    const tuKhoa = dto.tuKhoa?.trim();
    const where: Prisma.thanh_toanWhereInput = {
      ...(dto.trangThai ? { trang_thai: dto.trangThai } : {}),
      ...(dto.phuongThuc ? { phuong_thuc: dto.phuongThuc } : {}),
      ...(tuKhoa
        ? {
            OR: [
              { ma_thanh_toan: { contains: tuKhoa } },
              { ma_giao_dich_cong: { contains: tuKhoa } },
              {
                dat_ban: {
                  is: {
                    ma_dat_ban: { contains: tuKhoa },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const skip = (dto.trang - 1) * dto.kichThuoc;
    const [rows, tong] = await Promise.all([
      this.prisma.thanh_toan.findMany({
        where,
        skip,
        take: dto.kichThuoc,
        orderBy: [
          { ngay_tao: 'desc' },
          { id: 'desc' },
        ],
        select: {
          id: true,
          ma_thanh_toan: true,
          dat_ban_id: true,
          so_tien: true,
          phuong_thuc: true,
          trang_thai: true,
          ma_giao_dich_cong: true,
          khoa_idempotency: true,
          thoi_gian_thanh_toan: true,
          ngay_tao: true,
          ngay_cap_nhat: true,
          dat_ban: {
            select: {
              ma_dat_ban: true,
              ho_ten: true,
              so_dien_thoai: true,
              ngay_dat: true,
              gio_bat_dau: true,
              trang_thai: true,
            },
          },
          hoan_tien: {
            where: {
              trang_thai: {
                in: ['CHO_HOAN', 'DANG_XU_LY', 'DA_HOAN'],
              },
            },
            select: {
              so_tien: true,
              trang_thai: true,
            },
          },
        },
      }),
      this.prisma.thanh_toan.count({ where }),
    ]);

    return {
      danhSach: rows.map((row) => ({
        ...this.toView(row),
        datBan: {
          maDatBan: row.dat_ban.ma_dat_ban,
          hoTen: row.dat_ban.ho_ten,
          soDienThoai: row.dat_ban.so_dien_thoai,
          ngayDat: row.dat_ban.ngay_dat,
          gioBatDau: row.dat_ban.gio_bat_dau,
          trangThai: row.dat_ban.trang_thai,
        },
        tongHoan: row.hoan_tien
          .filter((item) => item.trang_thai === 'DA_HOAN')
          .reduce(
            (tongTien, item) =>
              tongTien + Math.round(Number(item.so_tien)),
            0,
          ),
        coHoanTienDangCho: row.hoan_tien.some(
          (item) =>
            item.trang_thai === 'CHO_HOAN' ||
            item.trang_thai === 'DANG_XU_LY',
        ),
      })),
      phanTrang: {
        trang: dto.trang,
        kichThuoc: dto.kichThuoc,
        tong,
        tongTrang: Math.ceil(tong / dto.kichThuoc),
      },
    };
  }

  async chiTietQuanTri(id: string) {
    const thanhToanId = bigintTuChuoi(id, 'ID thanh toán');
    const row = await this.prisma.thanh_toan.findUnique({
      where: { id: thanhToanId },
      select: {
        id: true,
        ma_thanh_toan: true,
        dat_ban_id: true,
        so_tien: true,
        phuong_thuc: true,
        trang_thai: true,
        ma_giao_dich_cong: true,
        khoa_idempotency: true,
        ghi_chu: true,
        thoi_gian_thanh_toan: true,
        ngay_tao: true,
        ngay_cap_nhat: true,
        dat_ban: {
          select: {
            id: true,
            ma_dat_ban: true,
            ho_ten: true,
            so_dien_thoai: true,
            email: true,
            ngay_dat: true,
            gio_bat_dau: true,
            gio_ket_thuc: true,
            so_nguoi: true,
            trang_thai: true,
            tam_tinh_mon: true,
            tien_giam: true,
            tien_coc: true,
            tong_thanh_toan_truoc: true,
          },
        },
        hoan_tien: {
          orderBy: [
            { ngay_tao: 'asc' },
            { id: 'asc' },
          ],
          select: {
            id: true,
            ma_hoan_tien: true,
            so_tien: true,
            ly_do: true,
            trang_thai: true,
            ma_giao_dich_cong: true,
            khoa_idempotency: true,
            nguoi_thuc_hien_id: true,
            thoi_gian_hoan: true,
            ngay_tao: true,
            ngay_cap_nhat: true,
          },
        },
      },
    });

    if (!row) {
      throw new LoiNghiepVuException(
        'THANH_TOAN_001',
        'Không tìm thấy giao dịch thanh toán.',
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      ...this.toView(row),
      ghiChu: row.ghi_chu,
      datBan: {
        id: row.dat_ban.id,
        maDatBan: row.dat_ban.ma_dat_ban,
        hoTen: row.dat_ban.ho_ten,
        soDienThoai: row.dat_ban.so_dien_thoai,
        email: row.dat_ban.email,
        ngayDat: row.dat_ban.ngay_dat,
        gioBatDau: row.dat_ban.gio_bat_dau,
        gioKetThuc: row.dat_ban.gio_ket_thuc,
        soNguoi: row.dat_ban.so_nguoi,
        trangThai: row.dat_ban.trang_thai,
        tamTinhMon: Math.round(Number(row.dat_ban.tam_tinh_mon)),
        tienGiam: Math.round(Number(row.dat_ban.tien_giam)),
        tienCoc: Math.round(Number(row.dat_ban.tien_coc)),
        tongThanhToanTruoc: Math.round(
          Number(row.dat_ban.tong_thanh_toan_truoc),
        ),
      },
      hoanTien: row.hoan_tien.map((item) => ({
        id: item.id,
        maHoanTien: item.ma_hoan_tien,
        soTien: Math.round(Number(item.so_tien)),
        lyDo: item.ly_do,
        trangThai: item.trang_thai,
        maGiaoDichCong: item.ma_giao_dich_cong,
        khoaIdempotency: item.khoa_idempotency,
        nguoiThucHienId: item.nguoi_thuc_hien_id,
        thoiGianHoan: item.thoi_gian_hoan,
        ngayTao: item.ngay_tao,
        ngayCapNhat: item.ngay_cap_nhat,
      })),
    };
  }

  async xacNhanThuCong(
    id: string,
    dto: XacNhanThanhToanThuCongDto,
    taiKhoanId: string,
  ) {
    const thanhToanId = bigintTuChuoi(id, 'ID thanh toán');
    const nguoiThucHienId = bigintTuChuoi(
      taiKhoanId,
      'ID tài khoản',
    );

    const ketQua = await this.prisma.$transaction(async (tx) => {
      const row = await tx.thanh_toan.findUnique({
        where: { id: thanhToanId },
        select: {
          id: true,
          ma_thanh_toan: true,
          so_tien: true,
          trang_thai: true,
          dat_ban: {
            select: {
              id: true,
              ma_dat_ban: true,
              trang_thai: true,
              tong_thanh_toan_truoc: true,
            },
          },
        },
      });

      if (!row) {
        throw new LoiNghiepVuException(
          'THANH_TOAN_001',
          'Không tìm thấy giao dịch thanh toán.',
          HttpStatus.NOT_FOUND,
        );
      }

      if (row.trang_thai === 'DA_THANH_TOAN') {
        return {
          datBanId: row.dat_ban.id,
          maDatBan: row.dat_ban.ma_dat_ban,
          vuaXacNhanDatBan: false,
        };
      }

      if (row.trang_thai !== 'CHO_THANH_TOAN') {
        throw new LoiNghiepVuException(
          'THANH_TOAN_002',
          `Giao dịch đang ở trạng thái ${row.trang_thai} và không thể xác nhận.`,
          HttpStatus.CONFLICT,
        );
      }

      if (
        ['DA_HUY', 'DA_HOAN_THANH', 'KHONG_DEN'].includes(
          row.dat_ban.trang_thai,
        )
      ) {
        throw new LoiNghiepVuException(
          'THANH_TOAN_005',
          'Đặt bàn đã kết thúc nên không thể ghi nhận thanh toán.',
          HttpStatus.CONFLICT,
        );
      }

      const soTien = Math.round(Number(row.so_tien));
      const snapshot = Math.round(
        Number(row.dat_ban.tong_thanh_toan_truoc),
      );
      if (soTien !== snapshot) {
        throw new LoiNghiepVuException(
          'THANH_TOAN_003',
          'Số tiền giao dịch không khớp số tiền đã chốt của đặt bàn.',
          HttpStatus.CONFLICT,
        );
      }

      const thoiGian = new Date();
      const maGiaoDich =
        dto.maGiaoDichCong?.trim() ||
        `NOI_BO-${randomUUID()}`;

      const capNhat = await tx.thanh_toan.updateMany({
        where: {
          id: row.id,
          trang_thai: 'CHO_THANH_TOAN',
        },
        data: {
          phuong_thuc: dto.phuongThuc,
          trang_thai: 'DA_THANH_TOAN',
          ma_giao_dich_cong: maGiaoDich,
          thoi_gian_thanh_toan: thoiGian,
          ghi_chu:
            dto.ghiChu?.trim() ||
            `Nhân viên xác nhận thanh toán ${dto.phuongThuc}.`,
        },
      });

      if (capNhat.count !== 1) {
        throw new LoiNghiepVuException(
          'THANH_TOAN_002',
          'Giao dịch vừa thay đổi trạng thái. Vui lòng tải lại.',
          HttpStatus.CONFLICT,
        );
      }

      await this.danhDauKhuyenMaiDaDungTrongTransaction(
        tx,
        row.dat_ban.id,
      );

      let vuaXacNhanDatBan = false;
      if (row.dat_ban.trang_thai === 'CHO_XAC_NHAN') {
        const xacNhan = await tx.dat_ban.updateMany({
          where: {
            id: row.dat_ban.id,
            trang_thai: 'CHO_XAC_NHAN',
          },
          data: {
            trang_thai: 'DA_XAC_NHAN',
            thoi_gian_xac_nhan: thoiGian,
          },
        });

        if (xacNhan.count === 1) {
          await tx.lich_su_dat_ban.create({
            data: {
              dat_ban_id: row.dat_ban.id,
              trang_thai_cu: 'CHO_XAC_NHAN',
              trang_thai_moi: 'DA_XAC_NHAN',
              nguoi_thuc_hien_id: nguoiThucHienId,
              hanh_dong: 'THANH_TOAN_THU_CONG',
              ghi_chu:
                `Xác nhận ${dto.phuongThuc} cho ${row.ma_thanh_toan}.`,
            },
          });
          vuaXacNhanDatBan = true;
        }
      }

      return {
        datBanId: row.dat_ban.id,
        maDatBan: row.dat_ban.ma_dat_ban,
        vuaXacNhanDatBan,
      };
    }, { timeout: 10_000 });

    if (ketQua.vuaXacNhanDatBan) {
      await this.thongBao.taoChoDatBan(
        ketQua.datBanId,
        'THANH_TOAN_THANH_CONG',
        'Thanh toán thành công',
        `Đặt bàn ${ketQua.maDatBan} đã được xác nhận thanh toán.`,
      );
    }

    return this.chiTietQuanTri(id);
  }

  async xacNhanHoanTienQuanTri(
    id: string,
    dto: XacNhanHoanTienDto,
    taiKhoanId: string,
  ) {
    const hoanTienId = bigintTuChuoi(id, 'ID hoàn tiền');
    const nguoiThucHienId = bigintTuChuoi(
      taiKhoanId,
      'ID tài khoản',
    );

    const thanhToanId = await this.prisma.$transaction(async (tx) => {
      const row = await tx.hoan_tien.findUnique({
        where: { id: hoanTienId },
        select: {
          id: true,
          thanh_toan_id: true,
          so_tien: true,
          trang_thai: true,
          thanh_toan: {
            select: {
              id: true,
              so_tien: true,
              dat_ban: {
                select: {
                  trang_thai: true,
                },
              },
            },
          },
        },
      });

      if (!row) {
        throw new LoiNghiepVuException(
          'HOAN_TIEN_001',
          'Không tìm thấy yêu cầu hoàn tiền.',
          HttpStatus.NOT_FOUND,
        );
      }

      if (row.trang_thai === 'DA_HOAN') {
        return row.thanh_toan_id;
      }

      if (!['CHO_HOAN', 'DANG_XU_LY'].includes(row.trang_thai)) {
        throw new LoiNghiepVuException(
          'HOAN_TIEN_002',
          `Yêu cầu hoàn tiền đang ở trạng thái ${row.trang_thai}.`,
          HttpStatus.CONFLICT,
        );
      }

      if (row.thanh_toan.dat_ban.trang_thai !== 'DA_HUY') {
        throw new LoiNghiepVuException(
          'HOAN_TIEN_003',
          'Chỉ xác nhận hoàn tiền sau khi đặt bàn đã hủy.',
          HttpStatus.CONFLICT,
        );
      }

      const capNhat = await tx.hoan_tien.updateMany({
        where: {
          id: row.id,
          trang_thai: {
            in: ['CHO_HOAN', 'DANG_XU_LY'],
          },
        },
        data: {
          trang_thai: 'DA_HOAN',
          ma_giao_dich_cong:
            dto.maGiaoDichCong?.trim() ||
            `REFUND-NOI_BO-${randomUUID()}`,
          nguoi_thuc_hien_id: nguoiThucHienId,
          thoi_gian_hoan: new Date(),
          ly_do: dto.ghiChu?.trim()
            ? `${dto.ghiChu.trim()}`
            : undefined,
        },
      });

      if (capNhat.count !== 1) {
        throw new LoiNghiepVuException(
          'HOAN_TIEN_002',
          'Yêu cầu hoàn tiền vừa thay đổi trạng thái. Vui lòng tải lại.',
          HttpStatus.CONFLICT,
        );
      }

      const tongHoan = await tx.hoan_tien.aggregate({
        where: {
          thanh_toan_id: row.thanh_toan_id,
          trang_thai: 'DA_HOAN',
        },
        _sum: {
          so_tien: true,
        },
      });

      const daHoan = Math.round(
        Number(tongHoan._sum.so_tien ?? 0),
      );
      const daThu = Math.round(
        Number(row.thanh_toan.so_tien),
      );

      await tx.thanh_toan.update({
        where: { id: row.thanh_toan_id },
        data: {
          trang_thai:
            daHoan >= daThu
              ? 'DA_HOAN_TIEN'
              : 'HOAN_MOT_PHAN',
        },
      });

      return row.thanh_toan_id;
    }, { timeout: 10_000 });

    return this.chiTietQuanTri(
      thanhToanId.toString(),
    );
  }

  private damBaoMoPhongDuocPhep(): void {
    const nodeEnv =
      (this.config.get<string>('NODE_ENV') ?? 'development')
        .trim()
        .toLowerCase();
    const choPhepProduction =
      (this.config.get<string>('PAYMENT_DEMO_ENABLED') ?? '')
        .trim()
        .toLowerCase() === 'true';

    if (nodeEnv === 'production' && !choPhepProduction) {
      throw new LoiNghiepVuException(
        'THANH_TOAN_006',
        'Thanh toán mô phỏng bị tắt trong môi trường production.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  private toView(row: ThanhToanView) {
    return {
      id: row.id,
      maThanhToan: row.ma_thanh_toan,
      datBanId: row.dat_ban_id,
      soTien: Math.round(Number(row.so_tien)),
      phuongThuc: row.phuong_thuc,
      trangThai: row.trang_thai,
      maGiaoDichCong: row.ma_giao_dich_cong,
      khoaIdempotency: row.khoa_idempotency,
      thoiGianThanhToan: row.thoi_gian_thanh_toan,
      ngayTao: row.ngay_tao,
      ngayCapNhat: row.ngay_cap_nhat,
    };
  }
}
