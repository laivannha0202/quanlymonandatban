import { CalendarOutlined, CheckCircleOutlined, TeamOutlined, TableOutlined } from '@ant-design/icons';
import { Alert, Card, Col, Flex, Progress, Row, Skeleton, Statistic, Table, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { quanTriApi } from '@/dich-vu/quan-tri.api';
import { LoiApi } from '@/dich-vu/http';
import { TrangThai } from '@/thanh-phan/trang-thai';
import { dinhDangNgayGio } from '@/cau-hinh/ngay-gio';

export function Dashboard() {
  const query = useQuery({ queryKey: ['quan-tri', 'dashboard'], queryFn: quanTriApi.dashboard });
  const d = query.data;
  const loi = query.error instanceof LoiApi ? query.error.message : query.error ? 'Không tải được dashboard.' : '';

  if (query.isPending) return <Skeleton active />;

  const tongDat = d?.datBan.tongDatBan ?? 0;
  const daHoanThanh = d?.datBan.daHoanThanh ?? 0;
  const tyLeHoanThanh = tongDat > 0 ? Math.round((daHoanThanh / tongDat) * 100) : 0;

  return <>
    <Flex justify="space-between" align="center" wrap gap={12} className="page-title-row">
      <div>
        <Typography.Title level={2}>Tổng quan hôm nay</Typography.Title>
        <Typography.Text type="secondary">Dữ liệu vận hành được đồng bộ trực tiếp từ hệ thống.</Typography.Text>
      </div>
    </Flex>
    {loi && <Alert type="error" showIcon message={loi} className="mb-16" />}
    {d && <>
      <Row gutter={[16, 16]} className="mb-24">
        <Col xs={12} lg={6}><Card className="metric-card"><Statistic prefix={<CalendarOutlined />} title="Đặt bàn" value={d.datBan.tongDatBan ?? 0} /></Card></Col>
        <Col xs={12} lg={6}><Card className="metric-card"><Statistic prefix={<TeamOutlined />} title="Tổng khách" value={d.datBan.tongKhach ?? 0} /></Card></Col>
        <Col xs={12} lg={6}><Card className="metric-card"><Statistic prefix={<TableOutlined />} title="Bàn trống" value={d.banAn.trong ?? 0} /></Card></Col>
        <Col xs={12} lg={6}><Card className="metric-card"><Statistic prefix={<CheckCircleOutlined />} title="Khách mới" value={d.khachHang.khachMoiHomNay ?? 0} /></Card></Col>
      </Row>
      <Row gutter={[16, 16]} className="mb-24">
        <Col xs={24} lg={8}>
          <Card title="Tỷ lệ hoàn thành hôm nay" className="dashboard-progress-card">
            <Progress type="dashboard" percent={tyLeHoanThanh} />
            <Typography.Paragraph type="secondary" className="dashboard-progress-copy">
              {daHoanThanh}/{tongDat} lượt đặt bàn đã hoàn thành.
            </Typography.Paragraph>
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card title="Trạng thái đặt bàn">
            <Row gutter={[12, 12]}>
              <Col xs={12} md={8}><Statistic title="Chờ xác nhận" value={d.datBan.choXacNhan ?? 0} /></Col>
              <Col xs={12} md={8}><Statistic title="Đã xác nhận" value={d.datBan.daXacNhan ?? 0} /></Col>
              <Col xs={12} md={8}><Statistic title="Đang phục vụ" value={d.datBan.daCheckIn ?? 0} /></Col>
              <Col xs={12} md={8}><Statistic title="Hoàn thành" value={d.datBan.daHoanThanh ?? 0} /></Col>
              <Col xs={12} md={8}><Statistic title="Đã hủy" value={d.datBan.daHuy ?? 0} /></Col>
              <Col xs={12} md={8}><Statistic title="Không đến" value={d.datBan.khongDen ?? 0} /></Col>
            </Row>
          </Card>
        </Col>
      </Row>
      <Card title="Đặt bàn gần tới"><Table rowKey="id" dataSource={d.datBanGanToi || []} pagination={false} scroll={{ x: 760 }} columns={[
        { title: 'Mã', dataIndex: 'maDatBan' },
        { title: 'Khách', dataIndex: 'hoTen' },
        { title: 'Giờ', dataIndex: 'gioBatDau', render: (v: string) => dinhDangNgayGio(v) },
        { title: 'Số người', dataIndex: 'soNguoi' },
        { title: 'Trạng thái', dataIndex: 'trangThai', render: (v: string) => <TrangThai value={v} /> },
      ]} /></Card>
    </>}
  </>;
}
