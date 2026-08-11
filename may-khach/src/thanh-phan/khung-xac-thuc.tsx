import {
  CalendarOutlined,
  CheckCircleOutlined,
  LockOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import { Card, Col, Row, Space, Typography } from 'antd';
import type { ReactNode } from 'react';
import { hinhAnhMau } from '@/cau-hinh/hinh-anh-mau';
import { moiTruong } from '@/cau-hinh/moi-truong';

export function KhungXacThuc({
  eyebrow,
  tieuDe,
  moTa,
  children,
}: {
  eyebrow: string;
  tieuDe: string;
  moTa: string;
  children: ReactNode;
}) {
  return (
    <div className="auth-page">
      <div className="page-container auth-page-grid">
        <div className="auth-visual">
          <img src={hinhAnhMau.hero} alt="Không gian ẩm thực tại nhà hàng" />
          <div className="auth-visual-overlay">
            <span className="brand-mark"><ShopOutlined /></span>
            <Typography.Title level={2}>{moiTruong.tenNhaHang}</Typography.Title>
            <Typography.Paragraph>
              Quản lý lịch đặt bàn, theo dõi trạng thái và cập nhật thông tin của bạn trong một tài khoản.
            </Typography.Paragraph>
            <Row gutter={[10, 10]}>
              <Col span={24}>
                <Space><CheckCircleOutlined /> Lịch đặt bàn được lưu lại</Space>
              </Col>
              <Col span={24}>
                <Space><CalendarOutlined /> Theo dõi trạng thái đặt bàn</Space>
              </Col>
              <Col span={24}>
                <Space><LockOutlined /> Phiên đăng nhập được bảo vệ</Space>
              </Col>
            </Row>
          </div>
        </div>

        <div className="auth-form-column">
          <Card className="auth-card auth-card-final">
            <Typography.Text className="eyebrow">{eyebrow}</Typography.Text>
            <Typography.Title level={2}>{tieuDe}</Typography.Title>
            <Typography.Paragraph type="secondary">{moTa}</Typography.Paragraph>
            {children}
          </Card>
        </div>
      </div>
    </div>
  );
}
