import type { BoToken } from '@/kieu/nghiep-vu';

const KHOA = 'nha_hang_phien_v1';

type PhienCoTheCu = Partial<BoToken> & {
  refreshToken?: unknown;
};

function chuanHoa(
  duLieu: PhienCoTheCu,
): BoToken | null {
  if (
    typeof duLieu.accessToken !== 'string' ||
    !duLieu.accessToken
  ) {
    return null;
  }

  return {
    accessToken: duLieu.accessToken,
    loaiToken:
      typeof duLieu.loaiToken === 'string' &&
      duLieu.loaiToken
        ? duLieu.loaiToken
        : 'Bearer',
    accessHetHanSauGiay:
      typeof duLieu.accessHetHanSauGiay === 'number'
        ? duLieu.accessHetHanSauGiay
        : 0,
  };
}

export function layPhien(): BoToken | null {
  try {
    const raw = localStorage.getItem(KHOA);
    if (!raw) return null;

    const parsed =
      JSON.parse(raw) as PhienCoTheCu;
    const phien = chuanHoa(parsed);

    if (!phien) {
      localStorage.removeItem(KHOA);
      return null;
    }

    // Tự động loại refreshToken của phiên cũ khỏi localStorage.
    if ('refreshToken' in parsed) {
      localStorage.setItem(
        KHOA,
        JSON.stringify(phien),
      );
    }

    return phien;
  } catch {
    localStorage.removeItem(KHOA);
    return null;
  }
}

export function luuPhien(
  token: BoToken,
): void {
  const phien: BoToken = {
    accessToken: token.accessToken,
    loaiToken: token.loaiToken,
    accessHetHanSauGiay:
      token.accessHetHanSauGiay,
  };

  localStorage.setItem(
    KHOA,
    JSON.stringify(phien),
  );
}

export function xoaPhien(): void {
  localStorage.removeItem(KHOA);
}
