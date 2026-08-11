import {
  ArrowLeftOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ShopOutlined,
  StarFilled,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Image,
  Result,
  Row,
  Skeleton,
  Space,
  Tag,
  Typography,
} from 'antd';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router';
import { dinhDangTien } from '@/cau-hinh/dinh-dang';
import { layAnhMonMacDinh } from '@/cau-hinh/hinh-anh-mau';
import { LoiApi } from '@/dich-vu/http';
import { thucDonApi } from '@/dich-vu/thuc-don.api';

export function ChiTietMon() {
  const { duongDan = '' } = useParams();
  const navigate = useNavigate();
  const query = useQuery({
    queryKey: ['thuc-don', 'chi-tiet', duongDan],
    queryFn: () => thucDonApi.chiTietMon(duongDan),
    enabled: Boolean(duongDan),
  });

  if (query.isPending) {
    return <div className="page-container section"><Skeleton active /></div>;
  }

  if (query.error instanceof LoiApi && query.error.status === 404) {
    return (
      <Result
        status="404"
        title="Không tìm thấy món ăn"
        extra={<Link to="/thuc-don"><Button type="primary">Về thực đơn</Button></Link>}
      />
    );
  }

  if (query.error || !query.data) {
    return (
      <div className="page-container section">
        <Alert
          type="error"
          showIcon
          message={query.error instanceof LoiApi ? query.error.message : 'Không tải được chi tiết món.'}
        />
      </div>
    );
  }

  const mon = query.data;
  const anh = [
    ...(mon.hinhAnhChinh ? [{ id: 'main', duongDanAnh: mon.hinhAnhChinh, altText: mon.tenMon }] : []),
    ...(mon.hinhAnh ?? []).filter((x) => x.duongDanAnh !== mon.hinhAnhChinh),
  ];
  const anhChinh = anh[0]?.duongDanAnh || layAnhMonMacDinh(0);

  return (
    <div className="page-container section">
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/thuc-don')}
        className="mb-16"
      >
        Quay lại thực đơn
      </Button>

      <Row gutter={[40, 32]} align="top">
        <Col xs={24} lg={13}>
          <Card className="dish-detail-gallery">
            <Image.PreviewGroup>
              <div className="dish-detail-main">
                <Image src={anhChinh} alt={mon.tenMon} />
              </div>
              {anh.length > 1 ? (
                <div className="dish-detail-thumbs">
                  {anh.slice(1).map((x) => (
                    <Image
                      key={x.id}
                      width={96}
                      height={72}
                      src={x.duongDanAnh}
                      alt={x.altText || mon.tenMon}
                    />
                  ))}
                </div>
              ) : null}
            </Image.PreviewGroup>
          </Card>
        </Col>

        <Col xs={24} lg={11}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Space wrap>
                {mon.tenDanhMuc ? <Tag icon={<ShopOutlined />}>{mon.tenDanhMuc}</Tag> : null}
                {mon.laMonNoiBat ? <Tag color="gold" icon={<StarFilled />}>Món nổi bật</Tag> : null}
                <Tag color={mon.conMon === false ? 'default' : 'green'}>
                  {mon.conMon === false ? 'Tạm hết món' : 'Đang phục vụ'}
                </Tag>
              </Space>
              <Typography.Title level={1} className="dish-detail-title">
                {mon.tenMon}
              </Typography.Title>
              <div className="dish-detail-price">
                {mon.giaKhuyenMai != null ? (
                  <>
                    <span className="price-old">{dinhDangTien(mon.gia)}</span>
                    <strong>{dinhDangTien(mon.giaKhuyenMai)}</strong>
                  </>
                ) : (
                  <strong>{dinhDangTien(mon.gia)}</strong>
                )}
              </div>
            </div>

            <Typography.Paragraph className="dish-detail-description">
              {mon.moTa || 'Món ăn được chuẩn bị và phục vụ trực tiếp tại nhà hàng.'}
            </Typography.Paragraph>

            <Descriptions
              bordered
              size="middle"
              column={1}
              items={[
                { key: 'code', label: 'Mã món', children: mon.maMon },
                {
                  key: 'stock',
                  label: 'Tình trạng',
                  children: mon.conMon === false
                    ? <Tag>Tạm hết món</Tag>
                    : <Tag color="green" icon={<CheckCircleOutlined />}>Đang phục vụ</Tag>,
                },
                {
                  key: 'service',
                  label: 'Phục vụ',
                  children: <span><ClockCircleOutlined /> Tại nhà hàng theo giờ mở cửa</span>,
                },
              ]}
            />

            <Card className="dish-booking-cta">
              <Typography.Title level={4}>Muốn thưởng thức món này?</Typography.Title>
              <Typography.Paragraph type="secondary">
                Đặt bàn trước để chủ động thời gian và nhận phương án bàn phù hợp.
              </Typography.Paragraph>
              <Button
                type="primary"
                size="large"
                icon={<CalendarOutlined />}
                onClick={() => navigate('/dat-ban')}
              >
                Đặt bàn ngay
              </Button>
            </Card>
          </Space>
        </Col>
      </Row>
    </div>
  );
}
