import { Alert, Card, Col, Empty, Row, Skeleton, Tag, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { heThongApi, type KhuyenMai as KhuyenMaiType } from '@/dich-vu/he-thong.api';
import { LoiApi } from '@/dich-vu/http';
import { dinhDangNgayGio } from '@/cau-hinh/ngay-gio';
import { dinhDangTien } from '@/cau-hinh/dinh-dang';
import { khoaTruyVan } from '@/cau-hinh/khoa-truy-van';

const hienGiaTri = (r: KhuyenMaiType) => r.loaiGiam === 'PHAN_TRAM' ? `${r.giaTri}%` : dinhDangTien(r.giaTri);

export function KhuyenMai() {
  const query = useQuery({
    queryKey: khoaTruyVan.khuyenMaiCongKhai,
    queryFn: heThongApi.khuyenMaiCongKhai,
    staleTime: 60_000,
  });
  const ds = query.data ?? [];
  const loi = query.error instanceof LoiApi ? query.error.message : query.error ? 'Không tải được khuyến mãi.' : '';

  return <div className="page-container section">
    <Typography.Title>Khuyến mãi đang áp dụng</Typography.Title>
    <Typography.Paragraph type="secondary">Các chương trình đang còn hiệu lực tại nhà hàng.</Typography.Paragraph>
    {loi && <Alert type="error" showIcon message={loi} className="mb-16" />}
    {query.isPending ? <Skeleton active /> : ds.length === 0 ? <Empty description="Hiện chưa có chương trình khuyến mãi" /> : <Row gutter={[16, 16]}>{ds.map((r) => <Col xs={24} md={12} lg={8} key={r.id}>
      <Card className="promo-card" title={r.tenKhuyenMai} extra={<Tag color="red">{hienGiaTri(r)}</Tag>}>
        <Typography.Paragraph>{r.moTa || 'Ưu đãi dành cho khách hàng của nhà hàng.'}</Typography.Paragraph>
        <Typography.Text strong>Mã: {r.maKhuyenMai}</Typography.Text><br />
        <Typography.Text type="secondary">Đến {dinhDangNgayGio(r.ngayKetThuc)}</Typography.Text>
      </Card>
    </Col>)}</Row>}
  </div>;
}
