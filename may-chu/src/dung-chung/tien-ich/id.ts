import { LoiNghiepVuException } from '../exception/loi-nghiep-vu.exception';

export function bigintTuChuoi(id: string, ten = 'ID'): bigint {
  if (!/^\d+$/.test(id)) {
    throw new LoiNghiepVuException('DU_LIEU_001', `${ten} không hợp lệ.`);
  }
  return BigInt(id);
}
