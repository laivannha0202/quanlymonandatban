import {
  ArrowRightOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  TableOutlined,
  TeamOutlined,
} from '@ant-design/icons';
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
import { dinhDangTien } from '@/cau-hinh/dinh-dang';
import { quanTriApi } from '@/dich-vu/quan-tri.api';
import { LoiApi } from '@/dich-vu/http';
import { TrangThai } from '@/thanh-phan/trang-thai';
import { dinhDangNgayGio } from '@/cau-hinh/ngay-gio';
import { useXacThuc } from '@/ngu-canh/xac-thuc.context';

function laDuLieuE2E(value?: string | null) {
  return /\be2e\b/i.test(value || '');
}

function so(value: unknown) {
  return Number(value || 0);
}

function TyLe({ value, total }: { value: number; total: number }) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;
  return <Progress percent={percent} showInfo={false} strokeWidth={8} />;
}

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
        ? 'Không tải được tổng quan vận hành.'
        : '';

  if (query.isPending) {
    return (
      <div className="admin-dashboard-loading">
        <Skeleton active />
        <Skeleton active />
      </div>
    );
  }

  const tongDat = so(d?.datBan.tongDatBan);
  const choXacNhan = so(d?.datBan.choXacNhan);
  const daXacNhan = so(d?.datBan.daXacNhan);
  const dangPhucVu = so(d?.datBan.daCheckIn);
  const daHoanThanh = so(d?.datBan.daHoanThanh);
  const daHuy = so(d?.datBan.daHuy);
  const khongDen = so(d?.datBan.khongDen);
  const tongKhach = so(d?.datBan.tongKhach);

  const daThuHomNay = so(d?.taiChinh.daThuHomNay);
  const daHoanHomNay = so(d?.taiChinh.daHoanHomNay);
  const thucThuHomNay = so(d?.taiChinh.thucThuHomNay);
  const choThanhToan = so(d?.taiChinh.choThanhToan);
  const choHoanTien = so(d?.taiChinh.choHoanTien);

  const banTrong = so(d?.banAn.trong);
  const banDangDung = so(d?.banAn.dangSuDung);
  const banBaoTri = so(d?.banAn.baoTri);
  const tongBanVanHanh = banTrong + banDangDung + banBaoTri;

  const bayGio = dayjs();
  const datBanGanToi = (d?.datBanGanToi || [])
    .filter((item) => !laDuLieuE2E(item.hoTen) && !laDuLieuE2E(item.maDatBan))
    .filter((item) => {
      const batDau = dayjs(item.gioBatDau);
      return batDau.isValid() && batDau.isAfter(bayGio);
    })
    .slice(0, 6);

  const lichGanNhat = datBanGanToi[0];
  const tyLeHoanThanh = tongDat > 0 ? Math.round((daHoanThanh / tongDat) * 100) : 0;

  const quickActions = [
    coQuyen('DAT_BAN_XEM')
      ? { label: 'Mở đặt bàn', icon: <CalendarOutlined />, path: '/quan-tri/dat-ban' }
      : null,
    coQuyen('BAN_AN_XEM')
      ? { label: 'Xem sơ đồ bàn', icon: <TableOutlined />, path: '/quan-tri/ban-an' }
      : null,
    coQuyen('KHACH_HANG_XEM')
      ? { label: 'Tra khách hàng', icon: <TeamOutlined />, path: '/quan-tri/khach-hang' }
      : null,
    coQuyen('BAO_CAO_XEM')
      ? { label: 'Báo cáo cuối ngày', icon: <ArrowRightOutlined />, path: '/quan-tri/bao-cao' }
      : null,
  ].filter(Boolean) as Array<{ label: string; icon: ReactNode; path: string }>;

  return (
    <div className="admin-dashboard-page">
      <Flex
        justify="space-between"
        align="flex-start"
        wrap
        gap={14}
        className="admin-final-heading admin-ops-heading"
      >
        <div>
          <Typography.Text className="eyebrow">CA VẬN HÀNH HÔM NAY</Typography.Text>
          <Typography.Title level={2}>Những việc cần nắm ngay</Typography.Title>
          <Typography.Paragraph type="secondary">
            {dayjs(d?.ngay).isValid()
              ? dayjs(d?.ngay).format('dddd, DD/MM/YYYY')
              : dayjs().format('DD/MM/YYYY')}
            {' · '}Ưu tiên xác nhận đặt bàn, khách sắp đến và tình trạng bàn.
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

      {loi ? <Alert type="error" showIcon message={loi} /> : null}

      {d ? (
        <>
          <section className="admin-ops-attention" aria-label="Việc cần xử lý">
            <div className="admin-ops-section-heading">
              <div>
                <Typography.Text type="secondary">CẦN XỬ LÝ</Typography.Text>
                <Typography.Title level={4}>Ưu tiên trong ca</Typography.Title>
              </div>
              {coQuyen('DAT_BAN_XEM') ? (
                <Button type="link" onClick={() => navigate('/quan-tri/dat-ban')}>
                  Mở danh sách đặt bàn <ArrowRightOutlined />
                </Button>
              ) : null}
            </div>

            <Row gutter={[14, 14]} align="top">
              <Col xs={24} md={8}>
                <Card className={`admin-ops-focus-card ${choXacNhan > 0 ? 'is-urgent' : ''}`}>
                  <div className="admin-ops-focus-top">
                    <span className="admin-ops-focus-icon"><ClockCircleOutlined /></span>
                    <Tag color={choXacNhan > 0 ? 'orange' : 'green'}>
                      {choXacNhan > 0 ? 'Cần phản hồi' : 'Đã xử lý'}
                    </Tag>
                  </div>
                  <strong className="admin-ops-focus-number">{choXacNhan}</strong>
                  <span className="admin-ops-focus-label">đặt bàn chờ xác nhận</span>
                  <Typography.Text type="secondary">
                    {choXacNhan > 0
                      ? 'Nên xác nhận sớm để khách chủ động lịch đến.'
                      : 'Hiện không có yêu cầu nào đang chờ.'}
                  </Typography.Text>
                </Card>
              </Col>

              <Col xs={24} md={8}>
                <Card className="admin-ops-focus-card">
                  <div className="admin-ops-focus-top">
                    <span className="admin-ops-focus-icon"><CalendarOutlined /></span>
                    <Tag>{datBanGanToi.length} lịch</Tag>
                  </div>
                  <strong className="admin-ops-focus-number">
                    {lichGanNhat ? dayjs(lichGanNhat.gioBatDau).format('HH:mm') : '—'}
                  </strong>
                  <span className="admin-ops-focus-label">lịch phục vụ gần nhất</span>
                  <Typography.Text type="secondary">
                    {lichGanNhat
                      ? `${lichGanNhat.hoTen} · ${lichGanNhat.soNguoi} khách`
                      : 'Chưa có lượt đặt bàn sắp tới.'}
                  </Typography.Text>
                </Card>
              </Col>

              <Col xs={24} md={8}>
                <Card className="admin-ops-focus-card">
                  <div className="admin-ops-focus-top">
                    <span className="admin-ops-focus-icon"><TableOutlined /></span>
                    <Tag color={banTrong > 0 ? 'green' : 'red'}>
                      {banTrong > 0 ? 'Sẵn sàng' : 'Cần kiểm tra'}
                    </Tag>
                  </div>
                  <strong className="admin-ops-focus-number">{banTrong}</strong>
                  <span className="admin-ops-focus-label">bàn đang trống</span>
                  <Typography.Text type="secondary">
                    {banDangDung} bàn đang phục vụ
                    {banBaoTri > 0 ? ` · ${banBaoTri} bảo trì` : ''}
                  </Typography.Text>
                </Card>
              </Col>
            </Row>
          </section>


          {coQuyen('THANH_TOAN_XEM') ? (
            <section
              className="admin-dashboard-finance-kpis"
              aria-label="Tài chính hôm nay"
            >
              <div className="admin-ops-section-heading">
                <div>
                  <Typography.Text type="secondary">
                    TÀI CHÍNH HÔM NAY
                  </Typography.Text>
                  <Typography.Title level={4}>
                    Tiền đã thực sự thu và hoàn
                  </Typography.Title>
                </div>
                <Button
                  type="link"
                  onClick={() => navigate('/quan-tri/thanh-toan')}
                >
                  Mở thanh toán <ArrowRightOutlined />
                </Button>
              </div>

              <Row gutter={[14, 14]}>
                <Col xs={24} sm={12} xl={6}>
                  <Card>
                    <Statistic
                      title="Thực thu hôm nay"
                      value={thucThuHomNay}
                      formatter={(value) =>
                        dinhDangTien(Number(value))
                      }
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} xl={6}>
                  <Card>
                    <Statistic
                      title="Đã thu"
                      value={daThuHomNay}
                      formatter={(value) =>
                        dinhDangTien(Number(value))
                      }
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} xl={6}>
                  <Card>
                    <Statistic
                      title="Đã hoàn"
                      value={daHoanHomNay}
                      formatter={(value) =>
                        dinhDangTien(Number(value))
                      }
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} xl={6}>
                  <Card>
                    <Statistic
                      title="Đang chờ xử lý"
                      value={choThanhToan + choHoanTien}
                      suffix="giao dịch"
                    />
                    <Typography.Text type="secondary">
                      {choThanhToan} chờ thanh toán · {choHoanTien} chờ hoàn
                    </Typography.Text>
                  </Card>
                </Col>
              </Row>
            </section>
          ) : null}

          <Row gutter={[18, 18]} align="top" className="admin-ops-main-row">
            <Col xs={24} xl={16}>
              <Card
                title="Lịch phục vụ sắp tới"
                className="admin-ops-upcoming-card"
                extra={
                  coQuyen('DAT_BAN_XEM') ? (
                    <Button type="link" onClick={() => navigate('/quan-tri/dat-ban')}>
                      Xem tất cả <ArrowRightOutlined />
                    </Button>
                  ) : null
                }
              >
                <Table
                  rowKey="id"
                  dataSource={datBanGanToi}
                  pagination={false}
                  size="middle"
                  scroll={{ x: 760 }}
                  locale={{ emptyText: 'Chưa có đặt bàn sắp tới' }}
                  columns={[
                    {
                      title: 'Giờ',
                      dataIndex: 'gioBatDau',
                      width: 100,
                      render: (v: string) => (
                        <strong className="admin-ops-time">{dayjs(v).format('HH:mm')}</strong>
                      ),
                    },
                    {
                      title: 'Khách',
                      dataIndex: 'hoTen',
                      width: 210,
                      render: (v: string, row) => (
                        <div className="admin-ops-guest">
                          <strong>{v}</strong>
                          <span>{row.maDatBan}</span>
                        </div>
                      ),
                    },
                    {
                      title: 'Số khách',
                      dataIndex: 'soNguoi',
                      width: 105,
                      render: (v: number) => `${v} người`,
                    },
                    {
                      title: 'Trạng thái',
                      dataIndex: 'trangThai',
                      width: 145,
                      render: (v: string) => <TrangThai value={v} />,
                    },
                  ]}
                />
              </Card>
            </Col>

            <Col xs={24} xl={8}>
              <Card title="Tình trạng bàn" className="admin-ops-table-card">
                <div className="admin-ops-table-total">
                  <div>
                    <Typography.Text type="secondary">Bàn đang tham gia vận hành</Typography.Text>
                    <strong>{tongBanVanHanh}</strong>
                  </div>
                  <TableOutlined />
                </div>

                <div className="admin-ops-meter-list">
                  <div className="admin-ops-meter">
                    <div><span>Bàn trống</span><strong>{banTrong}</strong></div>
                    <TyLe value={banTrong} total={tongBanVanHanh} />
                  </div>
                  <div className="admin-ops-meter">
                    <div><span>Đang phục vụ</span><strong>{banDangDung}</strong></div>
                    <TyLe value={banDangDung} total={tongBanVanHanh} />
                  </div>
                  {banBaoTri > 0 ? (
                    <div className="admin-ops-meter">
                      <div><span>Bảo trì</span><strong>{banBaoTri}</strong></div>
                      <TyLe value={banBaoTri} total={tongBanVanHanh} />
                    </div>
                  ) : null}
                </div>

                {coQuyen('BAN_AN_XEM') ? (
                  <Button block onClick={() => navigate('/quan-tri/ban-an')}>
                    Mở quản lý bàn
                  </Button>
                ) : null}
              </Card>
            </Col>
          </Row>

          <Card title="Nhịp vận hành hôm nay" className="admin-ops-summary-card">
            <div className="admin-ops-summary-grid">
              <div>
                <span>Đặt bàn</span>
                <strong>{tongDat}</strong>
                <small>{tongKhach} lượt khách</small>
              </div>
              <div>
                <span>Đã xác nhận</span>
                <strong>{daXacNhan}</strong>
                <small>{dangPhucVu} đang phục vụ</small>
              </div>
              <div>
                <span>Hoàn thành</span>
                <strong>{daHoanThanh}</strong>
                <small>{tyLeHoanThanh}% tổng lượt hôm nay</small>
              </div>
              <div>
                <span>Hủy / không đến</span>
                <strong>{daHuy + khongDen}</strong>
                <small>{daHuy} hủy · {khongDen} không đến</small>
              </div>
              <div>
                <span>Khách mới</span>
                <strong>{so(d.khachHang.khachMoiHomNay)}</strong>
                <small>Tài khoản hoặc hồ sơ mới</small>
              </div>
            </div>

            {quickActions.length ? (
              <div className="admin-ops-actions">
                <span>Đi nhanh tới:</span>
                <Space size={[8, 8]} wrap>
                  {quickActions.map((item) => (
                    <Button
                      key={item.path}
                      icon={item.icon}
                      onClick={() => navigate(item.path)}
                    >
                      {item.label}
                    </Button>
                  ))}
                </Space>
              </div>
            ) : null}
          </Card>
        </>
      ) : (
        <Empty description="Chưa có dữ liệu vận hành" />
      )}
    </div>
  );
}
