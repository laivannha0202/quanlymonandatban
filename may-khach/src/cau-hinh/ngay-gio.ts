import dayjs from 'dayjs';
import 'dayjs/locale/vi';

dayjs.locale('vi');

export function dinhDangNgayGio(value?: string | Date | null) {
  if (!value) return '—';
  const d = dayjs(value);
  return d.isValid() ? d.format('DD/MM/YYYY HH:mm') : String(value);
}

export function dinhDangNgay(value?: string | Date | null) {
  if (!value) return '—';
  const d = dayjs(value);
  return d.isValid() ? d.format('DD/MM/YYYY') : String(value);
}
