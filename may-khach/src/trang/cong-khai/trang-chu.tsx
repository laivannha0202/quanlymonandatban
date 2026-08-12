import {
  ArrowRightOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  GiftOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  ShopOutlined,
  StarFilled,
  TeamOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Empty,
  Row,
  Skeleton,
  Space,
  Tag,
  Typography,
} from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { dinhDangTien } from '@/cau-hinh/dinh-dang';
import { hinhAnhMau, layAnhMonMacDinh } from '@/cau-hinh/hinh-anh-mau';
import { moiTruong } from '@/cau-hinh/moi-truong';
import { heThongApi } from '@/dich-vu/he-thong.api';
import { thucDonApi } from '@/dich-vu/thuc-don.api';

const buoc = [
  {
    icon: <CalendarOutlined />,
    title: 'Chọn ngày & giờ',
    text: 'Khung giờ hiển thị theo lịch mở cửa và tình trạng phục vụ thực tế.',
  },
  {
    icon: <SearchOutlined />,
    title: 'Chọn phương án bàn',
    text: 'Hệ thống tìm bàn phù hợp theo số người và tránh trùng lịch.',
  },
  {
    icon: <CheckCircleOutlined />,
    title: 'Nhận mã đặt bàn',
    text: 'Lưu mã đặt bàn để tra cứu trạng thái hoặc quản lý lịch hẹn bất cứ lúc nào.',
  },
];

const loiIch = [
  {
    icon: <ClockCircleOutlined />,
    title: 'Đặt bàn trực tuyến',
    text: 'Không cần chờ máy bận hay gọi lại nhiều lần.',
  },
  {
    icon: <SafetyCertificateOutlined />,
    title: 'Kiểm tra bàn theo thời gian',
    text: 'Phương án bàn được kiểm tra từ dữ liệu vận hành của nhà hàng.',
  },
  {
    icon: <TeamOutlined />,
    title: 'Phù hợp nhiều nhóm khách',
    text: 'Hỗ trợ bàn đơn và phương án ghép bàn khi số lượng khách lớn.',
  },
];

export function TrangChu() {
  const navigate = useNavigate();
  const thongTinQuery = useQuery({
    queryKey: ['cau-hinh-cong-khai'],
    queryFn: heThongApi.thongTinNhaHangCongKhai,
    staleTime: 5 * 60_000,
  });
  const tenNhaHang = thongTinQuery.data?.tenNhaHang || moiTruong.tenNhaHang;
  const monQuery = useQuery({
    queryKey: ['trang-chu', 'mon-noi-bat'],
    queryFn: () => thucDonApi.monAn({ trang: 1, kichThuoc: 6 }),
    staleTime: 60_000,
  });
  const khuyenMaiQuery = useQuery({
    queryKey: ['trang-chu', 'khuyen-mai'],
    queryFn: heThongApi.khuyenMaiCongKhai,
    staleTime: 60_000,
  });

  const mon = monQuery.data?.danhSach ?? [];
  const khuyenMai = khuyenMaiQuery.data ?? [];

  return (
    <>
      <section className="home-hero">
        <div className="page-container home-hero-grid">
          <div className="home-hero-copy">
            <Tag color="volcano" className="home-pill">ĐẶT BÀN TRỰC TUYẾN · PHỤC VỤ MỖI NGÀY</Tag>
            <Typography.Title level={1}>
              Một bữa ăn ngon bắt đầu từ <span>một chỗ ngồi vừa ý.</span>
            </Typography.Title>
            <Typography.Paragraph>
              Khám phá thực đơn, chọn thời gian phù hợp và đặt bàn trong vài phút.
              {` ${tenNhaHang}`} giúp bạn biết tình trạng phục vụ trước khi đến.
            </Typography.Paragraph>
            <Space size={12} wrap className="home-hero-actions">
              <Button
                size="large"
                type="primary"
                icon={<CalendarOutlined />}
                onClick={() => navigate('/dat-ban')}
              >
                Đặt bàn ngay
              </Button>
              <Button
                size="large"
                icon={<ShopOutlined />}
                onClick={() => navigate('/thuc-don')}
              >
                Xem thực đơn
              </Button>
            </Space>
            <div className="home-trust-row">
              <span><CheckCircleOutlined /> Kiểm tra bàn trống</span>
              <span><CheckCircleOutlined /> Tra cứu nhanh</span>
              <span><CheckCircleOutlined /> Quản lý lịch đặt</span>
            </div>
          </div>

          <div className="home-hero-media">
            <img src={hinhAnhMau.hero} alt="Bàn ăn với nhiều món hấp dẫn" />
            <div className="home-floating-card home-floating-top">
              <span className="home-floating-icon"><ClockCircleOutlined /></span>
              <div><strong>Mở cửa theo lịch</strong><small>Khung giờ đồng bộ từ hệ thống</small></div>
            </div>
            <div className="home-floating-card home-floating-bottom">
              <span className="home-floating-icon"><CalendarOutlined /></span>
              <div><strong>Đặt bàn online</strong><small>Nhanh và chủ động</small></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section page-container home-benefits">
        <div className="section-heading center">
          <Typography.Text className="eyebrow">TRẢI NGHIỆM THUẬN TIỆN</Typography.Text>
          <Typography.Title level={2}>Từ chọn món đến giữ bàn, mọi thứ ở cùng một nơi.</Typography.Title>
        </div>
        <Row gutter={[18, 18]}>
          {loiIch.map((x) => (
            <Col xs={24} md={8} key={x.title}>
              <Card className="feature-card home-benefit-card">
                <div className="feature-icon">{x.icon}</div>
                <Typography.Title level={4}>{x.title}</Typography.Title>
                <Typography.Paragraph type="secondary">{x.text}</Typography.Paragraph>
              </Card>
            </Col>
          ))}
        </Row>
      </section>

      <section className="section home-menu-section">
        <div className="page-container">
          <div className="section-heading split">
            <div>
              <Typography.Text className="eyebrow">GỢI Ý TỪ THỰC ĐƠN</Typography.Text>
              <Typography.Title level={2}>Món ngon đang chờ bạn khám phá</Typography.Title>
              <Typography.Paragraph type="secondary">
                Thực đơn lấy trực tiếp từ hệ thống quản lý món ăn của nhà hàng.
              </Typography.Paragraph>
            </div>
            <Button type="link" icon={<ArrowRightOutlined />} onClick={() => navigate('/thuc-don')}>
              Xem toàn bộ thực đơn
            </Button>
          </div>

          {monQuery.isPending ? (
            <Skeleton active />
          ) : mon.length ? (
            <Row gutter={[18, 18]}>
              {mon.map((m, index) => (
                <Col xs={24} sm={12} lg={8} key={m.id}>
                  <Card
                    hoverable
                    className="dish-card home-dish-card"
                    onClick={() => navigate(`/thuc-don/${m.duongDan}`)}
                    cover={
                      <div className="dish-image-wrap">
                        <img
                          src={m.hinhAnhChinh || layAnhMonMacDinh(index)}
                          alt={m.tenMon}
                          loading="lazy"
                        />
                        <div className="dish-image-overlay">
                          {m.laMonNoiBat ? <Tag color="gold" icon={<StarFilled />}>Nổi bật</Tag> : null}
                          {m.conMon === false ? <Tag>Hết món</Tag> : <Tag color="green">Đang phục vụ</Tag>}
                        </div>
                      </div>
                    }
                  >
                    <Typography.Text type="secondary">{m.tenDanhMuc || 'Thực đơn'}</Typography.Text>
                    <Typography.Title level={4} className="dish-title">{m.tenMon}</Typography.Title>
                    <Typography.Paragraph type="secondary" ellipsis={{ rows: 2 }}>
                      {m.moTa || 'Món ăn được chuẩn bị chỉn chu để phục vụ tại nhà hàng.'}
                    </Typography.Paragraph>
                    <div className="dish-card-footer">
                      <div>
                        {m.giaKhuyenMai != null ? (
                          <span className="price-old home-price-old">{dinhDangTien(m.gia)}</span>
                        ) : null}
                        <div className="price">{dinhDangTien(m.giaKhuyenMai ?? m.gia)}</div>
                      </div>
                      <Button type="text">Chi tiết <ArrowRightOutlined /></Button>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <Empty description="Thực đơn đang được cập nhật" />
          )}
        </div>
      </section>

      <section className="section page-container">
        <div className="section-heading split">
          <div>
            <Typography.Text className="eyebrow">ƯU ĐÃI</Typography.Text>
            <Typography.Title level={2}>Khuyến mãi đang áp dụng</Typography.Title>
          </div>
          <Button type="link" icon={<GiftOutlined />} onClick={() => navigate('/khuyen-mai')}>
            Xem khuyến mãi
          </Button>
        </div>

        {khuyenMaiQuery.isPending ? (
          <Skeleton active />
        ) : khuyenMai.length ? (
          <Row gutter={[18, 18]}>
            {khuyenMai.slice(0, 3).map((km) => (
              <Col xs={24} md={8} key={km.id}>
                <Card className="promo-card home-promo-card">
                  <span className="promo-icon"><GiftOutlined /></span>
                  <Typography.Text className="eyebrow">ƯU ĐÃI ĐANG DIỄN RA</Typography.Text>
                  <Typography.Title level={4}>{km.tenKhuyenMai}</Typography.Title>
                  <Typography.Paragraph type="secondary">
                    {km.moTa || 'Ưu đãi dành cho khách hàng tại nhà hàng.'}
                  </Typography.Paragraph>
                  <Tag color="red" className="promo-code">Mã: {km.maKhuyenMai}</Tag>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Card className="home-empty-promo">
            <Space>
              <GiftOutlined />
              <Typography.Text>Hiện chưa có chương trình khuyến mãi. Hãy theo dõi để không bỏ lỡ ưu đãi mới.</Typography.Text>
            </Space>
          </Card>
        )}
      </section>

      <section className="section home-space-section">
        <div className="page-container">
          <div className="section-heading center light">
            <Typography.Text className="eyebrow">KHÔNG GIAN & TRẢI NGHIỆM</Typography.Text>
            <Typography.Title level={2}>Không chỉ là một bữa ăn, mà là một buổi gặp gỡ đáng nhớ.</Typography.Title>
          </div>
          <Row gutter={[18, 18]}>
            {[
              ['Bữa ăn gia đình', 'Không gian thoải mái cho những cuộc trò chuyện dài.'],
              ['Gặp gỡ bạn bè', 'Dễ dàng chọn thời gian và bàn phù hợp cho cả nhóm.'],
              ['Tiệc nhỏ & dịp đặc biệt', 'Chủ động ghi chú nhu cầu ngay khi đặt bàn.'],
            ].map(([title, text], index) => (
              <Col xs={24} md={8} key={title}>
                <Card
                  className="experience-card"
                  cover={<img src={hinhAnhMau.khongGian[index]} alt={title} loading="lazy" />}
                >
                  <Typography.Title level={4}>{title}</Typography.Title>
                  <Typography.Paragraph type="secondary">{text}</Typography.Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      <section className="section page-container">
        <div className="section-heading center">
          <Typography.Text className="eyebrow">3 BƯỚC ĐƠN GIẢN</Typography.Text>
          <Typography.Title level={2}>Đặt bàn trước khi bạn rời nhà.</Typography.Title>
        </div>
        <Row gutter={[20, 20]}>
          {buoc.map((x, index) => (
            <Col xs={24} md={8} key={x.title}>
              <Card className="feature-card booking-step-card">
                <span className="step-number">0{index + 1}</span>
                <div className="feature-icon">{x.icon}</div>
                <Typography.Title level={4}>{x.title}</Typography.Title>
                <Typography.Paragraph type="secondary">{x.text}</Typography.Paragraph>
              </Card>
            </Col>
          ))}
        </Row>
      </section>

      <section className="home-cta">
        <div className="page-container home-cta-inner">
          <div>
            <Typography.Text className="eyebrow">SẴN SÀNG CHO BỮA ĂN TIẾP THEO?</Typography.Text>
            <Typography.Title level={2}>Chọn thời gian phù hợp, phần còn lại để hệ thống lo.</Typography.Title>
          </div>
          <Button
            size="large"
            type="primary"
            icon={<CalendarOutlined />}
            onClick={() => navigate('/dat-ban')}
          >
            Đặt bàn ngay
          </Button>
        </div>
      </section>
    </>
  );
}
