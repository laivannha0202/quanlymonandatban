export function chuyenBigIntThanhChuoi<T>(giaTri: T): T {
  if (typeof giaTri === 'bigint') {
    return giaTri.toString() as T;
  }

  if (Array.isArray(giaTri)) {
    return giaTri.map((phanTu) => chuyenBigIntThanhChuoi(phanTu)) as T;
  }

  if (giaTri && typeof giaTri === 'object' && !(giaTri instanceof Date)) {
    const ketQua: Record<string, unknown> = {};

    for (const [khoa, duLieu] of Object.entries(giaTri as Record<string, unknown>)) {
      ketQua[khoa] = chuyenBigIntThanhChuoi(duLieu);
    }

    return ketQua as T;
  }

  return giaTri;
}
