import fs from 'node:fs';
import path from 'node:path';
import type { APIRequestContext, Page } from '@playwright/test';

export const E2E_API_URL = process.env.E2E_API_URL || 'http://localhost:8080/api/v1';

function docEnvDonGian(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};
  const ketQua: Record<string, string> = {};
  for (const dongGoc of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const dong = dongGoc.trim();
    if (!dong || dong.startsWith('#')) continue;
    const match = dong.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    let giaTri = match[2].trim();
    if ((giaTri.startsWith('"') && giaTri.endsWith('"')) || (giaTri.startsWith("'") && giaTri.endsWith("'"))) {
      giaTri = giaTri.slice(1, -1);
    }
    ketQua[match[1]] = giaTri;
  }
  return ketQua;
}

function napAdminTuBackendNeuCan() {
  if (process.env.E2E_ADMIN_EMAIL && process.env.E2E_ADMIN_PASSWORD) return;
  const envBackend = docEnvDonGian(path.resolve(process.cwd(), '../may-chu/.env'));
  process.env.E2E_ADMIN_EMAIL ||= envBackend.SEED_ADMIN_EMAIL;
  process.env.E2E_ADMIN_PASSWORD ||= envBackend.SEED_ADMIN_PASSWORD;
}

napAdminTuBackendNeuCan();

export function layThongTinAdmin() {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  return email && password ? { email, password } : null;
}

type BoTokenE2E = {
  accessToken: string;
  refreshToken: string;
  loaiToken: string;
  accessHetHanSauGiay: number;
};

let boTokenAdminPromise: Promise<BoTokenE2E> | null = null;

async function layBoTokenAdmin(): Promise<BoTokenE2E> {
  const admin = layThongTinAdmin();

  if (!admin) {
    throw new Error(
      'Thiếu E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD và không đọc được ../may-chu/.env',
    );
  }

  boTokenAdminPromise ??= (async () => {
    const res = await fetch(`${E2E_API_URL}/xac-thuc/dang-nhap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        taiKhoan: admin.email,
        matKhau: admin.password,
      }),
    });

    const json = await res.json() as {
      thanhCong?: boolean;
      duLieu?: BoTokenE2E;
      maLoi?: string;
      thongBao?: string;
    };

    if (!res.ok || !json.duLieu?.accessToken) {
      throw new Error(
        `Không tạo được phiên Admin E2E: ${res.status} ${json.maLoi ?? ''} ${json.thongBao ?? ''}`,
      );
    }

    return json.duLieu;
  })();

  try {
    return await boTokenAdminPromise;
  } catch (error) {
    boTokenAdminPromise = null;
    throw error;
  }
}

export async function dangNhapQuanTri(page: Page) {
  const token = await layBoTokenAdmin();

  await page.addInitScript(
    ({ khoa, giaTri }) => {
      window.localStorage.setItem(khoa, giaTri);
    },
    {
      khoa: 'nha_hang_phien_v1',
      giaTri: JSON.stringify(token),
    },
  );

  await page.goto('/quan-tri');
  await page.waitForURL(/\/quan-tri(?:\/)?$/, { timeout: 15_000 });
}

export async function dangNhapQuanTriQuaGiaoDien(page: Page) {
  const admin = layThongTinAdmin();

  if (!admin) {
    throw new Error(
      'Thiếu E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD và không đọc được ../may-chu/.env',
    );
  }

  await page.goto('/dang-nhap');
  await page.getByLabel('Email hoặc tên đăng nhập', { exact: true }).fill(admin.email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(admin.password);
  await page
    .locator('form')
    .getByRole('button', { name: 'Đăng nhập', exact: true })
    .click();

  await page.waitForURL(/\/quan-tri(?:\/)?$/, { timeout: 15_000 });
}

export function maDuyNhat(tienTo: string): string {
  const thoiGian = Date.now().toString(36).toUpperCase();
  const ngauNhien = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${tienTo}${thoiGian}${ngauNhien}`.slice(0, 30);
}

export function soDienThoaiDuyNhat(): string {
  const duoi = `${Date.now()}${Math.floor(Math.random() * 1000)}`.replace(/\D/g, '').slice(-8).padStart(8, '0');
  return `09${duoi}`;
}

function ngayVietNamSau(soNgay: number): string {
  const d = new Date(Date.now() + soNgay * 86_400_000);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const lay = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value || '';
  return `${lay('year')}-${lay('month')}-${lay('day')}`;
}

export async function timKhungGioConBan(request: APIRequestContext): Promise<{ ngay: string; gio: string } | null> {
  for (let i = 1; i <= 14; i += 1) {
    const ngay = ngayVietNamSau(i);
    const resKhung = await request.get(`${E2E_API_URL}/dat-ban/khung-gio`, { params: { ngay } });
    if (!resKhung.ok()) continue;
    const jsonKhung = await resKhung.json() as { duLieu?: { danhSach?: string[] } };
    const danhSach = jsonKhung.duLieu?.danhSach ?? [];

    for (const gio of danhSach.slice(0, 8)) {
      const resBan = await request.get(`${E2E_API_URL}/ban-an/tim-ban-trong`, {
        params: { ngay, gioBatDau: gio, soNguoi: '2' },
      });
      if (!resBan.ok()) continue;
      const jsonBan = await resBan.json() as { duLieu?: { coBan?: boolean } };
      if (jsonBan.duLieu?.coBan) return { ngay, gio };
    }
  }
  return null;
}
