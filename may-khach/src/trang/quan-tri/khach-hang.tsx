import { ReloadOutlined } from '@ant-design/icons';
import { Button, Card, Table } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { quanTriApi } from '@/dich-vu/quan-tri.api';
import { CanhBaoLoi } from '@/thanh-phan/canh-bao-loi';
import { TieuDeTrang } from '@/thanh-phan/tieu-de-trang';
import { TrangThai } from '@/thanh-phan/trang-thai';

export function QuanTriKhachHang() {
  const query = useQuery({ queryKey: ['quan-tri', 'khach-hang'], queryFn: quanTriApi.khachHang });
  return <>
    <TieuDeTrang tieuDe="Khách hàng" moTa="Danh sách khách và thống kê đặt bàn tích lũy." hanhDong={<Button icon={<ReloadOutlined />} onClick={() => query.refetch()}>Làm mới</Button>} />
    <CanhBaoLoi loi={query.error} macDinh="Không tải được khách hàng." />
    <Card><Table rowKey="id" loading={query.isPending || query.isFetching} dataSource={query.data?.danhSach ?? []} scroll={{ x: 850 }} columns={[
      { title: 'Họ tên', dataIndex: 'hoTen' },
      { title: 'Số điện thoại', dataIndex: 'soDienThoai' },
      { title: 'Email', dataIndex: 'email' },
      { title: 'Tổng đặt bàn', dataIndex: 'tongDatBan', width: 120 },
      { title: 'Hoàn thành', dataIndex: 'tongHoanThanh', width: 110 },
      { title: 'Trạng thái', dataIndex: 'trangThai', render: (v: string) => <TrangThai value={v} /> },
    ]} /></Card>
  </>;
}
