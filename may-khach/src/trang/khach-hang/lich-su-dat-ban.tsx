import { Alert, App, Button, Card, Table, Typography } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { datBanApi } from '@/dich-vu/dat-ban.api';
import { LoiApi } from '@/dich-vu/http';
import type { DatBan } from '@/kieu/nghiep-vu';
import { TrangThai } from '@/thanh-phan/trang-thai';
import { khoaTruyVan } from '@/cau-hinh/khoa-truy-van';
import { dinhDangNgay, dinhDangNgayGio } from '@/cau-hinh/ngay-gio';

export function LichSuDatBan() {
  const { modal, message } = App.useApp();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: khoaTruyVan.datBanCuaToi, queryFn: () => datBanApi.cuaToi() });
  const ds = query.data?.danhSach ?? [];
  const loi = query.error instanceof LoiApi ? query.error.message : query.error ? 'Không tải được lịch đặt.' : '';

  const huyMutation = useMutation({
    mutationFn: (id: string) => datBanApi.huyCuaToi(id),
    onSuccess: async () => {
      message.success('Đã hủy đặt bàn');
      await queryClient.invalidateQueries({ queryKey: khoaTruyVan.datBanCuaToi });
    },
    onError: (e) => message.error(e instanceof LoiApi ? e.message : 'Không hủy được'),
  });

  return <div className="page-container section">
    <Typography.Title level={2}>Lịch đặt bàn của tôi</Typography.Title>
    {loi && <Alert type="error" message={loi} showIcon className="mb-16" />}
    <Card><Table rowKey="id" loading={query.isPending} dataSource={ds} pagination={false} scroll={{ x: 850 }} columns={[
      { title: 'Mã', dataIndex: 'maDatBan' },
      { title: 'Ngày', dataIndex: 'ngayDat', render: (v: string) => dinhDangNgay(v) },
      { title: 'Giờ', dataIndex: 'gioBatDau', render: (v: string) => dinhDangNgayGio(v) },
      { title: 'Khách', dataIndex: 'soNguoi' },
      { title: 'Trạng thái', dataIndex: 'trangThai', render: (v: string) => <TrangThai value={v} /> },
      { title: '', render: (_: unknown, r: DatBan) => ['CHO_XAC_NHAN', 'DA_XAC_NHAN'].includes(r.trangThai) ? <Button danger size="small" loading={huyMutation.isPending && huyMutation.variables === r.id} onClick={() => modal.confirm({
        title: 'Hủy đặt bàn này?', content: r.maDatBan, okText: 'Hủy đặt bàn', okButtonProps: { danger: true }, cancelText: 'Giữ lại',
        onOk: () => huyMutation.mutateAsync(r.id),
      })}>Hủy</Button> : null },
    ]} /></Card>
  </div>;
}
