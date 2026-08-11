import {
  BellOutlined,
  CheckOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { Alert, App, Badge, Button, Card, Empty, List, Space, Typography } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { heThongApi, type ThongBao as ThongBaoType } from '@/dich-vu/he-thong.api';
import { LoiApi } from '@/dich-vu/http';
import { khoaTruyVan } from '@/cau-hinh/khoa-truy-van';
import { dinhDangNgayGio } from '@/cau-hinh/ngay-gio';
import { KhungTaiKhoan } from '@/thanh-phan/khung-tai-khoan';

export function ThongBao() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: khoaTruyVan.thongBao, queryFn: () => heThongApi.thongBao() });
  const ds = query.data?.danhSach ?? [];
  const loi = query.error instanceof LoiApi ? query.error.message : query.error ? 'Không tải được thông báo.' : '';

  const lamMoi = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: khoaTruyVan.thongBao }),
      queryClient.invalidateQueries({ queryKey: khoaTruyVan.soThongBaoChuaDoc }),
    ]);
  };

  const docTatCa = useMutation({
    mutationFn: heThongApi.docTatCaThongBao,
    onSuccess: async (r) => {
      message.success(`Đã đọc ${r.soThongBaoDaDoc} thông báo`);
      await lamMoi();
    },
    onError: (e) => message.error(e instanceof LoiApi ? e.message : 'Không cập nhật được.'),
  });

  const docMot = useMutation({
    mutationFn: (id: string) => heThongApi.docThongBao(id),
    onSuccess: lamMoi,
  });

  const mo = async (r: ThongBaoType) => {
    if (!r.daDoc) {
      try {
        await docMot.mutateAsync(r.id);
      } catch {
        // Vẫn cho phép điều hướng khi thao tác đánh dấu đã đọc thất bại.
      }
    }
    if (r.duongDan?.startsWith('/tai-khoan/dat-ban/')) navigate('/tai-khoan/dat-ban');
    else if (r.duongDan) navigate(r.duongDan);
  };

  return (
    <KhungTaiKhoan
      tieuDe="Thông báo"
      moTa="Cập nhật trạng thái đặt bàn và các thông tin liên quan đến tài khoản."
    >
      <div className="account-toolbar">
        <Typography.Text type="secondary">{ds.filter((x) => !x.daDoc).length} thông báo chưa đọc</Typography.Text>
        <Button
          icon={<CheckOutlined />}
          loading={docTatCa.isPending}
          disabled={ds.length === 0}
          onClick={() => docTatCa.mutate()}
        >
          Đánh dấu tất cả đã đọc
        </Button>
      </div>

      {loi && <Alert type="error" showIcon message={loi} className="mb-16" />}

      <Card loading={query.isPending} className="account-data-card notification-card">
        {!query.isPending && ds.length === 0 ? (
          <Empty description="Chưa có thông báo" />
        ) : (
          <List
            dataSource={ds}
            renderItem={(r) => (
              <List.Item
                className={!r.daDoc ? 'notification-unread notification-item-final' : 'notification-item-final'}
                onClick={() => void mo(r)}
                extra={<RightOutlined />}
              >
                <List.Item.Meta
                  avatar={<Badge dot={!r.daDoc}><span className="notification-icon"><BellOutlined /></span></Badge>}
                  title={<Typography.Text strong={!r.daDoc}>{r.tieuDe}</Typography.Text>}
                  description={
                    <Space direction="vertical" size={3}>
                      <Typography.Text type="secondary">{r.noiDung}</Typography.Text>
                      <Typography.Text type="secondary" className="notification-time">{dinhDangNgayGio(r.ngayTao)}</Typography.Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </KhungTaiKhoan>
  );
}
