import { ArrowLeftOutlined, CalendarOutlined, CheckCircleOutlined, PictureOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Col, Descriptions, Image, Result, Row, Skeleton, Space, Tag, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router';
import { thucDonApi } from '@/dich-vu/thuc-don.api';
import { LoiApi } from '@/dich-vu/http';
import { dinhDangTien } from '@/cau-hinh/dinh-dang';

export function ChiTietMon() {
  const { duongDan = '' } = useParams();
  const navigate = useNavigate();
  const query = useQuery({
    queryKey: ['thuc-don', 'chi-tiet', duongDan],
    queryFn: () => thucDonApi.chiTietMon(duongDan),
    enabled: Boolean(duongDan),
  });

  if (query.isPending) return <div className="page-container section"><Skeleton active /></div>;
  if (query.error instanceof LoiApi && query.error.status === 404) {
    return <Result status="404" title="Không tìm thấy món ăn" extra={<Link to="/thuc-don"><Button type="primary">Về thực đơn</Button></Link>} />;
  }
  if (query.error || !query.data) {
    return <div className="page-container section"><Alert type="error" showIcon message={query.error instanceof LoiApi ? query.error.message : 'Không tải được chi tiết món.'} /></div>;
  }

  const mon = query.data;
  const anh = [
    ...(mon.hinhAnhChinh ? [{ id: 'main', duongDanAnh: mon.hinhAnhChinh, altText: mon.tenMon }] : []),
    ...(mon.hinhAnh ?? []).filter((x) => x.duongDanAnh !== mon.hinhAnhChinh),
  ];

  return <div className="page-container section">
    <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/thuc-don')} className="mb-16">Quay lại thực đơn</Button>
    <Row gutter={[36, 28]} align="top">
      <Col xs={24} lg={13}>
        <Card className="dish-detail-gallery">
          {anh.length ? <Image.PreviewGroup>
            <div className="dish-detail-main"><Image src={anh[0].duongDanAnh} alt={anh[0].altText || mon.tenMon} /></div>
            {anh.length > 1 ? <div className="dish-detail-thumbs">{anh.slice(1).map((x) => <Image key={x.id} width={88} height={68} src={x.duongDanAnh} alt={x.altText || mon.tenMon} />)}</div> : null}
          </Image.PreviewGroup> : <div className="dish-detail-placeholder"><PictureOutlined /><span>Chưa có hình ảnh</span></div>}
        </Card>
      </Col>
      <Col xs={24} lg={11}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Space wrap>{mon.tenDanhMuc ? <Tag>{mon.tenDanhMuc}</Tag> : null}{mon.laMonNoiBat ? <Tag color="gold">Món nổi bật</Tag> : null}</Space>
            <Typography.Title level={1} className="dish-detail-title">{mon.tenMon}</Typography.Title>
            <div className="dish-detail-price">
              {mon.giaKhuyenMai != null ? <><span className="price-old">{dinhDangTien(mon.gia)}</span><strong>{dinhDangTien(mon.giaKhuyenMai)}</strong></> : <strong>{dinhDangTien(mon.gia)}</strong>}
            </div>
          </div>
          <Typography.Paragraph className="dish-detail-description">{mon.moTa || 'Thông tin chi tiết món ăn đang được cập nhật.'}</Typography.Paragraph>
          <Descriptions bordered size="small" column={1} items={[
            { key: 'code', label: 'Mã món', children: mon.maMon },
            { key: 'stock', label: 'Tình trạng', children: mon.conMon === false ? <Tag>Hết món</Tag> : <Tag color="green" icon={<CheckCircleOutlined />}>Đang phục vụ</Tag> },
          ]} />
          <Button type="primary" size="large" icon={<CalendarOutlined />} onClick={() => navigate('/dat-ban')} disabled={mon.conMon === false}>Đặt bàn để thưởng thức</Button>
        </Space>
      </Col>
    </Row>
  </div>;
}
