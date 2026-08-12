const MAU_NGAY = /^\d{4}-\d{2}-\d{2}$/;
const MAU_GIO = /^([01]\d|2[0-3]):[0-5]\d$/;

export function laNgayHopLe(ngay: string): boolean {
  if (!MAU_NGAY.test(ngay)) return false;
  const [nam, thang, ngayTrongThang] = ngay.split('-').map(Number);
  const date = new Date(Date.UTC(nam, thang - 1, ngayTrongThang));
  return (
    date.getUTCFullYear() === nam &&
    date.getUTCMonth() === thang - 1 &&
    date.getUTCDate() === ngayTrongThang
  );
}

export function laGioHopLe(gio: string): boolean {
  return MAU_GIO.test(gio);
}

export function gioThanhPhut(gio: string): number {
  const [gioSo, phut] = gio.split(':').map(Number);
  return gioSo * 60 + phut;
}

export function phutThanhGio(tongPhut: number): string {
  const phutTrongNgay = ((tongPhut % 1440) + 1440) % 1440;
  const gio = Math.floor(phutTrongNgay / 60);
  const phut = phutTrongNgay % 60;
  return `${String(gio).padStart(2, '0')}:${String(phut).padStart(2, '0')}`;
}

export function congPhutVaoGio(gio: string, soPhut: number): string {
  return phutThanhGio(gioThanhPhut(gio) + soPhut);
}

export function thuTrongTuan(ngay: string): number {
  const [nam, thang, ngayTrongThang] = ngay.split('-').map(Number);
  const thuJs = new Date(Date.UTC(nam, thang - 1, ngayTrongThang)).getUTCDay();
  return thuJs === 0 ? 7 : thuJs;
}

export function ngayGioSql(ngay: string, gio: string): string {
  return `${ngay} ${gio}:00`;
}

export function soPhutTuHienTaiDen(ngay: string, gio: string): number {
  // Hệ thống nghiệp vụ hiện tại dùng múi giờ Việt Nam UTC+7.
  const moc = new Date(`${ngay}T${gio}:00+07:00`).getTime();
  return Math.floor((moc - Date.now()) / 60_000);
}

export function soNgayTuHienTaiDen(ngay: string): number {
  const moc = new Date(`${ngay}T00:00:00+07:00`).getTime();
  const hienTai = Date.now();
  return Math.floor((moc - hienTai) / 86_400_000);
}


/**
 * Prisma DateTime + MySQL DATETIME trong hệ thống được dùng như
 * wall-clock nghiệp vụ Việt Nam. Date trả về ở đây là carrier:
 * component UTC chính là ngày/giờ cần lưu hoặc so sánh trong DB.
 */
export function dateWallClockTuNgayGioSql(value: string): Date {
  const normalized = value.trim().replace(' ', 'T');
  const date = new Date(`${normalized}.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Ngày giờ SQL không hợp lệ: ${value}`);
  }
  return date;
}

export function hienTaiWallClockVietNam(): Date {
  const hienTaiVietNam = new Date(
    Date.now() + 7 * 60 * 60 * 1000,
  );
  return new Date(
    `${hienTaiVietNam.toISOString().slice(0, 23)}Z`,
  );
}


export function dateWallClockTuNgay(ngay: string): Date {
  if (!laNgayHopLe(ngay)) {
    throw new Error(`Ngày không hợp lệ: ${ngay}`);
  }
  return new Date(`${ngay}T00:00:00.000Z`);
}

export function ngayTuDateWallClock(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function dateWallClockTuGio(gio: string): Date {
  if (!laGioHopLe(gio)) {
    throw new Error(`Giờ không hợp lệ: ${gio}`);
  }
  return new Date(`1970-01-01T${gio}:00.000Z`);
}

export function gioTuDateWallClock(value: Date): string {
  return value.toISOString().slice(11, 16);
}
