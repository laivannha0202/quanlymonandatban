import { randomBytes } from 'node:crypto';

const DO_DAI_TOI_THIEU = 3;

export function taoMaKhachHangTuId(
  id: bigint | number | string,
): string {
  const phanSo = String(id);
  return `HV_KH${phanSo.padStart(DO_DAI_TOI_THIEU, '0')}`;
}

export function taoMaKhachHangTam(): string {
  return `TMP_KH_${randomBytes(8).toString('hex')}`;
}
