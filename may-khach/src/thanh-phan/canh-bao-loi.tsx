import { Alert } from 'antd';
import { LoiApi } from '@/dich-vu/http';

export function thongBaoLoi(loi: unknown, macDinh = 'Có lỗi xảy ra. Vui lòng thử lại.') {
  if (loi instanceof LoiApi) return loi.message;
  if (loi instanceof Error && loi.message) return loi.message;
  return loi ? macDinh : '';
}

export function CanhBaoLoi({ loi, macDinh }: { loi: unknown; macDinh?: string }) {
  const thongBao = thongBaoLoi(loi, macDinh);
  return thongBao ? <Alert type="error" showIcon message={thongBao} className="mb-16" /> : null;
}
