export const tienVietNam = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

export function dinhDangTien(value?: number | null) {
  return value == null ? '—' : tienVietNam.format(value);
}
