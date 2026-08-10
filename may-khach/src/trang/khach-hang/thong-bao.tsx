import { Alert, App, Badge, Button, Card, Empty, List, Space, Typography } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { heThongApi, type ThongBao as ThongBaoType } from '@/dich-vu/he-thong.api';
import { LoiApi } from '@/dich-vu/http';
import { khoaTruyVan } from '@/cau-hinh/khoa-truy-van';
import { dinhDangNgayGio } from '@/cau-hinh/ngay-gio';

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
    onSuccess: async (r) => { message.success(`Đã đọc ${r.soThongBaoDaDoc} thông báo`); await lamMoi(); },
    onError: (e) => message.error(e instanceof LoiApi ? e.message : 'Không cập nhật được.'),
  });

  const docMot = useMutation({
    mutationFn: (id: string) => heThongApi.docThongBao(id),
    onSuccess: lamMoi,
  });

  const mo = async (r: ThongBaoType) => {
    if (!r.daDoc) { try { await docMot.mutateAsync(r.id); } catch { /* vẫn cho phép điều hướng */ } }
    if (r.duongDan?.startsWith('/tai-khoan/dat-ban/')) navigate('/tai-khoan/dat-ban');
    else if (r.duongDan) navigate(r.duongDan);
  };

  return <div className="page-container section narrow">
    <Space align="center" className="page-title-row" wrap>
      <Typography.Title level={2}>Thông báo</Typography.Title>
      <Button loading={docTatCa.isPending} disabled={ds.length === 0} onClick={() => docTatCa.mutate()}>Đánh dấu tất cả đã đọc</Button>
    </Space>
    {loi && <Alert type="error" showIcon message={loi} className="mb-16" />}
    <Card loading={query.isPending}>{!query.isPending && ds.length === 0 ? <Empty description="Chưa có thông báo" /> : <List dataSource={ds} renderItem={(r) => <List.Item className={!r.daDoc ? 'notification-unread' : ''} actions={[<Button key="open" type="link" onClick={() => void mo(r)}>Mở</Button>]}>
      <List.Item.Meta title={<Space><Badge dot={!r.daDoc} />{r.tieuDe}</Space>} description={<><div>{r.noiDung}</div><Typography.Text type="secondary">{dinhDangNgayGio(r.ngayTao)}</Typography.Text></>} />
    </List.Item>} />}</Card>
  </div>;
}
