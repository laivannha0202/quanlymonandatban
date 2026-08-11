import {
  ArrowRightOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  TableOutlined,
  TeamOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { Pie } from '@ant-design/charts';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Progress,
  Row,
  Skeleton,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { quanTriApi } from '@/dich-vu/quan-tri.api';
import { LoiApi } from '@/dich-vu/http';
import { TrangThai } from '@/thanh-phan/trang-thai';
import { dinhDangNgayGio } from '@/cau-hinh/ngay-gio';
import { useXacThuc } from '@/ngu-canh/xac-thuc.context';

const tenTrangThai: Record<string, string> = {
  CHO_XAC_NHAN: 'Chờ xác nhận',
  DA_XAC_NHAN: 'Đã xác nhận',
  DA_CHECK_IN: 'Đang phục vụ',
  DA_HOAN_THANH: 'Hoàn thành',
  DA_HUY: 'Đã hủy',
  KHONG_DEN: 'Không đến',
};

export function Dashboard() {
  const navigate = useNavigate();
  const { coQuyen } = useXacThuc();
  const query = useQuery({
    queryKey: ['quan-tri', 'dashboard'],
    queryFn: quanTriApi.dashboard,
    refetchInterval: 60_000,
  });

  const d = query.data;
  const loi =
    query.error instanceof LoiApi
      ? query.error.message
      : query.error
        ? 'Không tải được dashboard.'
        : '';

  if (query.isPending) {
    return (
      <div className="admin-dashboard-loading">
        <Skeleton active />
        <Skeleton active />
      </div>
    );
  }

  const tongDat = d?.datBan.tongDatBan ?? 0;
  const daHoanThanh = d?.datBan.daHoanThanh ?? 0;
  const tyLeHoanThanh = tongDat > 0 ? Math.round((daHoanThanh / tongDat) * 100) : 0;

  const trangThai = [
    ['CHO_XAC_NHAN', d?.datBan.choXacNhan ?? 0],
    ['DA_XAC_NHAN', d?.datBan.daXacNhan ?? 0],
    ['DA_CHECK_IN', d?.datBan.daCheckIn ?? 0],
    ['DA_HOAN_THANH', d?.datBan.daHoanThanh ?? 0],
    ['DA_HUY', d?.datBan.daHuy ?? 0],
    ['KHONG_DEN', d?.datBan.khongDen ?? 0],
  ]
    .map(([ma, value]) => ({
      type: tenTrangThai[String(ma)],
      value: Number(value),
    }))
    .filter((x) => x.value > 0);

  const quickActions = [
    coQuyen('DAT_BAN_XEM')
      ? { label: 'Quản lý đặt bàn', icon: <CalendarOutlined />, path: '/quan-tri/dat-ban' }
      : null,
    coQuyen('BAN_AN_XEM')
      ? { label: 'Xem bàn ăn', icon: <TableOutlined />, path: '/quan-tri/ban-an' }
      : null,
    coQuyen('KHACH_HANG_XEM')
      ? { label: 'Khách hàng', icon: <TeamOutlined />, path: '/quan-tri/khach-hang' }
      : null,
    coQuyen('BAO_CAO_XEM')
      ? { label: 'Xem báo cáo', icon: <ArrowRightOutlined />, path: '/quan-tri/bao-cao' }
      : null,
  ].filter(Boolean) as Array<{ label: string; icon: ReactNode; path: string }>;

  return (
    <>
      <Flex
        justify="space-between"
        align="flex-start"
        wrap
        gap={14}
        className="admin-final-heading"
      >
        <div>
          <Typography.Text className="eyebrow">TỔNG QUAN VẬN HÀNH</Typography.Text>
          <Typography.Title level={2}>Hôm nay tại nhà hàng</Typography.Title>
          <Typography.Paragraph type="secondary">
            {dayjs(d?.ngay).isValid() ? dayjs(d?.ngay).format('dddd, DD/MM/YYYY') : dayjs().format('DD/MM/YYYY')}
            {' · '}Dữ liệu đồng bộ trực tiếp từ hệ thống.
          </Typography.Paragraph>
        </div>

        <Button
          icon={<ReloadOutlined />}
          loading={query.isFetching}
          onClick={() => void query.refetch()}
        >
          Làm mới
        </Button>
      </Flex>

      {loi && <Alert type="error" showIcon message={loi} className="mb-16" />}

      {d ? (
        <>
          <Row gutter={[16, 16]} className="mb-24">
            <Col xs={12} xl={6}>
              <Card className="admin-kpi-card">
                <span className="admin-kpi-icon"><CalendarOutlined /></span>
                <Statistic title="Đặt bàn hôm nay" value={d.datBan.tongDatBan ?? 0} />
                <Typography.Text type="secondary">{d.datBan.choXacNhan ?? 0} đang chờ xác nhận</Typography.Text>
              </Card>
            </Col>
            <Col xs={12} xl={6}>
              <Card className="admin-kpi-card">
                <span className="admin-kpi-icon"><TeamOutlined /></span>
                <Statistic title="Lượt khách" value={d.datBan.tongKhach ?? 0} />
                <Typography.Text type="secondary">Tổng khách theo lịch hôm nay</Typography.Text>
              </Card>
            </Col>
            <Col xs={12} xl={6}>
              <Card className="admin-kpi-card">
                <span className="admin-kpi-icon"><TableOutlined /></span>
                <Statistic title="Bàn đang trống" value={d.banAn.trong ?? 0} />
                <Typography.Text type="secondary">{d.banAn.dangSuDung ?? 0} bàn đang sử dụng</Typography.Text>
              </Card>
            </Col>
            <Col xs={12} xl={6}>
              <Card className="admin-kpi-card">
                <span className="admin-kpi-icon"><UserAddOutlined /></span>
                <Statistic title="Khách mới" value={d.khachHang.khachMoiHomNay ?? 0} />
                <Typography.Text type="secondary">Tài khoản/khách mới hôm nay</Typography.Text>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} className="mb-24">
            <Col xs={24} xl={15}>
              <Card
                title="Trạng thái đặt bàn"
                extra={<Tag>{tongDat} lượt</Tag>}
                className="admin-chart-card"
              >
                {trangThai.length ? (
                  <div className="admin-status-chart-grid">
                    <div className="admin-chart-wrap">
                      <Pie
                        data={trangThai}
                        angleField="value"
                        colorField="type"
                        innerRadius={0.66}
                        height={300}
                        legend={{ position: 'bottom' }}
                        label={false}
                        tooltip={{ title: 'type' }}
                      />
                      <div className="admin-chart-center">
                        <strong>{tongDat}</strong>
                        <span>Tổng đặt bàn</span>
                      </div>
                    </div>

                    <div className="admin-status-list">
                      {trangThai.map((item) => (
                        <div className="admin-status-row" key={item.type}>
                          <span>{item.type}</span>
                          <strong>{item.value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có đặt bàn hôm nay" />
                )}
              </Card>
            </Col>

            <Col xs={24} xl={9}>
              <Card title="Hiệu suất hôm nay" className="admin-performance-card">
                <div className="admin-progress-wrap">
                  <Progress
                    type="dashboard"
                    percent={tyLeHoanThanh}
                    size={180}
                    strokeWidth={10}
                  />
                </div>
                <Typography.Title level={4}>{daHoanThanh}/{tongDat} lượt hoàn thành</Typography.Title>
                <Typography.Paragraph type="secondary">
                  Tỷ lệ phản ánh số lượt đã hoàn thành trên tổng đặt bàn hôm nay.
                </Typography.Paragraph>

                <div className="admin-mini-stats">
                  <div>
                    <span><CheckCircleOutlined /> Đã xác nhận</span>
                    <strong>{d.datBan.daXacNhan ?? 0}</strong>
                  </div>
                  <div>
                    <span><ClockCircleOutlined /> Đang phục vụ</span>
                    <strong>{d.datBan.daCheckIn ?? 0}</strong>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          {quickActions.length ? (
            <Card title="Thao tác nhanh" className="admin-quick-card mb-24">
              <Row gutter={[12, 12]}>
                {quickActions.map((item) => (
                  <Col xs={12} md={6} key={item.path}>
                    <Button
                      block
                      size="large"
                      icon={item.icon}
                      onClick={() => navigate(item.path)}
                      className="admin-quick-button"
                    >
                      {item.label}
                    </Button>
                  </Col>
                ))}
              </Row>
            </Card>
          ) : null}

          <Card
            title="Đặt bàn gần tới"
            extra={
              coQuyen('DAT_BAN_XEM') ? (
                <Button type="link" onClick={() => navigate('/quan-tri/dat-ban')}>
                  Xem tất cả <ArrowRightOutlined />
                </Button>
              ) : null
            }
            className="admin-upcoming-card"
          >
            <Table
              rowKey="id"
              dataSource={d.datBanGanToi || []}
              pagination={false}
              scroll={{ x: 820 }}
              locale={{ emptyText: 'Chưa có đặt bàn sắp tới' }}
              columns={[
                { title: 'Mã', dataIndex: 'maDatBan', width: 170 },
                { title: 'Khách', dataIndex: 'hoTen', width: 180 },
                {
                  title: 'Thời gian',
                  dataIndex: 'gioBatDau',
                  width: 180,
                  render: (v: string) => dinhDangNgayGio(v),
                },
                {
                  title: 'Số khách',
                  dataIndex: 'soNguoi',
                  width: 100,
                  render: (v: number) => `${v} người`,
                },
                {
                  title: 'Trạng thái',
                  dataIndex: 'trangThai',
                  width: 150,
                  render: (v: string) => <TrangThai value={v} />,
                },
              ]}
            />
          </Card>
        </>
      ) : null}
    </>
  );
}
