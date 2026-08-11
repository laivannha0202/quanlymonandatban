import {
  AppstoreOutlined,
  AuditOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  EnvironmentOutlined,
  GiftOutlined,
  LogoutOutlined,
  MenuOutlined,
  MessageOutlined,
  PieChartOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  ShopOutlined,
  TagsOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Breadcrumb, Button, Drawer, Grid, Layout, Menu, Space, Typography } from 'antd';
import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { useXacThuc } from '@/ngu-canh/xac-thuc.context';

const { Header, Sider, Content } = Layout;

const muc = [
  { key: '/quan-tri', icon: <DashboardOutlined />, label: 'Tổng quan' },
  { key: '/quan-tri/dat-ban', icon: <CalendarOutlined />, label: 'Đặt bàn' },
  { key: '/quan-tri/khu-vuc', icon: <EnvironmentOutlined />, label: 'Khu vực' },
  { key: '/quan-tri/ban-an', icon: <AppstoreOutlined />, label: 'Bàn ăn' },
  { key: '/quan-tri/danh-muc-mon', icon: <TagsOutlined />, label: 'Danh mục món' },
  { key: '/quan-tri/mon-an', icon: <ShopOutlined />, label: 'Món ăn' },
  { key: '/quan-tri/khach-hang', icon: <TeamOutlined />, label: 'Khách hàng' },
  { key: '/quan-tri/nhan-vien', icon: <UserOutlined />, label: 'Nhân viên' },
  { key: '/quan-tri/khuyen-mai', icon: <GiftOutlined />, label: 'Khuyến mãi' },
  { key: '/quan-tri/danh-gia', icon: <MessageOutlined />, label: 'Đánh giá' },
  { key: '/quan-tri/bao-cao', icon: <PieChartOutlined />, label: 'Báo cáo' },
  { key: '/quan-tri/vai-tro', icon: <SafetyCertificateOutlined />, label: 'Vai trò & quyền' },
  { key: '/quan-tri/gio-hoat-dong', icon: <ClockCircleOutlined />, label: 'Giờ hoạt động' },
  { key: '/quan-tri/ngay-dac-biet', icon: <CalendarOutlined />, label: 'Ngày đặc biệt' },
  { key: '/quan-tri/cau-hinh', icon: <SettingOutlined />, label: 'Cấu hình' },
  { key: '/quan-tri/nhat-ky', icon: <AuditOutlined />, label: 'Nhật ký' },
];

export function BoCucQuanTri() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { nguoiDung, dangXuat } = useXacThuc();
  const screens = Grid.useBreakpoint();
  const [moMenu, setMoMenu] = useState(false);
  const selected = [...muc].reverse().find((x) => pathname === x.key || pathname.startsWith(`${x.key}/`))?.key || '/quan-tri';
  const mucHienTai = muc.find((x) => x.key === selected);
  const laDesktop = Boolean(screens.lg);

  const menu = (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={[selected]}
      items={muc}
      onClick={({ key }) => { setMoMenu(false); navigate(key); }}
    />
  );

  return (
    <Layout className="admin-shell">
      {laDesktop ? <Sider width={252} className="admin-sider">
        <div className="admin-logo"><ShopOutlined /><span>NHÀ HÀNG</span></div>
        {menu}
      </Sider> : null}
      <Drawer
        className="admin-mobile-drawer"
        placement="left"
        width={280}
        open={!laDesktop && moMenu}
        onClose={() => setMoMenu(false)}
        styles={{ body: { padding: 0, background: '#001529' }, header: { background: '#001529', color: '#fff', borderBottomColor: 'rgba(255,255,255,.12)' } }}
        title={<span style={{ color: '#fff' }}>QUẢN TRỊ NHÀ HÀNG</span>}
      >{menu}</Drawer>
      <Layout>
        <Header className="admin-header">
          <Space size={10}>
            {!laDesktop ? <Button aria-label="Mở menu quản trị" icon={<MenuOutlined />} onClick={() => setMoMenu(true)} /> : null}
            <Avatar icon={<UserOutlined />} />
            <div className="admin-user-copy">
              <Typography.Text strong>{nguoiDung?.tenDangNhap}</Typography.Text>
              <Typography.Text type="secondary" className="admin-role">{nguoiDung?.vaiTro.maVaiTro}</Typography.Text>
            </div>
          </Space>
          <Space>
            {laDesktop ? <Button icon={<ShopOutlined />} onClick={() => navigate('/')}>Trang khách</Button> : null}
            <Button icon={<LogoutOutlined />} onClick={async () => { await dangXuat(); navigate('/dang-nhap'); }}>{laDesktop ? 'Đăng xuất' : null}</Button>
          </Space>
        </Header>
        <Content className="admin-content">
          <Breadcrumb className="admin-breadcrumb" items={[
            { title: 'Quản trị', onClick: () => navigate('/quan-tri') },
            ...(selected === '/quan-tri' ? [] : [{ title: mucHienTai?.label || 'Trang quản trị' }]),
          ]} />
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
