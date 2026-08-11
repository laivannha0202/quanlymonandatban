const KHOA_BOOLEAN = new Set([
  'la_he_thong',
  'bat_buoc_doi_mat_khau',
  'co_the_ghep',
  'la_mon_noi_bat',
  'con_mon',
  'la_anh_chinh',
  'hien_thi',
  'da_doc',
  'cho_phep_sua',
  'da_su_dung',
  'hoat_dong',
  'dong_cua_ca_ngay',
]);

const KHOA_SO = new Set([
  'so_nguoi',
  'suc_chua',
  'suc_chua_toi_da',
  'thu_tu',
  'so_mon',
  'so_sao',
  'ca_so',
  'trang',
  'kich_thuoc',
  'tong',
  'tong_trang',
  'tong_ban_ghi',
  'thu_trong_tuan',
]);

function snakeSangCamel(khoa: string): string {
  return khoa.replace(/_([a-z0-9])/g, (_khop, kyTu: string) => kyTu.toUpperCase());
}

function laDoiTuongDecimal(giaTri: unknown): giaTri is { toJSON: () => unknown; constructor?: { name?: string } } {
  if (!giaTri || typeof giaTri !== 'object') return false;
  const doiTuong = giaTri as { toJSON?: unknown; constructor?: { name?: string } };
  return doiTuong.constructor?.name === 'Decimal' && typeof doiTuong.toJSON === 'function';
}

function chuanHoaTheoKhoa(khoa: string, giaTri: unknown): unknown {
  if (giaTri == null) return giaTri;

  if (KHOA_BOOLEAN.has(khoa)) {
    if (giaTri === true || giaTri === false) return giaTri;
    if (giaTri === 1 || giaTri === 1n || giaTri === '1') return true;
    if (giaTri === 0 || giaTri === 0n || giaTri === '0') return false;
  }

  if (KHOA_SO.has(khoa) && (typeof giaTri === 'bigint' || typeof giaTri === 'number' || typeof giaTri === 'string')) {
    const so = Number(giaTri);
    if (Number.isFinite(so)) return so;
  }

  return giaTri;
}

export function chuanHoaPhanHoi<T>(giaTri: T): T {
  if (typeof giaTri === 'bigint') {
    return giaTri.toString() as T;
  }

  if (Array.isArray(giaTri)) {
    return giaTri.map((phanTu) => chuanHoaPhanHoi(phanTu)) as T;
  }

  if (giaTri instanceof Date) {
    return giaTri;
  }

  if (laDoiTuongDecimal(giaTri)) {
    return giaTri.toJSON() as T;
  }

  if (giaTri && typeof giaTri === 'object') {
    const ketQua: Record<string, unknown> = {};

    for (const [khoa, duLieu] of Object.entries(giaTri as Record<string, unknown>)) {
      const khoaChuan = snakeSangCamel(khoa);
      if (Object.prototype.hasOwnProperty.call(ketQua, khoaChuan) && khoaChuan !== khoa) {
        throw new Error(`Trùng khóa phản hồi sau khi chuyển camelCase: ${khoa} -> ${khoaChuan}`);
      }

      ketQua[khoaChuan] = chuanHoaPhanHoi(chuanHoaTheoKhoa(khoa, duLieu));
    }

    return ketQua as T;
  }

  return giaTri;
}
