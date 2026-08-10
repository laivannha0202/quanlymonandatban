import type { BoToken } from '@/kieu/nghiep-vu';

const KHOA = 'nha_hang_phien_v1';

export function layPhien(): BoToken | null {
  try {
    const raw = localStorage.getItem(KHOA);
    return raw ? (JSON.parse(raw) as BoToken) : null;
  } catch {
    localStorage.removeItem(KHOA);
    return null;
  }
}

export function luuPhien(token: BoToken): void {
  localStorage.setItem(KHOA, JSON.stringify(token));
}

export function xoaPhien(): void {
  localStorage.removeItem(KHOA);
}
