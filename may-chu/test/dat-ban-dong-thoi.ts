import 'dotenv/config';

const base = (process.env.BASE_URL ?? 'http://localhost:8080/api/v1').replace(/\/$/, '');

type Json = Record<string, any>;

async function goi(path: string, init?: RequestInit): Promise<{ status: number; json: Json }> {
  const response = await fetch(`${base}${path}`, init);
  let json: Json = {};
  try { json = await response.json() as Json; } catch {}
  return { status: response.status, json };
}

function ngayCong(soNgay: number): string {
  const now = new Date(Date.now() + 7 * 60 * 60 * 1000);
  now.setUTCDate(now.getUTCDate() + soNgay);
  return now.toISOString().slice(0, 10);
}

async function dangNhapAdmin(): Promise<string> {
  const email = process.env.SEED_ADMIN_EMAIL;
  const matKhau = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !matKhau) throw new Error('Thiếu SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD.');
  const kq = await goi('/xac-thuc/dang-nhap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taiKhoan: email, matKhau }),
  });
  const token = kq.json.duLieu?.accessToken as string | undefined;
  if (!token) throw new Error(`Đăng nhập Admin thất bại: ${JSON.stringify(kq.json)}`);
  return token;
}

async function timKhungGioVaBan() {
  for (let i = 1; i <= 7; i += 1) {
    const ngay = ngayCong(i);
    const slots = await goi(`/dat-ban/khung-gio?ngay=${encodeURIComponent(ngay)}`);
    const danhSach = slots.json.duLieu?.danhSach ?? [];
    const gio = Array.isArray(danhSach)
      ? (typeof danhSach[0] === 'string' ? danhSach[0] : danhSach[0]?.gioBatDau)
      : undefined;
    if (!gio) continue;

    const ban = await goi(`/ban-an/tim-ban-trong?ngay=${encodeURIComponent(ngay)}&gioBatDau=${encodeURIComponent(gio)}&soNguoi=2`);
    const phuongAn = ban.json.duLieu?.phuongAn as any[] | undefined;
    const banDon = phuongAn?.find((x) => x.kieu === 'BAN_DON' && x.banAns?.length === 1);
    if (banDon) return { ngay, gio, banAnId: String(banDon.banAns[0].id) };
  }
  throw new Error('Không tìm được khung giờ/bàn đơn trong 7 ngày tới để test concurrency.');
}

(async () => {
  const token = await dangNhapAdmin();
  const { ngay, gio, banAnId } = await timKhungGioVaBan();
  const body = {
    hoTen: 'Test Concurrency',
    soDienThoai: '0999000999',
    ngay,
    gioBatDau: gio,
    soNguoi: 2,
    banAnIds: [banAnId],
    ghiChu: 'Auto test concurrency Phan 9',
  };

  const tao = () => goi('/dat-ban', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const [a, b] = await Promise.all([tao(), tao()]);
  const ketQua = [a, b];
  const thanhCong = ketQua.filter((x) => x.json.thanhCong === true);
  const xungDot = ketQua.filter((x) => x.status === 409 && x.json.maLoi === 'DAT_BAN_002');

  if (thanhCong.length !== 1 || xungDot.length !== 1) {
    throw new Error(`Concurrency không đạt. Kết quả: ${JSON.stringify(ketQua)}`);
  }

  const id = String(thanhCong[0].json.duLieu?.id ?? '');
  if (id) {
    await goi(`/quan-tri/dat-ban/${id}/huy`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ lyDo: 'Dọn dữ liệu auto test concurrency Phần 9' }),
    });
  }

  console.log(`CONCURRENCY_PHAN_9_OK ngay=${ngay} gio=${gio} banAnId=${banAnId}`);
})();
