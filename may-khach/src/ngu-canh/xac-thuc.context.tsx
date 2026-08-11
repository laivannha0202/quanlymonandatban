import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { BoToken, NguoiDungHienTai } from '@/kieu/nghiep-vu';
import { layPhien, luuPhien, xoaPhien } from '@/luu-tru/phien';
import { xacThucApi } from '@/dich-vu/xac-thuc.api';

interface XacThucContextValue {
  nguoiDung: NguoiDungHienTai | null;
  dangKhoiTao: boolean;
  dangNhap: (taiKhoan: string, matKhau: string) => Promise<NguoiDungHienTai>;
  dangKy: (payload: { hoTen: string; soDienThoai: string; email: string; matKhau: string }) => Promise<NguoiDungHienTai>;
  dangXuat: () => Promise<void>;
  taiLaiNguoiDung: () => Promise<void>;
  laKhuVucQuanTri: boolean;
  coQuyen: (maQuyen: string) => boolean;
  coTatCaQuyen: (maQuyens: string[]) => boolean;
}

const XacThucContext = createContext<XacThucContextValue | null>(null);

export function XacThucProvider({ children }: { children: ReactNode }) {
  const [nguoiDung, setNguoiDung] = useState<NguoiDungHienTai | null>(null);
  const [dangKhoiTao, setDangKhoiTao] = useState(true);

  const taiLaiNguoiDung = async () => {
    const hienTai = await xacThucApi.hienTai();
    setNguoiDung(hienTai);
  };

  useEffect(() => {
    let conHieuLuc = true;
    (async () => {
      if (!layPhien()) {
        setDangKhoiTao(false);
        return;
      }

      try {
        const hienTai = await xacThucApi.hienTai();
        if (conHieuLuc) setNguoiDung(hienTai);
      } catch {
        xoaPhien();
        if (conHieuLuc) setNguoiDung(null);
      } finally {
        if (conHieuLuc) setDangKhoiTao(false);
      }
    })();

    return () => {
      conHieuLuc = false;
    };
  }, []);

  async function hoanTatDangNhap(token: BoToken) {
    luuPhien(token);

    try {
      const hienTai = await xacThucApi.hienTai();
      setNguoiDung(hienTai);
      return hienTai;
    } catch (e) {
      xoaPhien();
      throw e;
    }
  }

  const value = useMemo<XacThucContextValue>(() => {
    const tapQuyen = new Set(nguoiDung?.quyen ?? []);

    return {
      nguoiDung,
      dangKhoiTao,

      dangNhap: async (taiKhoan, matKhau) =>
        hoanTatDangNhap(
          await xacThucApi.dangNhap({
            taiKhoan,
            matKhau,
          }),
        ),

      dangKy: async (payload) =>
        hoanTatDangNhap(
          await xacThucApi.dangKy(payload),
        ),

      dangXuat: async () => {
        try {
          await xacThucApi.dangXuat();
        } catch {
          // Luôn xóa phiên phía client kể cả Backend không phản hồi.
        }

        xoaPhien();
        setNguoiDung(null);
      },

      taiLaiNguoiDung,

      laKhuVucQuanTri: Boolean(
        nguoiDung &&
        nguoiDung.vaiTro.maVaiTro !== 'KHACH_HANG' &&
        (nguoiDung.quyen?.length ?? 0) > 0,
      ),

      coQuyen: (maQuyen) =>
        tapQuyen.has(maQuyen),

      coTatCaQuyen: (maQuyens) =>
        maQuyens.every((maQuyen) => tapQuyen.has(maQuyen)),
    };
  }, [nguoiDung, dangKhoiTao]);

  return (
    <XacThucContext.Provider value={value}>
      {children}
    </XacThucContext.Provider>
  );
}

export function useXacThuc() {
  const ctx = useContext(XacThucContext);

  if (!ctx) {
    throw new Error(
      'useXacThuc phải nằm trong XacThucProvider',
    );
  }

  return ctx;
}
