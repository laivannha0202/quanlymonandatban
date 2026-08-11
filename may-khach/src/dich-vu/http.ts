import { moiTruong } from '@/cau-hinh/moi-truong';
import type {
  PhanHoiLoi,
  PhanHoiThanhCong,
} from '@/kieu/api';
import type { BoToken } from '@/kieu/nghiep-vu';
import {
  layPhien,
  luuPhien,
  xoaPhien,
} from '@/luu-tru/phien';

export class LoiApi extends Error {
  constructor(
    public readonly status: number,
    public readonly maLoi: string,
    thongBao: string,
    public readonly chiTiet?: unknown,
    public readonly maYeuCau?: string,
  ) {
    super(thongBao);
  }
}

interface TuyChonGoiApi
  extends RequestInit {
  xacThuc?: boolean;
  thuLaiKhi401?: boolean;
}

let dangLamMoi: Promise<boolean> | null =
  null;

async function lamMoiToken(): Promise<boolean> {
  try {
    const res = await fetch(
      `${moiTruong.apiBaseUrl}/xac-thuc/lam-moi-token`,
      {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      },
    );

    if (!res.ok) {
      xoaPhien();
      return false;
    }

    const json =
      (await res.json()) as PhanHoiThanhCong<BoToken>;

    if (
      !json.thanhCong ||
      !json.duLieu?.accessToken
    ) {
      xoaPhien();
      return false;
    }

    luuPhien(json.duLieu);
    return true;
  } catch {
    xoaPhien();
    return false;
  }
}

export async function goiApi<T>(
  duongDan: string,
  tuyChon: TuyChonGoiApi = {},
): Promise<T> {
  const {
    xacThuc = false,
    thuLaiKhi401 = true,
    headers,
    ...request
  } = tuyChon;

  const phien = layPhien();
  const headerMoi = new Headers(headers);
  headerMoi.set('Accept', 'application/json');

  if (
    request.body &&
    !(request.body instanceof FormData) &&
    !headerMoi.has('Content-Type')
  ) {
    headerMoi.set(
      'Content-Type',
      'application/json',
    );
  }

  if (
    xacThuc &&
    phien?.accessToken
  ) {
    headerMoi.set(
      'Authorization',
      `Bearer ${phien.accessToken}`,
    );
  }

  let res: Response;

  try {
    res = await fetch(
      `${moiTruong.apiBaseUrl}${duongDan}`,
      {
        ...request,
        credentials: 'include',
        headers: headerMoi,
      },
    );
  } catch {
    throw new LoiApi(
      0,
      'MANG_001',
      'Không kết nối được tới máy chủ. Kiểm tra Backend có đang chạy không.',
    );
  }

  if (
    res.status === 401 &&
    xacThuc &&
    thuLaiKhi401
  ) {
    dangLamMoi ??=
      lamMoiToken().finally(() => {
        dangLamMoi = null;
      });

    const thanhCong =
      await dangLamMoi;

    if (thanhCong) {
      return goiApi<T>(
        duongDan,
        {
          ...tuyChon,
          thuLaiKhi401: false,
        },
      );
    }
  }

  const coJson =
    res.headers
      .get('content-type')
      ?.includes('application/json');

  const json =
    coJson
      ? await res.json()
      : null;

  if (!res.ok) {
    const loi =
      (json || {}) as Partial<PhanHoiLoi>;

    throw new LoiApi(
      res.status,
      loi.maLoi ||
        `HTTP_${res.status}`,
      loi.thongBao ||
        `Yêu cầu thất bại (${res.status}).`,
      loi.chiTiet,
      loi.maYeuCau,
    );
  }

  const phanHoi =
    json as PhanHoiThanhCong<T>;

  return phanHoi.duLieu;
}

export function taoQuery(
  thamSo: Record<
    string,
    string | number | boolean | null | undefined
  >,
): string {
  const query =
    new URLSearchParams();

  Object.entries(thamSo).forEach(
    ([khoa, giaTri]) => {
      if (
        giaTri !== undefined &&
        giaTri !== null &&
        giaTri !== ''
      ) {
        query.set(
          khoa,
          String(giaTri),
        );
      }
    },
  );

  const chuoi = query.toString();
  return chuoi
    ? `?${chuoi}`
    : '';
}
