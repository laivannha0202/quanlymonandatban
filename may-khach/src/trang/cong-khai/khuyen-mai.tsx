import {
  CalendarOutlined,
  CheckCircleOutlined,
  CopyOutlined,
  GiftOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Row,
  Skeleton,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { heThongApi, type KhuyenMai as KhuyenMaiType } from '@/dich-vu/he-thong.api';
import { LoiApi } from '@/dich-vu/http';
import { dinhDangNgayGio } from '@/cau-hinh/ngay-gio';
import { dinhDangTien } from '@/cau-hinh/dinh-dang';
import { khoaTruyVan } from '@/cau-hinh/khoa-truy-van';

const hienGiaTri = (r: KhuyenMaiType) =>
  r.loaiGiam === 'PHAN_TRAM' ? `${r.giaTri}%` : dinhDangTien(r.giaTri);

export function KhuyenMai() {
  const navigate = useNavigate();
  const query = useQuery({
    queryKey: khoaTruyVan.khuyenMaiCongKhai,
    queryFn: heThongApi.khuyenMaiCongKhai,
    staleTime: 60_000,
  });

  const ds = query.data ?? [];
  const loi = query.error instanceof LoiApi
    ? query.error.message
    : query.error
      ? 'Không tải được khuyến mãi.'
      : '';

  return (
    <>
      <section className="promo-page-hero">
        <div className="page-container promo-page-hero-inner">
          <div>
            <Typography.Text className="eyebrow">ƯU ĐÃI HƯƠNG VIỆT</Typography.Text>
            <Typography.Title level={1}>Thêm một chút ưu đãi cho bữa ăn trọn vẹn hơn.</Typography.Title>
            <Typography.Paragraph>
              Khám phá các chương trình còn hiệu lực và lưu lại mã phù hợp trước khi ghé nhà hàng.
            </Typography.Paragraph>
          </div>

          <div className="promo-page-hero-badge" aria-hidden="true">
            <span><GiftOutlined /></span>
            <strong>{ds.length || 3}</strong>
            <small>ưu đãi đang diễn ra</small>
          </div>
        </div>
      </section>

      <section className="page-container section promo-page-content">
        <div className="promo-section-heading">
          <div>
            <Typography.Text className="eyebrow">ĐANG ÁP DỤNG</Typography.Text>
            <Typography.Title level={2}>Chọn ưu đãi phù hợp với bữa ăn của bạn</Typography.Title>
            <Typography.Paragraph type="secondary">
              Mỗi chương trình có điều kiện riêng. Thông tin bên dưới là dữ liệu đang hiệu lực tại nhà hàng.
            </Typography.Paragraph>
          </div>
        </div>

        {loi ? <Alert type="error" showIcon message={loi} className="mb-16" /> : null}

        {query.isPending ? (
          <Row gutter={[20, 20]}>
            {Array.from({ length: 3 }).map((_, index) => (
              <Col xs={24} md={12} lg={8} key={index}>
                <Card className="promo-public-card"><Skeleton active /></Card>
              </Col>
            ))}
          </Row>
        ) : ds.length === 0 ? (
          <Card className="promo-empty-card">
            <Empty description="Hiện chưa có chương trình khuyến mãi" />
          </Card>
        ) : (
          <Row gutter={[20, 20]} align="stretch">
            {ds.map((r) => (
              <Col xs={24} md={12} lg={8} key={r.id}>
                <Card className="promo-public-card">
                  <div className="promo-public-top">
                    <span className="promo-public-icon"><GiftOutlined /></span>
                    <Tag color="red">{hienGiaTri(r)}</Tag>
                  </div>

                  <Typography.Text className="promo-public-kicker">
                    ƯU ĐÃI ĐANG DIỄN RA
                  </Typography.Text>
                  <Typography.Title level={3}>{r.tenKhuyenMai}</Typography.Title>
                  <Typography.Paragraph type="secondary" className="promo-public-description">
                    {r.moTa || 'Ưu đãi dành cho khách hàng của nhà hàng.'}
                  </Typography.Paragraph>

                  <div className="promo-public-meta">
                    {r.giaTriDonToiThieu != null ? (
                      <div>
                        <CheckCircleOutlined />
                        <span>Đơn tối thiểu <strong>{dinhDangTien(r.giaTriDonToiThieu)}</strong></span>
                      </div>
                    ) : null}
                    {r.giamToiDa != null ? (
                      <div>
                        <SafetyCertificateOutlined />
                        <span>Giảm tối đa <strong>{dinhDangTien(r.giamToiDa)}</strong></span>
                      </div>
                    ) : null}
                    <div>
                      <CalendarOutlined />
                      <span>Đến <strong>{dinhDangNgayGio(r.ngayKetThuc)}</strong></span>
                    </div>
                  </div>

                  <div className="promo-code-box">
                    <div>
                      <small>MÃ ƯU ĐÃI</small>
                      <strong>{r.maKhuyenMai}</strong>
                    </div>
                    <Tooltip title="Sao chép mã">
                      <Button
                        type="text"
                        aria-label={`Sao chép mã ${r.maKhuyenMai}`}
                        icon={<CopyOutlined />}
                        onClick={() => void navigator.clipboard?.writeText(r.maKhuyenMai)}
                      />
                    </Tooltip>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        <Card className="promo-booking-cta">
          <div>
            <Typography.Text className="eyebrow">SẴN SÀNG DÙNG BỮA?</Typography.Text>
            <Typography.Title level={3}>Chọn thời gian phù hợp và giữ bàn trước khi đến.</Typography.Title>
            <Typography.Paragraph type="secondary">
              Hệ thống sẽ kiểm tra khung giờ và phương án bàn theo tình trạng phục vụ thực tế.
            </Typography.Paragraph>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<CalendarOutlined />}
            onClick={() => navigate('/dat-ban')}
          >
            Đặt bàn ngay
          </Button>
        </Card>
      </section>
    </>
  );
}
