import {
  CalendarOutlined,
  CloseCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App,
  Button,
  Card,
  Descriptions,
  Drawer,
  Empty,
  Space,
  Table,
} from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { datBanApi } from '@/dich-vu/dat-ban.api';
import { LoiApi } from '@/dich-vu/http';
import type { DatBan } from '@/kieu/nghiep-vu';
import { TrangThai } from '@/thanh-phan/trang-thai';
import { khoaTruyVan } from '@/cau-hinh/khoa-truy-van';
import { dinhDangGio, dinhDangNgay, dinhDangNgayGio } from '@/cau-hinh/ngay-gio';
import { KhungTaiKhoan } from '@/thanh-phan/khung-tai-khoan';

export function LichSuDatBan() {
  const { modal, message } = App.useApp();
  const queryClient = useQueryClient();
  const [chiTietId, setChiTietId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: khoaTruyVan.datBanCuaToi,
    queryFn: () => datBanApi.cuaToi(),
  });

  const chiTietQuery = useQuery({
    queryKey: [...khoaTruyVan.datBanCuaToi, 'chi-tiet', chiTietId],
    queryFn: () => datBanApi.chiTietCuaToi(chiTietId!),
    enabled: Boolean(chiTietId),
  });
  const ds = query.data?.danhSach ?? [];
  const loi = query.error instanceof LoiApi ? query.error.message : query.error ? 'Không tải được lịch đặt.' : '';

  const huyMutation = useMutation({
    mutationFn: (id: string) => datBanApi.huyCuaToi(id),
    onSuccess: async () => {
      message.success('Đã hủy đặt bàn');
      setChiTietId(null);
      await queryClient.invalidateQueries({ queryKey: khoaTruyVan.datBanCuaToi });
    },
    onError: (e) => message.error(e instanceof LoiApi ? e.message : 'Không hủy được'),
  });

  const huy = (r: DatBan) =>
    modal.confirm({
      title: 'Hủy đặt bàn này?',
      content: `${r.maDatBan} · ${dinhDangNgay(r.ngayDat)}`,
      okText: 'Hủy đặt bàn',
      okButtonProps: { danger: true },
      cancelText: 'Giữ lại',
      onOk: () => huyMutation.mutateAsync(r.id),
    });

  return (
    <KhungTaiKhoan
      tieuDe="Lịch đặt bàn"
      moTa="Theo dõi các lượt đặt bàn, xem chi tiết và hủy khi trạng thái vẫn cho phép."
    >
      {loi && <Alert type="error" message={loi} showIcon className="mb-16" />}
      <Card className="account-data-card">
        {!query.isPending && ds.length === 0 ? (
          <Empty description="Bạn chưa có lịch đặt bàn">
            <Button type="primary" href="/dat-ban" icon={<CalendarOutlined />}>Đặt bàn ngay</Button>
          </Empty>
        ) : (
          <Table
            rowKey="id"
            loading={query.isPending}
            dataSource={ds}
            pagination={false}
            scroll={{ x: 900 }}
            columns={[
              { title: 'Mã', dataIndex: 'maDatBan', width: 170 },
              { title: 'Ngày', dataIndex: 'ngayDat', width: 120, render: (v: string) => dinhDangNgay(v) },
              { title: 'Giờ', dataIndex: 'gioBatDau', width: 160, render: (v: string) => dinhDangNgayGio(v) },
              { title: 'Khách', dataIndex: 'soNguoi', width: 80, render: (v: number) => `${v} người` },
              { title: 'Trạng thái', dataIndex: 'trangThai', width: 140, render: (v: string) => <TrangThai value={v} /> },
              {
                title: 'Thao tác',
                width: 180,
                render: (_: unknown, r: DatBan) => (
                  <Space>
                    <Button size="small" icon={<EyeOutlined />} onClick={() => setChiTietId(r.id)}>Chi tiết</Button>
                    {['CHO_XAC_NHAN', 'DA_XAC_NHAN'].includes(r.trangThai) ? (
                      <Button
                        danger
                        size="small"
                        icon={<CloseCircleOutlined />}
                        loading={huyMutation.isPending && huyMutation.variables === r.id}
                        onClick={() => huy(r)}
                      >
                        Hủy
                      </Button>
                    ) : null}
                  </Space>
                ),
              },
            ]}
          />
        )}
      </Card>

      <Drawer
        width={520}
        open={Boolean(chiTietId)}
        onClose={() => setChiTietId(null)}
        title={chiTietQuery.data ? `Đặt bàn ${chiTietQuery.data.maDatBan}` : 'Chi tiết đặt bàn'}
      >
        {chiTietQuery.isPending && chiTietId ? (
          <Card loading bordered={false} />
        ) : chiTietQuery.error ? (
          <Alert
            type="error"
            showIcon
            message={chiTietQuery.error instanceof LoiApi ? chiTietQuery.error.message : 'Không tải được chi tiết đặt bàn.'}
          />
        ) : chiTietQuery.data ? (
          <>
            <Space className="mb-24"><TrangThai value={chiTietQuery.data.trangThai} /></Space>
            <Descriptions
              bordered
              column={1}
              items={[
                { key: 'ten', label: 'Khách hàng', children: chiTietQuery.data.hoTen || '—' },
                { key: 'sdt', label: 'Số điện thoại', children: chiTietQuery.data.soDienThoai || '—' },
                { key: 'email', label: 'Email', children: chiTietQuery.data.email || '—' },
                { key: 'ngay', label: 'Ngày', children: dinhDangNgay(chiTietQuery.data.ngayDat) },
                {
                  key: 'gio',
                  label: 'Giờ',
                  children: `${dinhDangGio(chiTietQuery.data.gioBatDau)} – ${dinhDangGio(chiTietQuery.data.gioKetThuc)}`,
                },
                { key: 'nguoi', label: 'Số người', children: `${chiTietQuery.data.soNguoi} khách` },
                {
                  key: 'ban',
                  label: 'Bàn',
                  children: chiTietQuery.data.banAns?.map((b) => b.tenBan || b.maBan).join(', ') || 'Hệ thống sẽ sắp',
                },
                { key: 'ghiChu', label: 'Ghi chú', children: chiTietQuery.data.ghiChuKhach || '—' },
              ]}
            />
            {['CHO_XAC_NHAN', 'DA_XAC_NHAN'].includes(chiTietQuery.data.trangThai) ? (
              <Button danger block className="mt-16" onClick={() => huy(chiTietQuery.data)}>Hủy đặt bàn</Button>
            ) : null}
          </>
        ) : null}
      </Drawer>
    </KhungTaiKhoan>
  );
}
