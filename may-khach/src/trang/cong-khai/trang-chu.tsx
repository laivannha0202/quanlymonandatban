import { CalendarOutlined, CheckCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Col, Row, Space, Typography } from 'antd';
import { useNavigate } from 'react-router';

const buoc = [
  { icon: <CalendarOutlined />, title: '1. Chọn thời gian', text: 'Chỉ hiện các khung giờ nhà hàng đang nhận đặt.' },
  { icon: <SearchOutlined />, title: '2. Tìm bàn trống', text: 'Ưu tiên bàn đơn phù hợp, chỉ ghép bàn khi thực sự cần.' },
  { icon: <CheckCircleOutlined />, title: '3. Nhận mã đặt bàn', text: 'Dùng mã cùng số điện thoại để tra cứu bất cứ lúc nào.' },
];

export function TrangChu() {
  const navigate = useNavigate();
  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <Typography.Text className="eyebrow">BỮA ĂN ĐÁNG NHỚ BẮT ĐẦU TỪ MỘT CHỖ NGỒI TỐT</Typography.Text>
          <Typography.Title level={1}>Đặt bàn nhanh, đến quán là có chỗ.</Typography.Title>
          <Typography.Paragraph>
            Chọn ngày, giờ và số người. Hệ thống kiểm tra bàn trống trực tiếp để bạn khỏi phải gọi đi gọi lại.
          </Typography.Paragraph>
          <Space wrap>
            <Button size="large" type="primary" icon={<CalendarOutlined />} onClick={() => navigate('/dat-ban')}>Đặt bàn ngay</Button>
            <Button size="large" onClick={() => navigate('/thuc-don')}>Xem thực đơn</Button>
          </Space>
        </div>
      </section>
      <section className="section page-container">
        <Row gutter={[20, 20]}>
          {buoc.map((x) => <Col xs={24} md={8} key={x.title}>
            <Card className="feature-card">
              <div className="feature-icon">{x.icon}</div>
              <Typography.Title level={4}>{x.title}</Typography.Title>
              <Typography.Paragraph type="secondary">{x.text}</Typography.Paragraph>
            </Card>
          </Col>)}
        </Row>
      </section>
    </>
  );
}
