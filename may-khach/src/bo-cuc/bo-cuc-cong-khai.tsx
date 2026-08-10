import {
  CalendarOutlined,
  DashboardOutlined,
  GiftOutlined,
  LoginOutlined,
  LogoutOutlined,
  MenuOutlined,
  SearchOutlined,
  ShopOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Button, Drawer, Dropdown, Grid, Layout, Menu, Space, Typography, type MenuProps } from 'antd';
import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router';
import { moiTruong } from '@/cau-hinh/moi-truong';
import { useXacThuc } from '@/ngu-canh/xac-thuc.context';

const { Header, Content, Footer } = Layout;

export function BoCucCongKhai() {
  const { nguoiDung, laKhuVucQuanTri, dangXuat } = useXacThuc();
  const navigate = useNavigate();
  const screens = Grid.useBreakpoint();
  const [moMenu, setMoMenu] = useState(false);
  const laDesktop = Boolean(screens.md);

  const di = (duongDan: string) => {
    setMoMenu(false);
    navigate(duongDan);
  };

  const menuTaiKhoan: MenuProps = {
    items: [
      { key: 'dat-ban', icon: <CalendarOutlined />, label: 'Lịch đặt bàn' },
      { key: 'ho-so', icon: <UserOutlined />, label: 'Hồ sơ' },
      { key: 'danh-gia', label: 'Đánh giá' },
      { key: 'thong-bao', label: 'Thông báo' },
      { key: 'doi-mat-khau', label: 'Đổi mật khẩu' },
      { type: 'divider' },
      { key: 'dang-xuat', icon: <LogoutOutlined />, label: 'Đăng xuất', danger: true },
    ],
    onClick: async ({ key }) => {
      if (key === 'dang-xuat') { await dangXuat(); navigate('/'); return; }
      navigate(`/tai-khoan/${key}`);
    },
  };

  const menuMobile: MenuProps['items'] = [
    { key: '/thuc-don', icon: <ShopOutlined />, label: 'Thực đơn' },
    { key: '/khuyen-mai', icon: <GiftOutlined />, label: 'Khuyến mãi' },
    { key: '/dat-ban', icon: <CalendarOutlined />, label: 'Đặt bàn' },
    { key: '/tra-cuu', icon: <SearchOutlined />, label: 'Tra cứu' },
    ...(nguoiDung && !laKhuVucQuanTri ? [
      { type: 'divider' as const },
      { key: '/tai-khoan/dat-ban', icon: <CalendarOutlined />, label: 'Lịch đặt bàn của tôi' },
      { key: '/tai-khoan/ho-so', icon: <UserOutlined />, label: 'Hồ sơ' },
      { key: '/tai-khoan/danh-gia', label: 'Đánh giá của tôi' },
      { key: '/tai-khoan/thong-bao', label: 'Thông báo' },
      { key: '/tai-khoan/doi-mat-khau', label: 'Đổi mật khẩu' },
    ] : []),
    ...(nguoiDung && laKhuVucQuanTri ? [
      { type: 'divider' as const },
      { key: '/quan-tri', icon: <DashboardOutlined />, label: 'Khu quản trị' },
    ] : []),
    { type: 'divider' },
    nguoiDung
      ? { key: 'dang-xuat', icon: <LogoutOutlined />, label: 'Đăng xuất', danger: true }
      : { key: '/dang-nhap', icon: <LoginOutlined />, label: 'Đăng nhập' },
  ];

  return (
    <Layout className="public-shell">
      <Header className="public-header">
        <Link className="brand" to="/"><ShopOutlined /><span>{moiTruong.tenNhaHang}</span></Link>
        {laDesktop ? (
          <Space className="public-nav" size="middle" wrap>
            <Link to="/thuc-don">Thực đơn</Link>
            <Link to="/khuyen-mai">Khuyến mãi</Link>
            <Link to="/dat-ban">Đặt bàn</Link>
            <Link to="/tra-cuu">Tra cứu</Link>
            {nguoiDung ? (
              laKhuVucQuanTri
                ? <><Button icon={<DashboardOutlined />} type="primary" onClick={() => navigate('/quan-tri')}>Quản trị</Button><Button icon={<LogoutOutlined />} onClick={async () => { await dangXuat(); navigate('/'); }}>Đăng xuất</Button></>
                : <Dropdown menu={menuTaiKhoan} trigger={['click']}><Button icon={<UserOutlined />} type="primary">Tài khoản</Button></Dropdown>
            ) : <Button icon={<LoginOutlined />} type="primary" onClick={() => navigate('/dang-nhap')}>Đăng nhập</Button>}
          </Space>
        ) : <Button aria-label="Mở menu" icon={<MenuOutlined />} onClick={() => setMoMenu(true)} />}
      </Header>
      <Drawer title={moiTruong.tenNhaHang} placement="right" width={310} open={moMenu} onClose={() => setMoMenu(false)}>
        <Menu
          mode="inline"
          selectable={false}
          items={menuMobile}
          onClick={async ({ key }) => {
            if (key === 'dang-xuat') { setMoMenu(false); await dangXuat(); navigate('/'); return; }
            di(key);
          }}
        />
      </Drawer>
      <Content><Outlet /></Content>
      <Footer className="public-footer">
        <Typography.Text type="secondary">© 2026 {moiTruong.tenNhaHang} · Đặt bàn trực tuyến</Typography.Text>
      </Footer>
    </Layout>
  );
}
