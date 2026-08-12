import {
  AppstoreOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  EnvironmentOutlined,
  GiftOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
  MessageOutlined,
  PieChartOutlined,
  SafetyCertificateOutlined,
  ShopOutlined,
  TagsOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Breadcrumb,
  Button,
  Drawer,
  Dropdown,
  Grid,
  Layout,
  Menu,
  Space,
  Typography,
  type MenuProps,
} from 'antd';
import { useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { moiTruong } from '@/cau-hinh/moi-truong';
import { useXacThuc } from '@/ngu-canh/xac-thuc.context';

const { Header, Sider, Content } = Layout;

const tenVaiTroQuanTri: Record<string, string> = {
  QUAN_TRI_VIEN: 'Quản trị viên',
  QUAN_LY: 'Quản lý',
  NHAN_VIEN: 'Nhân viên',
  KHACH_HANG: 'Khách hàng',
};

function hienThiVaiTro(ma?: string) {
  if (!ma) return 'Tài khoản';
  return tenVaiTroQuanTri[ma] || ma.replaceAll('_', ' ').toLocaleLowerCase('vi-VN');
}

function tenThuongHieuAdmin(ten: string) {
  const gon = ten.replace(/^Nhà hàng\s*/i, '').trim();
  return gon || 'Hương Việt';
}


const muc = [
  {
    key: '/quan-tri',
    icon: <DashboardOutlined />,
    label: 'Tổng quan',
    quyen: 'DASHBOARD_XEM',
    nhom: 'tong-quan',
  },
  {
    key: '/quan-tri/dat-ban',
    icon: <CalendarOutlined />,
    label: 'Đặt bàn',
    quyen: 'DAT_BAN_XEM',
    nhom: 'van-hanh',
  },
  {
    key: '/quan-tri/khu-vuc',
    icon: <EnvironmentOutlined />,
    label: 'Khu vực',
    quyen: 'KHU_VUC_XEM',
    nhom: 'van-hanh',
  },
  {
    key: '/quan-tri/ban-an',
    icon: <AppstoreOutlined />,
    label: 'Bàn ăn',
    quyen: 'BAN_AN_XEM',
    nhom: 'van-hanh',
  },
  {
    key: '/quan-tri/danh-muc-mon',
    icon: <TagsOutlined />,
    label: 'Danh mục món',
    quyen: 'DANH_MUC_MON_XEM',
    nhom: 'noi-dung',
  },
  {
    key: '/quan-tri/mon-an',
    icon: <ShopOutlined />,
    label: 'Món ăn',
    quyen: 'MON_AN_XEM',
    nhom: 'noi-dung',
  },
  {
    key: '/quan-tri/khuyen-mai',
    icon: <GiftOutlined />,
    label: 'Khuyến mãi',
    quyen: 'KHUYEN_MAI_XEM',
    nhom: 'noi-dung',
  },
  {
    key: '/quan-tri/danh-gia',
    icon: <MessageOutlined />,
    label: 'Đánh giá',
    quyen: 'DANH_GIA_XEM',
    nhom: 'khach-hang',
  },
  {
    key: '/quan-tri/khach-hang',
    icon: <TeamOutlined />,
    label: 'Khách hàng',
    quyen: 'KHACH_HANG_XEM',
    nhom: 'khach-hang',
  },
  {
    key: '/quan-tri/nhan-vien',
    icon: <UserOutlined />,
    label: 'Nhân viên',
    quyen: 'NHAN_VIEN_XEM',
    nhom: 'he-thong',
  },
  {
    key: '/quan-tri/bao-cao',
    icon: <PieChartOutlined />,
    label: 'Báo cáo',
    quyen: 'BAO_CAO_XEM',
    nhom: 'bao-cao',
  },
  {
    key: '/quan-tri/vai-tro',
    icon: <SafetyCertificateOutlined />,
    label: 'Vai trò & quyền',
    quyen: 'VAI_TRO_QUAN_LY',
    nhom: 'he-thong',
  },
  {
    key: '/quan-tri/gio-hoat-dong',
    icon: <ClockCircleOutlined />,
    label: 'Giờ hoạt động',
    quyen: 'LICH_PHUC_VU_QUAN_LY',
    nhom: 'he-thong',
  },
  {
    key: '/quan-tri/ngay-dac-biet',
    icon: <CalendarOutlined />,
    label: 'Ngày đặc biệt',
    quyen: 'LICH_PHUC_VU_QUAN_LY',
    nhom: 'he-thong',
  },
] as const;

const tenNhom: Record<string, string> = {
  'tong-quan': 'Tổng quan',
  'van-hanh': 'Vận hành',
  'noi-dung': 'Thực đơn & nội dung',
  'khach-hang': 'Khách hàng',
  'bao-cao': 'Phân tích',
  'he-thong': 'Hệ thống',
};

export function BoCucQuanTri() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { nguoiDung, dangXuat, coQuyen } = useXacThuc();
  const screens = Grid.useBreakpoint();
  const [moMenu, setMoMenu] = useState(false);
  const [thuGon, setThuGon] = useState(false);

  const mucHienThi = useMemo(
    () => muc.filter((item) => coQuyen(item.quyen)),
    [coQuyen, nguoiDung?.quyen],
  );

  const selected =
    [...mucHienThi]
      .reverse()
      .find((item) => pathname === item.key || pathname.startsWith(`${item.key}/`))
      ?.key ?? '';

  const mucHienTai =
    [...muc]
      .sort((a, b) => b.key.length - a.key.length)
      .find((item) => pathname === item.key || pathname.startsWith(`${item.key}/`)) ?? null;

  const laDesktop = Boolean(screens.lg);

  const menuItems = useMemo<MenuProps['items']>(() => {
    const thuTuNhom = ['tong-quan', 'van-hanh', 'noi-dung', 'khach-hang', 'bao-cao', 'he-thong'];
    return thuTuNhom
      .map((nhom) => {
        const children = mucHienThi
          .filter((item) => item.nhom === nhom)
          .map((item) => ({
            key: item.key,
            icon: item.icon,
            label: item.label,
          }));

        if (!children.length) return null;

        return {
          type: 'group' as const,
          label: tenNhom[nhom],
          children,
        };
      })
      .filter(Boolean) as MenuProps['items'];
  }, [mucHienThi]);

  const menu = (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={selected ? [selected] : []}
      items={menuItems}
      onClick={({ key }) => {
        setMoMenu(false);
        navigate(key);
      }}
      className="admin-menu-final"
    />
  );

  const menuNguoiDung: MenuProps = {
    items: [
      {
        key: 'trang-khach',
        icon: <ShopOutlined />,
        label: 'Xem trang khách',
      },
      {
        key: 'doi-mat-khau',
        icon: <SafetyCertificateOutlined />,
        label: 'Đổi mật khẩu',
      },
      { type: 'divider' },
      {
        key: 'dang-xuat',
        icon: <LogoutOutlined />,
        label: 'Đăng xuất',
        danger: true,
      },
    ],
    onClick: async ({ key }) => {
      if (key === 'trang-khach') {
        navigate('/');
        return;
      }
      if (key === 'doi-mat-khau') {
        navigate('/tai-khoan/doi-mat-khau');
        return;
      }
      if (key === 'dang-xuat') {
        await dangXuat();
        navigate('/dang-nhap');
      }
    },
  };

  return (
    <Layout className="admin-shell admin-shell-final">
      {laDesktop ? (
        <Sider
          width={264}
          collapsedWidth={84}
          collapsed={thuGon}
          trigger={null}
          className="admin-sider admin-sider-final"
        >
          <button
            type="button"
            className={`admin-brand ${thuGon ? 'collapsed' : ''}`}
            onClick={() => navigate('/quan-tri')}
            aria-label="Về tổng quan quản trị"
          >
            <span className="admin-brand-mark"><ShopOutlined /></span>
            {!thuGon ? (
              <span className="admin-brand-copy">
                <strong>{tenThuongHieuAdmin(moiTruong.tenNhaHang)}</strong>
                <small>Quản trị vận hành</small>
              </span>
            ) : null}
          </button>

          <div className="admin-menu-scroll">{menu}</div>

          <div className="admin-sider-bottom">
            <Button
              type="text"
              block
              icon={thuGon ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setThuGon((v) => !v)}
              aria-label={thuGon ? 'Mở rộng menu' : 'Thu gọn menu'}
            >
              {!thuGon ? 'Thu gọn' : null}
            </Button>
          </div>
        </Sider>
      ) : null}

      <Drawer
        className="admin-mobile-drawer"
        placement="left"
        width={292}
        open={!laDesktop && moMenu}
        onClose={() => setMoMenu(false)}
        styles={{
          body: { padding: 0, background: '#1d1412' },
          header: {
            background: '#1d1412',
            color: '#fff',
            borderBottomColor: 'rgba(255,255,255,.10)',
          },
        }}
        title={<span style={{ color: '#fff' }}>{moiTruong.tenNhaHang}</span>}
      >
        <div className="admin-mobile-brand">
          <span className="admin-brand-mark"><ShopOutlined /></span>
          <div>
            <strong>Quản trị nhà hàng</strong>
            <small>Vận hành & báo cáo</small>
          </div>
        </div>
        {menu}
      </Drawer>

      <Layout className="admin-main-layout">
        <Header className="admin-header admin-header-final">
          <Space size={10}>
            {!laDesktop ? (
              <Button
                aria-label="Mở menu quản trị"
                icon={<MenuOutlined />}
                onClick={() => setMoMenu(true)}
              />
            ) : null}

            <div className="admin-page-context">
              <Typography.Text type="secondary">Khu quản trị</Typography.Text>
              <strong>{mucHienTai?.label ?? 'Tổng quan'}</strong>
            </div>
          </Space>

          <Space size={8}>
            <Dropdown menu={menuNguoiDung} trigger={['click']} placement="bottomRight">
              <button type="button" className="admin-user-button">
                <Avatar icon={<UserOutlined />} />
                <span className="admin-user-copy">
                  <strong>{nguoiDung?.tenDangNhap}</strong>
                  <small>{hienThiVaiTro(nguoiDung?.vaiTro.maVaiTro)}</small>
                </span>
              </button>
            </Dropdown>

            <Button
              aria-label="Đăng xuất"
              className="admin-header-logout"
              icon={<LogoutOutlined />}
              onClick={async () => {
                await dangXuat();
                navigate('/dang-nhap');
              }}
            >
              Đăng xuất
            </Button>
          </Space>
        </Header>

        <Content className="admin-content admin-content-final">
          <Breadcrumb
            className="admin-breadcrumb"
            items={[
              {
                title: 'Quản trị',
                onClick: () => navigate('/quan-tri'),
              },
              ...(pathname === '/quan-tri'
                ? []
                : [{ title: mucHienTai?.label ?? 'Trang quản trị' }]),
            ]}
          />
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
