import { ReloadOutlined } from '@ant-design/icons';
import { Button, Card, Table } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { quanTriApi, type NhanVienQuanTri } from '@/dich-vu/quan-tri.api';
import { CanhBaoLoi } from '@/thanh-phan/canh-bao-loi';
import { TieuDeTrang } from '@/thanh-phan/tieu-de-trang';
import { TrangThai } from '@/thanh-phan/trang-thai';

export function QuanTriNhanVien() {
  const query = useQuery({ queryKey: ['quan-tri', 'nhan-vien'], queryFn: quanTriApi.nhanVien });
  return <>
    <TieuDeTrang tieuDe="Nhân viên" moTa="Theo dõi tài khoản nhân sự và vai trò đang được gán." hanhDong={<Button icon={<ReloadOutlined />} onClick={() => query.refetch()}>Làm mới</Button>} />
    <CanhBaoLoi loi={query.error} macDinh="Không tải được nhân viên." />
    <Card><Table rowKey="id" loading={query.isPending || query.isFetching} dataSource={query.data?.danhSach ?? []} scroll={{ x: 780 }} columns={[
      { title: 'Mã', dataIndex: 'maNhanVien' },
      { title: 'Họ tên', dataIndex: 'hoTen' },
      { title: 'Email', dataIndex: 'email' },
      { title: 'Vai trò', dataIndex: 'tenVaiTro', render: (v: string | undefined, r: NhanVienQuanTri) => v || r.maVaiTro || '—' },
      { title: 'Trạng thái', dataIndex: 'trangThai', render: (v: string) => <TrangThai value={v} /> },
    ]} /></Card>
  </>;
}
