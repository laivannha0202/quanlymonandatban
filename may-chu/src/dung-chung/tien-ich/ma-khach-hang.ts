export function taoMaKhachHangTuId(id: bigint | number | string): string {
  const phanSo = String(id);
  return `HV_KH${phanSo.padStart(3, '0')}`;
}
