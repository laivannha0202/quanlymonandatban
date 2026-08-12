import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client';

const XAC_NHAN = 'DEMO_SEED_CONFIRM';
const MOT_NGAY_MS = 86_400_000;

function taoPrisma(): PrismaClient {
  if (process.env[XAC_NHAN] !== 'YES') {
    throw new Error(
      `Chỉ được chạy seed demo khi ${XAC_NHAN}=YES.`,
    );
  }

  if (String(process.env.NODE_ENV ?? 'development') === 'production') {
    throw new Error('Từ chối chạy seed demo trong NODE_ENV=production.');
  }

  const databaseUrl = process.env.DATABASE_URL || '';
  if (!databaseUrl) {
    throw new Error('Thiếu DATABASE_URL.');
  }

  const diaChi = new URL(databaseUrl);
  const database = diaChi.pathname.replace(/^\//, '');
  const host = diaChi.hostname.toLowerCase();

  if (!['127.0.0.1', 'localhost', '::1'].includes(host)) {
    throw new Error(
      `Seed demo chỉ được chạy trên MySQL local. Host hiện tại: ${diaChi.hostname}`,
    );
  }

  if (!database || /(?:^|_)ci(?:_|$)/i.test(database) || /ci$/i.test(database)) {
    throw new Error(
      `Từ chối seed demo vào database CI/không hợp lệ: ${database || '(trống)'}`,
    );
  }

  const adapter = new PrismaMariaDb({
    host: diaChi.hostname,
    port: Number(diaChi.port || 3306),
    user: decodeURIComponent(diaChi.username),
    password: decodeURIComponent(diaChi.password),
    database,
    connectionLimit: 3,
    allowPublicKeyRetrieval: true,
  });

  return new PrismaClient({ adapter });
}

function ngayVietNam(offsetNgay = 0): string {
  const moc = Date.now() + 7 * 60 * 60 * 1000 + offsetNgay * MOT_NGAY_MS;
  return new Date(moc).toISOString().slice(0, 10);
}

function ngaySql(offsetNgay = 0): Date {
  return new Date(`${ngayVietNam(offsetNgay)}T00:00:00.000Z`);
}

function gioVietNam(offsetNgay: number, gio: number, phut = 0): Date {
  const ngay = ngayVietNam(offsetNgay);
  return new Date(
    `${ngay}T${String(gio).padStart(2, '0')}:${String(phut).padStart(2, '0')}:00+07:00`,
  );
}

function truoc(moc: Date, phut: number): Date {
  return new Date(moc.getTime() - phut * 60_000);
}

function sau(moc: Date, phut: number): Date {
  return new Date(moc.getTime() + phut * 60_000);
}

function giaTriMoiTruong(khoa: string): string | undefined {
  const value = process.env[khoa]?.trim();
  return value || undefined;
}

function laPlaceholder(khoa: string, giaTri: string): boolean {
  const value = giaTri.trim().toLowerCase();
  const placeholders: Record<string, string[]> = {
    TEN_NHA_HANG: ['', 'nhà hàng', 'nhà hàng ci'],
    DIA_CHI_NHA_HANG: [
      '',
      'môi trường kiểm thử ci',
      'khu vực phục vụ tại nhà hàng',
    ],
    SO_DIEN_THOAI_NHA_HANG: ['', '0900000000', '0900 000 000'],
    EMAIL_NHA_HANG: ['', 'ci@example.local', 'hello@nhahang.local'],
  };

  return (placeholders[khoa] ?? []).some(
    (item) => item.toLowerCase() === value,
  );
}

async function capNhatBranding(prisma: PrismaClient): Promise<void> {
  const macDinh: Record<string, string> = {
    TEN_NHA_HANG: 'Nhà hàng Hương Việt',
    DIA_CHI_NHA_HANG: 'Hà Nội, Việt Nam',
    SO_DIEN_THOAI_NHA_HANG: '024 7300 8899',
    EMAIL_NHA_HANG: 'datban@huongviet.vn',
  };

  const envTheoKhoa: Record<string, string> = {
    TEN_NHA_HANG: 'DEMO_TEN_NHA_HANG',
    DIA_CHI_NHA_HANG: 'DEMO_DIA_CHI_NHA_HANG',
    SO_DIEN_THOAI_NHA_HANG: 'DEMO_SO_DIEN_THOAI_NHA_HANG',
    EMAIL_NHA_HANG: 'DEMO_EMAIL_NHA_HANG',
  };

  for (const [khoa, fallback] of Object.entries(macDinh)) {
    const hienTai = await prisma.cau_hinh.findUnique({ where: { khoa } });
    const envValue = giaTriMoiTruong(envTheoKhoa[khoa]);

    if (!hienTai) {
      await prisma.cau_hinh.create({
        data: {
          khoa,
          gia_tri: envValue || fallback,
          kieu_du_lieu: 'CHUOI',
          nhom: 'THONG_TIN_NHA_HANG',
          mo_ta: `Thông tin công khai: ${khoa}`,
          cho_phep_sua: true,
        },
      });
      continue;
    }

    if (envValue || laPlaceholder(khoa, hienTai.gia_tri)) {
      await prisma.cau_hinh.update({
        where: { khoa },
        data: {
          gia_tri: envValue || fallback,
          kieu_du_lieu: 'CHUOI',
          nhom: 'THONG_TIN_NHA_HANG',
          cho_phep_sua: true,
        },
      });
    }
  }
}

async function main(): Promise<void> {
  const prisma = taoPrisma();

  try {
    await capNhatBranding(prisma);

    const khuVucData = [
      {
        ma: 'HV_KV_SAN_VUON',
        ten: 'Sân vườn',
        moTa: 'Không gian thoáng, nhiều ánh sáng, phù hợp gia đình và nhóm bạn.',
        hinhAnh: '/hinh-anh/khong-gian-1.jpg',
        thuTu: 1,
      },
      {
        ma: 'HV_KV_PHONG_LANH',
        ten: 'Phòng điều hòa',
        moTa: 'Không gian yên tĩnh, mát mẻ, phù hợp dùng bữa và gặp gỡ.',
        hinhAnh: '/hinh-anh/khong-gian-2.jpg',
        thuTu: 2,
      },
      {
        ma: 'HV_KV_RIENG',
        ten: 'Phòng riêng',
        moTa: 'Không gian riêng tư cho tiệc nhỏ, sinh nhật và tiếp khách.',
        hinhAnh: '/hinh-anh/khong-gian-3.jpg',
        thuTu: 3,
      },
    ] as const;

    const khuVucIds = new Map<string, bigint>();

    for (const item of khuVucData) {
      const row = await prisma.khu_vuc.upsert({
        where: { ma_khu_vuc: item.ma },
        create: {
          ma_khu_vuc: item.ma,
          ten_khu_vuc: item.ten,
          mo_ta: item.moTa,
          hinh_anh: item.hinhAnh,
          thu_tu: item.thuTu,
          trang_thai: 'HOAT_DONG',
        },
        update: {
          ten_khu_vuc: item.ten,
          mo_ta: item.moTa,
          hinh_anh: item.hinhAnh,
          thu_tu: item.thuTu,
          trang_thai: 'HOAT_DONG',
          ngay_xoa: null,
        },
      });

      khuVucIds.set(item.ma, row.id);
    }

    const banData = [
      ['HV_SV01', 'Bàn Sân vườn 01', 'HV_KV_SAN_VUON', 2, 4],
      ['HV_SV02', 'Bàn Sân vườn 02', 'HV_KV_SAN_VUON', 2, 4],
      ['HV_SV03', 'Bàn Sân vườn 03', 'HV_KV_SAN_VUON', 4, 6],
      ['HV_SV04', 'Bàn Sân vườn 04', 'HV_KV_SAN_VUON', 6, 8],
      ['HV_PL01', 'Bàn Điều hòa 01', 'HV_KV_PHONG_LANH', 2, 4],
      ['HV_PL02', 'Bàn Điều hòa 02', 'HV_KV_PHONG_LANH', 2, 4],
      ['HV_PL03', 'Bàn Điều hòa 03', 'HV_KV_PHONG_LANH', 4, 6],
      ['HV_PL04', 'Bàn Điều hòa 04', 'HV_KV_PHONG_LANH', 6, 8],
      ['HV_PR01', 'Bàn Phòng riêng 01', 'HV_KV_RIENG', 4, 6],
      ['HV_PR02', 'Bàn Phòng riêng 02', 'HV_KV_RIENG', 6, 8],
      ['HV_PR03', 'Bàn Phòng riêng 03', 'HV_KV_RIENG', 8, 10],
      ['HV_PR04', 'Bàn Phòng riêng 04', 'HV_KV_RIENG', 10, 12],
    ] as const;

    const banIds = new Map<string, bigint>();

    for (const [maBan, tenBan, khuVucMa, sucChua, sucChuaToiDa] of banData) {
      const row = await prisma.ban_an.upsert({
        where: { ma_ban: maBan },
        create: {
          ma_ban: maBan,
          ten_ban: tenBan,
          khu_vuc_id: khuVucIds.get(khuVucMa)!,
          suc_chua: sucChua,
          suc_chua_toi_da: sucChuaToiDa,
          trang_thai: maBan === 'HV_SV01' ? 'DANG_SU_DUNG' : 'TRONG',
          ghi_chu: 'Bàn dữ liệu trình diễn Hương Việt',
        },
        update: {
          ten_ban: tenBan,
          khu_vuc_id: khuVucIds.get(khuVucMa)!,
          suc_chua: sucChua,
          suc_chua_toi_da: sucChuaToiDa,
          trang_thai: maBan === 'HV_SV01' ? 'DANG_SU_DUNG' : 'TRONG',
          ghi_chu: 'Bàn dữ liệu trình diễn Hương Việt',
          ngay_xoa: null,
        },
      });

      banIds.set(maBan, row.id);
    }

    if (process.env.DEMO_ISOLATE_PUBLIC_BOOKING === 'YES') {
      // Chế độ trình diễn: chỉ cho public booking dùng bộ khu vực/bàn HV.
      // Không xóa dữ liệu cũ; các bản ghi cũ vẫn còn để xem lịch sử trong hệ thống.
      await prisma.ban_an.updateMany({
        where: {
          ngay_xoa: null,
          NOT: { ma_ban: { startsWith: 'HV_' } },
        },
        data: { trang_thai: 'NGUNG_SU_DUNG' },
      });

      await prisma.khu_vuc.updateMany({
        where: {
          ngay_xoa: null,
          NOT: { ma_khu_vuc: { startsWith: 'HV_' } },
        },
        data: { trang_thai: 'NGUNG_HOAT_DONG' },
      });

      console.log('DEMO_PUBLIC_BOOKING_ISOLATED=YES');
    }

    const danhMucData = [
      {
        ma: 'HV_DM_KHAI_VI',
        ten: 'Khai vị',
        duongDan: 'khai-vi-huong-viet',
        moTa: 'Những món mở đầu nhẹ nhàng, tươi vị và dễ chia sẻ.',
        hinhAnh: '/hinh-anh/mon-an-1.jpg',
        thuTu: 1,
      },
      {
        ma: 'HV_DM_MON_CHINH',
        ten: 'Món chính',
        duongDan: 'mon-chinh-huong-viet',
        moTa: 'Các món Việt đậm đà, phù hợp bữa trưa, bữa tối và dùng chung.',
        hinhAnh: '/hinh-anh/mon-an-2.jpg',
        thuTu: 2,
      },
      {
        ma: 'HV_DM_DO_UONG',
        ten: 'Đồ uống',
        duongDan: 'do-uong-huong-viet',
        moTa: 'Đồ uống mát, cà phê và thức uống quen thuộc.',
        hinhAnh: '/hinh-anh/mon-an-5.jpg',
        thuTu: 3,
      },
      {
        ma: 'HV_DM_TRANG_MIENG',
        ten: 'Tráng miệng',
        duongDan: 'trang-mieng-huong-viet',
        moTa: 'Vị ngọt nhẹ để khép lại bữa ăn trọn vẹn.',
        hinhAnh: '/hinh-anh/mon-an-6.jpg',
        thuTu: 4,
      },
    ] as const;

    const danhMucIds = new Map<string, bigint>();

    for (const item of danhMucData) {
      const row = await prisma.danh_muc_mon.upsert({
        where: { ma_danh_muc: item.ma },
        create: {
          ma_danh_muc: item.ma,
          ten_danh_muc: item.ten,
          duong_dan: item.duongDan,
          mo_ta: item.moTa,
          hinh_anh: item.hinhAnh,
          thu_tu: item.thuTu,
          trang_thai: 'HOAT_DONG',
        },
        update: {
          ten_danh_muc: item.ten,
          duong_dan: item.duongDan,
          mo_ta: item.moTa,
          hinh_anh: item.hinhAnh,
          thu_tu: item.thuTu,
          trang_thai: 'HOAT_DONG',
          ngay_xoa: null,
        },
      });

      danhMucIds.set(item.ma, row.id);
    }

    if (process.env.DEMO_ISOLATE_PUBLIC_MENU === 'YES') {
      // Chế độ trình diễn: chỉ ẩn khỏi public catalog, không xóa dữ liệu cũ.
      await prisma.mon_an.updateMany({
        where: {
          ngay_xoa: null,
          NOT: { ma_mon: { startsWith: 'HV' } },
        },
        data: {
          trang_thai: 'NGUNG_HOAT_DONG',
          con_mon: false,
          la_mon_noi_bat: false,
        },
      });

      await prisma.danh_muc_mon.updateMany({
        where: {
          ngay_xoa: null,
          NOT: { ma_danh_muc: { startsWith: 'HV_' } },
        },
        data: { trang_thai: 'NGUNG_HOAT_DONG' },
      });

      console.log('DEMO_PUBLIC_MENU_ISOLATED=YES');
    }

    const monData = [
      ['HV001', 'HV_DM_KHAI_VI', 'Gỏi cuốn tôm thịt', 'goi-cuon-tom-thit-huong-viet', 'Tôm, thịt, bún và rau thơm cuốn bánh tráng, dùng cùng nước chấm đậm vị.', 69000, null, '/hinh-anh/mon-demo/goi-cuon.jpg', false],
      ['HV002', 'HV_DM_KHAI_VI', 'Chả giò Hương Việt', 'cha-gio-huong-viet', 'Chả giò chiên vàng giòn, nhân thịt và rau củ, ăn kèm rau sống.', 79000, 69000, '/hinh-anh/mon-noi-bat/cha-gio.jpg', true],
      ['HV003', 'HV_DM_MON_CHINH', 'Bún bò Huế đặc biệt', 'bun-bo-hue-dac-biet', 'Nước dùng thơm sả, thịt bò mềm, chả Huế và rau sống tươi.', 89000, null, '/hinh-anh/mon-noi-bat/bun-bo-hue.jpg', true],
      ['HV004', 'HV_DM_MON_CHINH', 'Phở bò tái nạm', 'pho-bo-tai-nam-huong-viet', 'Nước phở trong, thơm quế hồi, bò tái và nạm thái mỏng.', 85000, null, '/hinh-anh/mon-noi-bat/pho-bo.jpg', true],
      ['HV005', 'HV_DM_MON_CHINH', 'Cơm gà nướng mật ong', 'com-ga-nuong-mat-ong', 'Đùi gà nướng vàng, sốt mật ong nhẹ, dùng cùng cơm và rau củ.', 109000, 99000, '/hinh-anh/mon-noi-bat/com-ga-nuong.jpg', true],
      ['HV006', 'HV_DM_MON_CHINH', 'Cá kho tộ', 'ca-kho-to-huong-viet', 'Cá kho tiêu trong tộ đất, vị mặn ngọt cân bằng, hợp dùng với cơm nóng.', 149000, null, '/hinh-anh/mon-noi-bat/ca-kho-to.jpg', true],
      ['HV007', 'HV_DM_MON_CHINH', 'Rau muống xào tỏi', 'rau-muong-xao-toi-huong-viet', 'Rau muống xanh giòn xào nhanh cùng tỏi thơm.', 69000, null, '/hinh-anh/mon-demo/rau-muong-xao-toi.jpg', false],
      ['HV008', 'HV_DM_MON_CHINH', 'Lẩu Thái hải sản', 'lau-thai-hai-san-huong-viet', 'Nước lẩu chua cay, tôm mực và rau nấm, phù hợp nhóm 3–4 người.', 329000, 299000, '/hinh-anh/mon-noi-bat/lau-thai.jpg', true],
      ['HV009', 'HV_DM_DO_UONG', 'Trà tắc mật ong', 'tra-tac-mat-ong-huong-viet', 'Trà thanh mát, tắc tươi và mật ong dịu nhẹ.', 39000, null, '/hinh-anh/mon-demo/tra-tac-mat-ong.jpg', false],
      ['HV010', 'HV_DM_DO_UONG', 'Cà phê sữa đá', 'ca-phe-sua-da-huong-viet', 'Cà phê rang đậm pha cùng sữa đặc theo phong cách Việt.', 45000, null, '/hinh-anh/mon-demo/ca-phe-sua-da.jpg', false],
      ['HV011', 'HV_DM_TRANG_MIENG', 'Chè khúc bạch', 'che-khuc-bach-huong-viet', 'Khúc bạch mềm, nhãn và hạnh nhân trong nước đường thanh.', 49000, null, '/hinh-anh/mon-demo/che-khuc-bach.jpg', false],
      ['HV012', 'HV_DM_TRANG_MIENG', 'Bánh flan cà phê', 'banh-flan-ca-phe-huong-viet', 'Flan mềm mịn, caramel và chút cà phê thơm.', 45000, 39000, '/hinh-anh/mon-demo/banh-flan.jpg', false],
    ] as const;

    const maMonNoiBatDemo = [
      'HV002',
      'HV003',
      'HV004',
      'HV005',
      'HV006',
      'HV008',
    ];

    // Seed demo local chủ động chuẩn hóa "món nổi bật" để trang chủ
    // không trộn dữ liệu cũ với bộ dữ liệu trình diễn. Không xóa món cũ.
    await prisma.mon_an.updateMany({
      where: {
        la_mon_noi_bat: true,
        ma_mon: { notIn: maMonNoiBatDemo },
      },
      data: { la_mon_noi_bat: false },
    });

    for (const [
      maMon,
      danhMucMa,
      tenMon,
      duongDan,
      moTa,
      gia,
      giaKhuyenMai,
      hinhAnh,
      noiBat,
    ] of monData) {
      await prisma.mon_an.upsert({
        where: { ma_mon: maMon },
        create: {
          ma_mon: maMon,
          danh_muc_id: danhMucIds.get(danhMucMa)!,
          ten_mon: tenMon,
          duong_dan: duongDan,
          mo_ta: moTa,
          gia,
          gia_khuyen_mai: giaKhuyenMai,
          hinh_anh_chinh: hinhAnh,
          la_mon_noi_bat: noiBat,
          con_mon: true,
          trang_thai: 'HOAT_DONG',
        },
        update: {
          danh_muc_id: danhMucIds.get(danhMucMa)!,
          ten_mon: tenMon,
          duong_dan: duongDan,
          mo_ta: moTa,
          gia,
          gia_khuyen_mai: giaKhuyenMai,
          hinh_anh_chinh: hinhAnh,
          la_mon_noi_bat: noiBat,
          con_mon: true,
          trang_thai: 'HOAT_DONG',
          ngay_xoa: null,
        },
      });
    }

    const khachData = [
      ['HV_KH001', 'Nguyễn Minh Anh', '0938000101', 'minhanh@example.com', 'NU'],
      ['HV_KH002', 'Trần Quốc Bảo', '0938000102', 'quocbao@example.com', 'NAM'],
      ['HV_KH003', 'Lê Thảo Vy', '0938000103', 'thaovy@example.com', 'NU'],
      ['HV_KH004', 'Phạm Gia Huy', '0938000104', 'giahuy@example.com', 'NAM'],
      ['HV_KH005', 'Võ Ngọc Mai', '0938000105', 'ngocmai@example.com', 'NU'],
      ['HV_KH006', 'Đặng Hoàng Nam', '0938000106', 'hoangnam@example.com', 'NAM'],
      ['HV_KH007', 'Bùi Khánh Linh', '0938000107', 'khanhlinh@example.com', 'NU'],
      ['HV_KH008', 'Đỗ Thanh Tùng', '0938000108', 'thanhtung@example.com', 'NAM'],
    ] as const;

    const khachIds: bigint[] = [];

    for (let i = 0; i < khachData.length; i += 1) {
      const [ma, hoTen, soDienThoai, email, gioiTinh] = khachData[i];
      const row = await prisma.khach_hang.upsert({
        where: { so_dien_thoai: soDienThoai },
        create: {
          ma_khach_hang: ma,
          ho_ten: hoTen,
          so_dien_thoai: soDienThoai,
          email,
          gioi_tinh: gioiTinh,
          ghi_chu: 'Khách hàng dữ liệu trình diễn',
          trang_thai: 'HOAT_DONG',
          ngay_tao: new Date(Date.now() - (i + 2) * MOT_NGAY_MS),
        },
        update: {
          ma_khach_hang: ma,
          ho_ten: hoTen,
          email,
          gioi_tinh: gioiTinh,
          ghi_chu: 'Khách hàng dữ liệu trình diễn',
          trang_thai: 'HOAT_DONG',
          ngay_xoa: null,
          ngay_tao: new Date(Date.now() - (i + 2) * MOT_NGAY_MS),
        },
      });

      khachIds.push(row.id);
    }

    const batDauKhuyenMai = gioVietNam(-14, 0, 0);
    const ketThucKhuyenMai = gioVietNam(60, 23, 59);

    const khuyenMaiData = [
      ['HVWELCOME', 'Chào bàn mới - giảm 15%', 'Ưu đãi 15% cho trải nghiệm dùng bữa tại Hương Việt.', 'PHAN_TRAM', 15, 250000, 80000],
      ['HVTIEC', 'Tiệc nhóm vui hơn - giảm 120K', 'Giảm trực tiếp 120.000đ cho nhóm bạn và gia đình có hóa đơn từ 700.000đ.', 'SO_TIEN', 120000, 700000, null],
      ['HAPPYHOUR', 'Khung giờ thân quen - giảm 10%', 'Ưu đãi 10% trong chương trình khuyến mãi theo mùa của nhà hàng.', 'PHAN_TRAM', 10, 180000, 50000],
    ] as const;

    for (const [
      ma,
      ten,
      moTa,
      loaiGiam,
      giaTri,
      giaTriDonToiThieu,
      giamToiDa,
    ] of khuyenMaiData) {
      await prisma.khuyen_mai.upsert({
        where: { ma_khuyen_mai: ma },
        create: {
          ma_khuyen_mai: ma,
          ten_khuyen_mai: ten,
          mo_ta: moTa,
          loai_giam: loaiGiam,
          gia_tri: giaTri,
          gia_tri_don_toi_thieu: giaTriDonToiThieu,
          giam_toi_da: giamToiDa,
          ngay_bat_dau: batDauKhuyenMai,
          ngay_ket_thuc: ketThucKhuyenMai,
          so_luot_toi_da: 500,
          so_luot_da_dung: 24,
          trang_thai: 'HOAT_DONG',
        },
        update: {
          ten_khuyen_mai: ten,
          mo_ta: moTa,
          loai_giam: loaiGiam,
          gia_tri: giaTri,
          gia_tri_don_toi_thieu: giaTriDonToiThieu,
          giam_toi_da: giamToiDa,
          ngay_bat_dau: batDauKhuyenMai,
          ngay_ket_thuc: ketThucKhuyenMai,
          so_luot_toi_da: 500,
          so_luot_da_dung: 24,
          trang_thai: 'HOAT_DONG',
          ngay_xoa: null,
        },
      });
    }

    const banCodes = [...banIds.keys()];
    const nguonDat = ['WEBSITE', 'DIEN_THOAI', 'FACEBOOK', 'TRUC_TIEP'] as const;
    const bookingIds: bigint[] = [];

    for (let i = 1; i <= 24; i += 1) {
      const offset = -i;
      const startHour = 11 + (i % 8);
      const start = gioVietNam(offset, startHour, i % 2 ? 30 : 0);
      const end = sau(start, 120);
      const mod = i % 7;
      const trangThai =
        mod === 0
          ? 'DA_HUY'
          : mod === 3
            ? 'KHONG_DEN'
            : 'DA_HOAN_THANH';
      const khachIndex = i % khachIds.length;
      const banCode = banCodes[i % banCodes.length];
      const khuVucMa = banData.find((x) => x[0] === banCode)![2];
      const khach = khachData[khachIndex];

      const row = await prisma.dat_ban.upsert({
        where: { ma_dat_ban: `HVDB${String(i).padStart(4, '0')}` },
        create: {
          ma_dat_ban: `HVDB${String(i).padStart(4, '0')}`,
          khach_hang_id: khachIds[khachIndex],
          khu_vuc_id: khuVucIds.get(khuVucMa)!,
          ho_ten: khach[1],
          so_dien_thoai: khach[2],
          email: khach[3],
          ngay_dat: ngaySql(offset),
          gio_bat_dau: start,
          gio_ket_thuc: end,
          so_nguoi: 2 + (i % 5),
          trang_thai: trangThai,
          nguon_dat: nguonDat[i % nguonDat.length],
          kieu_xep_ban: 'NHAN_VIEN_SAP_XEP',
          ghi_chu_khach: i % 4 === 0 ? 'Ưu tiên bàn yên tĩnh.' : null,
          ghi_chu_noi_bo: 'Dữ liệu trình diễn báo cáo 30 ngày',
          thoi_gian_xac_nhan: truoc(start, 180),
          thoi_gian_check_in: trangThai === 'DA_HOAN_THANH' ? start : null,
          thoi_gian_hoan_thanh: trangThai === 'DA_HOAN_THANH' ? end : null,
          thoi_gian_huy: trangThai === 'DA_HUY' ? truoc(start, 360) : null,
          ly_do_huy: trangThai === 'DA_HUY' ? 'Khách thay đổi kế hoạch.' : null,
          ngay_tao: truoc(start, 1440),
        },
        update: {
          khach_hang_id: khachIds[khachIndex],
          khu_vuc_id: khuVucIds.get(khuVucMa)!,
          ho_ten: khach[1],
          so_dien_thoai: khach[2],
          email: khach[3],
          ngay_dat: ngaySql(offset),
          gio_bat_dau: start,
          gio_ket_thuc: end,
          so_nguoi: 2 + (i % 5),
          trang_thai: trangThai,
          nguon_dat: nguonDat[i % nguonDat.length],
          kieu_xep_ban: 'NHAN_VIEN_SAP_XEP',
          ghi_chu_khach: i % 4 === 0 ? 'Ưu tiên bàn yên tĩnh.' : null,
          ghi_chu_noi_bo: 'Dữ liệu trình diễn báo cáo 30 ngày',
          thoi_gian_xac_nhan: truoc(start, 180),
          thoi_gian_check_in: trangThai === 'DA_HOAN_THANH' ? start : null,
          thoi_gian_hoan_thanh: trangThai === 'DA_HOAN_THANH' ? end : null,
          thoi_gian_huy: trangThai === 'DA_HUY' ? truoc(start, 360) : null,
          ly_do_huy: trangThai === 'DA_HUY' ? 'Khách thay đổi kế hoạch.' : null,
          ngay_tao: truoc(start, 1440),
        },
      });

      await prisma.chi_tiet_dat_ban.deleteMany({
        where: { dat_ban_id: row.id },
      });
      await prisma.chi_tiet_dat_ban.create({
        data: {
          dat_ban_id: row.id,
          ban_an_id: banIds.get(banCode)!,
        },
      });

      bookingIds.push(row.id);
    }

    const now = new Date();
    const todaySpecs = [
      {
        code: 'HVDB0025',
        start: gioVietNam(0, 11, 30),
        end: gioVietNam(0, 13, 30),
        status: 'DA_HOAN_THANH',
        people: 2,
        customerIndex: 0,
        table: 'HV_PL01',
        source: 'WEBSITE',
      },
      {
        code: 'HVDB0026',
        start: gioVietNam(0, 12, 45),
        end: gioVietNam(0, 14, 15),
        status: 'DA_HOAN_THANH',
        people: 4,
        customerIndex: 1,
        table: 'HV_PL03',
        source: 'DIEN_THOAI',
      },
      {
        code: 'HVDB0027',
        start: new Date(now.getTime() - 30 * 60_000),
        end: new Date(now.getTime() + 90 * 60_000),
        status: 'DA_CHECK_IN',
        people: 4,
        customerIndex: 2,
        table: 'HV_SV01',
        source: 'TRUC_TIEP',
      },
      {
        code: 'HVDB0028',
        start: gioVietNam(0, 18, 0),
        end: gioVietNam(0, 20, 0),
        status: 'DA_XAC_NHAN',
        people: 3,
        customerIndex: 3,
        table: 'HV_SV03',
        source: 'WEBSITE',
      },
      {
        code: 'HVDB0029',
        start: gioVietNam(0, 19, 30),
        end: gioVietNam(0, 21, 30),
        status: 'CHO_XAC_NHAN',
        people: 2,
        customerIndex: 4,
        table: 'HV_PL02',
        source: 'FACEBOOK',
      },
      {
        code: 'HVDB0030',
        start: gioVietNam(0, 20, 0),
        end: gioVietNam(0, 22, 0),
        status: 'DA_XAC_NHAN',
        people: 6,
        customerIndex: 5,
        table: 'HV_PR02',
        source: 'WEBSITE',
      },
      {
        code: 'HVDB0031',
        start: gioVietNam(0, 17, 0),
        end: gioVietNam(0, 19, 0),
        status: 'DA_HUY',
        people: 5,
        customerIndex: 6,
        table: 'HV_PR01',
        source: 'DIEN_THOAI',
      },
    ] as const;

    for (const item of todaySpecs) {
      const khach = khachData[item.customerIndex];
      const banDataItem = banData.find((x) => x[0] === item.table)!;
      const khuVucMa = banDataItem[2];

      const row = await prisma.dat_ban.upsert({
        where: { ma_dat_ban: item.code },
        create: {
          ma_dat_ban: item.code,
          khach_hang_id: khachIds[item.customerIndex],
          khu_vuc_id: khuVucIds.get(khuVucMa)!,
          ho_ten: khach[1],
          so_dien_thoai: khach[2],
          email: khach[3],
          ngay_dat: ngaySql(0),
          gio_bat_dau: item.start,
          gio_ket_thuc: item.end,
          so_nguoi: item.people,
          trang_thai: item.status,
          nguon_dat: item.source,
          kieu_xep_ban: 'NHAN_VIEN_SAP_XEP',
          ghi_chu_noi_bo: 'Dữ liệu trình diễn dashboard hôm nay',
          thoi_gian_xac_nhan:
            item.status === 'CHO_XAC_NHAN' ? null : truoc(item.start, 120),
          thoi_gian_check_in:
            item.status === 'DA_CHECK_IN' || item.status === 'DA_HOAN_THANH'
              ? item.start
              : null,
          thoi_gian_hoan_thanh:
            item.status === 'DA_HOAN_THANH' ? item.end : null,
          thoi_gian_huy:
            item.status === 'DA_HUY' ? truoc(item.start, 180) : null,
          ly_do_huy:
            item.status === 'DA_HUY' ? 'Khách chủ động đổi lịch.' : null,
          ngay_tao: truoc(item.start, 720),
        },
        update: {
          khach_hang_id: khachIds[item.customerIndex],
          khu_vuc_id: khuVucIds.get(khuVucMa)!,
          ho_ten: khach[1],
          so_dien_thoai: khach[2],
          email: khach[3],
          ngay_dat: ngaySql(0),
          gio_bat_dau: item.start,
          gio_ket_thuc: item.end,
          so_nguoi: item.people,
          trang_thai: item.status,
          nguon_dat: item.source,
          kieu_xep_ban: 'NHAN_VIEN_SAP_XEP',
          ghi_chu_noi_bo: 'Dữ liệu trình diễn dashboard hôm nay',
          thoi_gian_xac_nhan:
            item.status === 'CHO_XAC_NHAN' ? null : truoc(item.start, 120),
          thoi_gian_check_in:
            item.status === 'DA_CHECK_IN' || item.status === 'DA_HOAN_THANH'
              ? item.start
              : null,
          thoi_gian_hoan_thanh:
            item.status === 'DA_HOAN_THANH' ? item.end : null,
          thoi_gian_huy:
            item.status === 'DA_HUY' ? truoc(item.start, 180) : null,
          ly_do_huy:
            item.status === 'DA_HUY' ? 'Khách chủ động đổi lịch.' : null,
          ngay_tao: truoc(item.start, 720),
        },
      });

      await prisma.chi_tiet_dat_ban.deleteMany({
        where: { dat_ban_id: row.id },
      });
      await prisma.chi_tiet_dat_ban.create({
        data: {
          dat_ban_id: row.id,
          ban_an_id: banIds.get(item.table)!,
        },
      });

      bookingIds.push(row.id);
    }

    const reviewContents = [
      [5, 'Món ăn lên nhanh, vị vừa miệng và nhân viên hỗ trợ rất nhiệt tình.', 'Cảm ơn bạn đã dùng bữa tại Hương Việt. Hẹn gặp lại bạn!'],
      [5, 'Không gian dễ chịu, đặt bàn trước nên đến nơi có bàn ngay.', 'Cảm ơn bạn đã chia sẻ trải nghiệm tích cực.'],
      [4, 'Bún bò thơm, phần ăn vừa đủ và rau tươi.', null],
      [5, 'Phù hợp đi gia đình, khu vực ngồi thoải mái.', 'Nhà hàng rất vui khi gia đình mình có một bữa ăn trọn vẹn.'],
      [4, 'Lẩu ngon, nhân viên chủ động hỗ trợ thêm chén đũa cho nhóm.', null],
      [3, 'Món ổn, cuối tuần hơi đông nhưng nhân viên xử lý khá nhanh.', 'Cảm ơn góp ý của bạn, nhà hàng sẽ tiếp tục cải thiện tốc độ phục vụ.'],
    ] as const;

    const reviewBookingIds = bookingIds.slice(0, reviewContents.length);

    for (let i = 0; i < reviewBookingIds.length; i += 1) {
      const datBanId = reviewBookingIds[i];
      const [soSao, noiDung, phanHoi] = reviewContents[i];
      const datBan = await prisma.dat_ban.findUnique({
        where: { id: datBanId },
      });

      if (!datBan) continue;

      const existing = await prisma.danh_gia.findFirst({
        where: { dat_ban_id: datBanId },
      });

      const data = {
        khach_hang_id: datBan.khach_hang_id!,
        dat_ban_id: datBanId,
        so_sao: soSao,
        noi_dung: noiDung,
        phan_hoi: phanHoi,
        nguoi_phan_hoi_id: null,
        thoi_gian_phan_hoi: phanHoi ? sau(datBan.gio_ket_thuc, 720) : null,
        hien_thi: true,
        ngay_tao: sau(datBan.gio_ket_thuc, 360),
        ngay_xoa: null,
      };

      if (existing) {
        await prisma.danh_gia.update({
          where: { id: existing.id },
          data,
        });
      } else {
        await prisma.danh_gia.create({ data });
      }
    }

    const [soKhuVuc, soBan, soDanhMuc, soMon, soKhach, soKhuyenMai, soDatBan, soDanhGia] =
      await Promise.all([
        prisma.khu_vuc.count({ where: { ma_khu_vuc: { startsWith: 'HV_' } } }),
        prisma.ban_an.count({ where: { ma_ban: { startsWith: 'HV_' } } }),
        prisma.danh_muc_mon.count({ where: { ma_danh_muc: { startsWith: 'HV_' } } }),
        prisma.mon_an.count({ where: { ma_mon: { startsWith: 'HV' } } }),
        prisma.khach_hang.count({ where: { ma_khach_hang: { startsWith: 'HV_' } } }),
        prisma.khuyen_mai.count({ where: { ma_khuyen_mai: { in: ['HVWELCOME', 'HVTIEC', 'HAPPYHOUR'] } } }),
        prisma.dat_ban.count({ where: { ma_dat_ban: { startsWith: 'HVDB' } } }),
        prisma.danh_gia.count({
          where: {
            dat_ban: {
              is: {
                ma_dat_ban: { startsWith: 'HVDB' },
              },
            },
          },
        }),
      ]);

    console.log('DEMO_BRANDING=OK');
    console.log(`DEMO_KHU_VUC=${soKhuVuc}`);
    console.log(`DEMO_BAN_AN=${soBan}`);
    console.log(`DEMO_DANH_MUC=${soDanhMuc}`);
    console.log(`DEMO_MON_AN=${soMon}`);
    console.log(`DEMO_KHACH_HANG=${soKhach}`);
    console.log(`DEMO_KHUYEN_MAI=${soKhuyenMai}`);
    console.log(`DEMO_DAT_BAN=${soDatBan}`);
    console.log(`DEMO_DANH_GIA=${soDanhGia}`);
    console.log('FINAL_PRODUCT_3B2_DEMO_DATA_OK');
  } finally {
    await prisma.$disconnect();
  }
}

void main();
