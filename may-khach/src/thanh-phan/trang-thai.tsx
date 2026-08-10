import { Tag } from 'antd';

const nhan: Record<string, string> = {
  CHO_XAC_NHAN: 'Chờ xác nhận', DA_XAC_NHAN: 'Đã xác nhận', DA_CHECK_IN: 'Đã check-in',
  DA_HOAN_THANH: 'Hoàn thành', DA_HUY: 'Đã hủy', KHONG_DEN: 'Không đến',
  TRONG: 'Trống', DANG_SU_DUNG: 'Đang sử dụng', BAO_TRI: 'Bảo trì', NGUNG_SU_DUNG: 'Ngừng sử dụng',
  HOAT_DONG: 'Hoạt động', TAM_KHOA: 'Tạm khóa', NGUNG_HOAT_DONG: 'Ngừng hoạt động',
};

const mau: Record<string, string> = {
  CHO_XAC_NHAN: 'gold', DA_XAC_NHAN: 'blue', DA_CHECK_IN: 'cyan', DA_HOAN_THANH: 'green',
  DA_HUY: 'default', KHONG_DEN: 'red', TRONG: 'green', DANG_SU_DUNG: 'volcano', BAO_TRI: 'gold',
  NGUNG_SU_DUNG: 'default', HOAT_DONG: 'green', TAM_KHOA: 'gold', NGUNG_HOAT_DONG: 'default',
};

export function TrangThai({ value }: { value: string }) {
  return <Tag color={mau[value]}>{nhan[value] || value}</Tag>;
}
