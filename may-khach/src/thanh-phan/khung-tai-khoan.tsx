import {
  BellOutlined,
  CalendarOutlined,
  LockOutlined,
  StarOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Card, Tabs, Typography } from 'antd';
import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useXacThuc } from '@/ngu-canh/xac-thuc.context';

const itemsKhachHang = [
  { key: '/tai-khoan/dat-ban', label: 'Lịch đặt bàn', icon: <CalendarOutlined /> },
  { key: '/tai-khoan/ho-so', label: 'Hồ sơ', icon: <UserOutlined /> },
  { key: '/tai-khoan/danh-gia', label: 'Đánh giá', icon: <StarOutlined /> },
  { key: '/tai-khoan/thong-bao', label: 'Thông báo', icon: <BellOutlined /> },
  { key: '/tai-khoan/doi-mat-khau', label: 'Bảo mật', icon: <LockOutlined /> },
];

export function KhungTaiKhoan({
  tieuDe,
  moTa,
  children,
}: {
  tieuDe: string;
  moTa?: string;
  children: ReactNode;
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { laKhuVucQuanTri } = useXacThuc();

  const items = laKhuVucQuanTri
    ? [{ key: '/tai-khoan/doi-mat-khau', label: 'Đổi mật khẩu', icon: <LockOutlined /> }]
    : itemsKhachHang;

  const active =
    items.find((item) => pathname === item.key || pathname.startsWith(`${item.key}/`))?.key ??
    items[0]?.key;

  return (
    <div className="page-container section account-page">
      <div className="account-heading">
        <Typography.Text className="eyebrow">TÀI KHOẢN CỦA BẠN</Typography.Text>
        <Typography.Title level={2}>{tieuDe}</Typography.Title>
        {moTa ? <Typography.Paragraph type="secondary">{moTa}</Typography.Paragraph> : null}
      </div>

      <Card className="account-nav-card">
        <Tabs
          activeKey={active}
          items={items}
          onChange={(key) => navigate(key)}
          tabBarGutter={18}
        />
      </Card>

      <div className="account-content">{children}</div>
    </div>
  );
}
