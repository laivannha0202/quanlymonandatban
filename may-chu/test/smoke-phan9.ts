import 'dotenv/config';

const base = (process.env.BASE_URL ?? 'http://localhost:8080/api/v1').replace(/\/$/, '');

type Json = Record<string, any>;

async function goi(
  path: string,
  init?: RequestInit,
): Promise<{ status: number; json: Json; headers: Headers }> {
  const response = await fetch(`${base}${path}`, init);
  let json: Json = {};
  try { json = await response.json() as Json; } catch {}
  return {
    status: response.status,
    json,
    headers: response.headers,
  };
}

function damBao(dieuKien: unknown, thongBao: string): asserts dieuKien {
  if (!dieuKien) throw new Error(thongBao);
}

(async () => {
  const song = await goi('/suc-khoe/song');
  damBao(song.status === 200 && song.json.thanhCong === true, 'Liveness không đạt.');

  const sanSang = await goi('/suc-khoe/san-sang');
  damBao(sanSang.status === 200 && sanSang.json.duLieu?.database === 'HOAT_DONG', 'Readiness/database không đạt.');

  const danhMuc = await goi('/thuc-don/danh-muc');
  damBao(danhMuc.status === 200 && Array.isArray(danhMuc.json.duLieu), 'API danh mục thực đơn lỗi.');

  const email = process.env.SEED_ADMIN_EMAIL;
  const matKhau = process.env.SEED_ADMIN_PASSWORD;
  damBao(email && matKhau, 'Thiếu SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD để smoke test Admin.');

  const dangNhap = await goi('/xac-thuc/dang-nhap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taiKhoan: email, matKhau }),
  });
  const token = dangNhap.json.duLieu?.accessToken as string | undefined;
  damBao(dangNhap.status === 201 || dangNhap.status === 200, 'Đăng nhập Admin thất bại.');
  damBao(token, 'Không nhận được access token Admin.');
  damBao(
    !dangNhap.json.duLieu?.refreshToken,
    'Refresh token không được phép xuất hiện trong JSON response.',
  );

  const setCookie = dangNhap.headers.get('set-cookie');
  damBao(
    setCookie?.includes('nha_hang_refresh_v1='),
    'Đăng nhập chưa cấp refresh cookie.',
  );
  damBao(
    setCookie?.toLowerCase().includes('httponly'),
    'Refresh cookie thiếu HttpOnly.',
  );

  const cookie = setCookie!.split(';', 1)[0];
  const lamMoi = await goi('/xac-thuc/lam-moi-token', {
    method: 'POST',
    headers: {
      Cookie: cookie,
      Accept: 'application/json',
    },
  });
  damBao(
    (lamMoi.status === 200 || lamMoi.status === 201) &&
    Boolean(lamMoi.json.duLieu?.accessToken) &&
    !lamMoi.json.duLieu?.refreshToken,
    'Refresh cookie flow không hợp lệ.',
  );

  const headers = { Authorization: `Bearer ${token}` };

  const hienTai = await goi('/xac-thuc/thong-tin-hien-tai', { headers });
  damBao(
    hienTai.status === 200 &&
    hienTai.json.thanhCong === true &&
    Array.isArray(hienTai.json.duLieu?.quyen) &&
    hienTai.json.duLieu.quyen.includes('DASHBOARD_XEM'),
    'Thông tin hiện tại chưa trả danh sách quyền hợp lệ.',
  );

  const dashboard = await goi('/quan-tri/dashboard', { headers });
  damBao(dashboard.status === 200 && dashboard.json.thanhCong === true, 'Dashboard Admin lỗi.');

  const quyen = await goi('/quan-tri/quyen', { headers });
  damBao(quyen.status === 200 && Array.isArray(quyen.json.duLieu), 'API danh mục quyền lỗi.');

  console.log('SMOKE_PHAN_9_OK');
})();
