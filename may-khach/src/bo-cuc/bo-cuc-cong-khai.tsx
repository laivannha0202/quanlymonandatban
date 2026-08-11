import {
  CalendarOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  EnvironmentOutlined,
  GiftOutlined,
  LoginOutlined,
  LogoutOutlined,
  MailOutlined,
  MenuOutlined,
  PhoneOutlined,
  SearchOutlined,
  ShopOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Button,
  Col,
  Divider,
  Drawer,
  Dropdown,
  Grid,
  Layout,
  Menu,
  Row,
  Space,
  Typography,
  type MenuProps,
} from 'antd';
import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { moiTruong } from '@/cau-hinh/moi-truong';
import { useXacThuc } from '@/ngu-canh/xac-thuc.context';

const { Header, Content, Footer } = Layout;

const dieuHuongChinh = [
  { to: '/thuc-don', label: 'Thực đơn' },
  { to: '/khuyen-mai', label: 'Khuyến mãi' },
  { to: '/dat-ban', label: 'Đặt bàn' },
  { to: '/tra-cuu', label: 'Tra cứu' },
] as const;

export function BoCucCongKhai() {
  const { nguoiDung, laKhuVucQuanTri, dangXuat } = useXacThuc();
  const navigate = useNavigate();
  const location = useLocation();
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
      if (key === 'dang-xuat') {
        await dangXuat();
        navigate('/');
        return;
      }
      navigate(`/tai-khoan/${key}`);
    },
  };

  const menuMobile: MenuProps['items'] = [
    { key: '/', icon: <ShopOutlined />, label: 'Trang chủ' },
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

  const dangChon = (to: string) =>
    location.pathname === to || (to !== '/' && location.pathname.startsWith(`${to}/`));

  return (
    <Layout className="public-shell">
      <Header className="public-header">
        <Link className="brand" to="/" aria-label={`${moiTruong.tenNhaHang} - Trang chủ`}>
          <span className="brand-mark"><ShopOutlined /></span>
          <span className="brand-copy">
            <strong>{moiTruong.tenNhaHang}</strong>
            <small>Ẩm thực & đặt bàn</small>
          </span>
        </Link>

        {laDesktop ? (
          <div className="public-nav-wrap">
            <nav className="public-nav" aria-label="Điều hướng chính">
              {dieuHuongChinh.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={dangChon(item.to) ? 'active' : undefined}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <Space size={8}>
              {nguoiDung ? (
                laKhuVucQuanTri ? (
                  <>
                    <Button icon={<DashboardOutlined />} onClick={() => navigate('/quan-tri')}>
                      Quản trị
                    </Button>
                    <Button
                      icon={<LogoutOutlined />}
                      onClick={async () => {
                        await dangXuat();
                        navigate('/');
                      }}
                    >
                      Đăng xuất
                    </Button>
                  </>
                ) : null
              ) : (
                <Button icon={<LoginOutlined />} onClick={() => navigate('/dang-nhap')}>
                  Đăng nhập
                </Button>
              )}

              {nguoiDung && !laKhuVucQuanTri ? (
                <Dropdown menu={menuTaiKhoan} trigger={['click']}>
                  <Button icon={<UserOutlined />}>Tài khoản</Button>
                </Dropdown>
              ) : null}

              <Button
                type="primary"
                icon={<CalendarOutlined />}
                onClick={() => navigate('/dat-ban')}
              >
                Đặt bàn
              </Button>
            </Space>
          </div>
        ) : (
          <Space>
            <Button
              type="primary"
              icon={<CalendarOutlined />}
              aria-label="Đặt bàn"
              onClick={() => navigate('/dat-ban')}
            />
            <Button aria-label="Mở menu" icon={<MenuOutlined />} onClick={() => setMoMenu(true)} />
          </Space>
        )}
      </Header>

      <Drawer
        title={moiTruong.tenNhaHang}
        placement="right"
        width={320}
        open={moMenu}
        onClose={() => setMoMenu(false)}
      >
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuMobile}
          onClick={async ({ key }) => {
            if (key === 'dang-xuat') {
              setMoMenu(false);
              await dangXuat();
              navigate('/');
              return;
            }
            di(key);
          }}
        />
      </Drawer>

      <Content><Outlet /></Content>

      <Footer className="public-footer">
        <div className="page-container">
          <Row gutter={[32, 28]} align="top">
            <Col xs={24} md={10}>
              <Space direction="vertical" size={10} className="footer-brand-block">
                <Link className="brand footer-brand" to="/">
                  <span className="brand-mark"><ShopOutlined /></span>
                  <span className="brand-copy">
                    <strong>{moiTruong.tenNhaHang}</strong>
                    <small>Ẩm thực & đặt bàn</small>
                  </span>
                </Link>
                <Typography.Paragraph type="secondary">
                  Trải nghiệm đặt bàn nhanh, xem thực đơn trực tuyến và quản lý lịch hẹn trong một nơi.
                </Typography.Paragraph>
              </Space>
            </Col>
            <Col xs={12} md={5}>
              <Typography.Title level={5}>Khám phá</Typography.Title>
              <Space direction="vertical" size={8}>
                <Link to="/thuc-don">Thực đơn</Link>
                <Link to="/khuyen-mai">Khuyến mãi</Link>
                <Link to="/dat-ban">Đặt bàn</Link>
                <Link to="/tra-cuu">Tra cứu</Link>
              </Space>
            </Col>
            <Col xs={12} md={9}>
              <Typography.Title level={5}>Liên hệ</Typography.Title>
              <Space direction="vertical" size={8}>
                <Typography.Text type="secondary"><EnvironmentOutlined /> Khu vực phục vụ tại nhà hàng</Typography.Text>
                <Typography.Text type="secondary"><PhoneOutlined /> 0900 000 000</Typography.Text>
                <Typography.Text type="secondary"><MailOutlined /> hello@nhahang.local</Typography.Text>
                <Typography.Text type="secondary"><ClockCircleOutlined /> Mở cửa 10:00 – 22:00</Typography.Text>
              </Space>
            </Col>
          </Row>
          <Divider />
          <div className="footer-bottom">
            <Typography.Text type="secondary">© 2026 {moiTruong.tenNhaHang}. Hệ thống quản lý & đặt bàn trực tuyến.</Typography.Text>
            <Typography.Text type="secondary">Thiết kế responsive · Dữ liệu đồng bộ API</Typography.Text>
          </div>
        </div>
      </Footer>
    </Layout>
  );
}
