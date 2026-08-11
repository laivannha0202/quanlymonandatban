import {
  BarChartOutlined,
  CalendarOutlined,
  ReloadOutlined,
  StarFilled,
  TeamOutlined,
} from '@ant-design/icons';
import { Column, Line, Pie } from '@ant-design/charts';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Flex,
  Row,
  Skeleton,
  Statistic,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import {
  heThongApi,
  type BaoCaoDanhGia,
  type BaoCaoDatBan,
  type BaoCaoKhachHang,
} from '@/dich-vu/he-thong.api';
import { LoiApi } from '@/dich-vu/http';

const { RangePicker } = DatePicker;

const docSo = (r: Record<string, string | number>, key: string) => Number(r[key] ?? 0);
const docChuoi = (r: Record<string, string | number>, key: string) => String(r[key] ?? '');

export function QuanTriBaoCao() {
  const [khoangNgay, setKhoangNgay] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);
  const [datBan, setDatBan] = useState<BaoCaoDatBan | null>(null);
  const [khachHang, setKhachHang] = useState<BaoCaoKhachHang | null>(null);
  const [danhGia, setDanhGia] = useState<BaoCaoDanhGia | null>(null);
  const [tai, setTai] = useState(true);
  const [loi, setLoi] = useState('');

  const tuNgay = khoangNgay[0].format('YYYY-MM-DD');
  const denNgay = khoangNgay[1].format('YYYY-MM-DD');

  const taiLai = async () => {
    setTai(true);
    setLoi('');
    try {
      const [a, b, c] = await Promise.all([
        heThongApi.baoCaoDatBan(tuNgay, denNgay),
        heThongApi.baoCaoKhachHang(tuNgay, denNgay),
        heThongApi.baoCaoDanhGia(tuNgay, denNgay),
      ]);
      setDatBan(a);
      setKhachHang(b);
      setDanhGia(c);
    } catch (e) {
      setLoi(e instanceof LoiApi ? e.message : 'Không tải được báo cáo.');
    } finally {
      setTai(false);
    }
  };

  useEffect(() => {
    void taiLai();
    // Chỉ tải tự động lần đầu; người dùng dùng nút Xem báo cáo khi đổi khoảng ngày.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const thongKeDatBan = useMemo(() => datBan?.tongQuan || {}, [datBan]);

  const duLieuTheoNgay = useMemo(
    () =>
      (datBan?.theoNgay ?? []).map((r) => ({
        ngay: docChuoi(r, 'ngay'),
        soDatBan: docSo(r, 'soDatBan'),
        soKhach: docSo(r, 'soKhach'),
      })),
    [datBan],
  );

  const duLieuTrangThai = useMemo(
    () =>
      (datBan?.theoTrangThai ?? []).map((r) => ({
        trangThai: docChuoi(r, 'trangThai'),
        soLuong: docSo(r, 'soLuong'),
      })),
    [datBan],
  );

  const duLieuKhuVuc = useMemo(
    () =>
      (datBan?.theoKhuVuc ?? []).map((r) => ({
        tenKhuVuc: docChuoi(r, 'tenKhuVuc') || 'Chưa xếp khu vực',
        soLuong: docSo(r, 'soLuong'),
      })),
    [datBan],
  );

  const duLieuSao = useMemo(
    () =>
      (danhGia?.theoSoSao ?? []).map((r) => ({
        soSao: `${docSo(r, 'soSao')} sao`,
        soLuong: docSo(r, 'soLuong'),
      })),
    [danhGia],
  );

  return (
    <>
      <Flex
        justify="space-between"
        align="flex-start"
        gap={14}
        wrap
        className="admin-final-heading"
      >
        <div>
          <Typography.Text className="eyebrow">PHÂN TÍCH DỮ LIỆU</Typography.Text>
          <Typography.Title level={2}>Báo cáo vận hành</Typography.Title>
          <Typography.Paragraph type="secondary">
            Theo dõi đặt bàn, khách hàng và chất lượng trải nghiệm theo khoảng thời gian.
          </Typography.Paragraph>
        </div>

        <div className="report-filter-final">
          <RangePicker
            value={khoangNgay}
            format="DD/MM/YYYY"
            allowClear={false}
            onChange={(v) => {
              if (v?.[0] && v?.[1]) setKhoangNgay([v[0], v[1]]);
            }}
          />
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            loading={tai}
            onClick={() => void taiLai()}
          >
            Xem báo cáo
          </Button>
        </div>
      </Flex>

      {loi && <Alert type="error" showIcon message={loi} className="mb-16" />}

      {tai && !datBan ? <Skeleton active /> : null}

      <Tabs
        className="report-tabs-final"
        items={[
          {
            key: 'dat-ban',
            label: <span><CalendarOutlined /> Đặt bàn</span>,
            children: (
              <>
                <Row gutter={[16, 16]} className="mb-24">
                  <Col xs={12} xl={6}>
                    <Card className="admin-kpi-card">
                      <span className="admin-kpi-icon"><CalendarOutlined /></span>
                      <Statistic title="Tổng đặt bàn" value={thongKeDatBan.tongDatBan ?? 0} />
                    </Card>
                  </Col>
                  <Col xs={12} xl={6}>
                    <Card className="admin-kpi-card">
                      <span className="admin-kpi-icon"><TeamOutlined /></span>
                      <Statistic title="Tổng lượt khách" value={thongKeDatBan.tongLuotKhach ?? 0} />
                    </Card>
                  </Col>
                  <Col xs={12} xl={6}>
                    <Card className="admin-kpi-card">
                      <span className="admin-kpi-icon"><BarChartOutlined /></span>
                      <Statistic title="Hoàn thành" value={thongKeDatBan.daHoanThanh ?? 0} />
                    </Card>
                  </Col>
                  <Col xs={12} xl={6}>
                    <Card className="admin-kpi-card">
                      <span className="admin-kpi-icon"><BarChartOutlined /></span>
                      <Statistic
                        title="Tỷ lệ hoàn thành"
                        value={thongKeDatBan.tyLeHoanThanh ?? 0}
                        suffix="%"
                      />
                    </Card>
                  </Col>
                </Row>

                <Row gutter={[16, 16]} className="mb-24">
                  <Col xs={24} xl={16}>
                    <Card title="Xu hướng đặt bàn" className="admin-chart-card">
                      {duLieuTheoNgay.length ? (
                        <Line
                          data={duLieuTheoNgay}
                          xField="ngay"
                          yField="soDatBan"
                          height={320}
                          point={{ size: 3 }}
                          axis={{
                            x: { labelAutoRotate: false, labelAutoHide: true },
                            y: { title: 'Số đặt bàn' },
                          }}
                        />
                      ) : (
                        <Empty description="Chưa có dữ liệu theo ngày" />
                      )}
                    </Card>
                  </Col>

                  <Col xs={24} xl={8}>
                    <Card title="Theo trạng thái" className="admin-chart-card">
                      {duLieuTrangThai.length ? (
                        <Pie
                          data={duLieuTrangThai}
                          angleField="soLuong"
                          colorField="trangThai"
                          innerRadius={0.58}
                          height={320}
                          legend={{ position: 'bottom' }}
                          label={false}
                        />
                      ) : (
                        <Empty description="Chưa có dữ liệu trạng thái" />
                      )}
                    </Card>
                  </Col>
                </Row>

                <Card title="Đặt bàn theo khu vực" className="admin-chart-card">
                  {duLieuKhuVuc.length ? (
                    <Column
                      data={duLieuKhuVuc}
                      xField="tenKhuVuc"
                      yField="soLuong"
                      height={300}
                      axis={{
                        x: { labelAutoRotate: false },
                        y: { title: 'Số đặt bàn' },
                      }}
                    />
                  ) : (
                    <Empty description="Chưa có dữ liệu khu vực" />
                  )}
                </Card>
              </>
            ),
          },
          {
            key: 'khach-hang',
            label: <span><TeamOutlined /> Khách hàng</span>,
            children: (
              <>
                <Row gutter={[16, 16]} className="mb-24">
                  <Col xs={12} xl={6}>
                    <Card className="admin-kpi-card">
                      <span className="admin-kpi-icon"><TeamOutlined /></span>
                      <Statistic
                        title="Khách có đặt bàn"
                        value={khachHang?.tongQuan.khachCoDatBan ?? 0}
                      />
                    </Card>
                  </Col>
                  <Col xs={12} xl={6}>
                    <Card className="admin-kpi-card">
                      <span className="admin-kpi-icon"><TeamOutlined /></span>
                      <Statistic title="Khách mới" value={khachHang?.tongQuan.khachMoi ?? 0} />
                    </Card>
                  </Col>
                </Row>

                <Card title="Top khách hàng" className="report-ranking-card">
                  {(khachHang?.topKhachHang ?? []).length ? (
                    <div className="report-ranking-list">
                      {(khachHang?.topKhachHang ?? []).slice(0, 10).map((r, index) => (
                        <div className="report-ranking-row" key={String(r.id)}>
                          <span className="report-rank">#{index + 1}</span>
                          <div className="report-ranking-copy">
                            <strong>{String(r.hoTen ?? 'Khách hàng')}</strong>
                            <span>{String(r.soDienThoai ?? '')}</span>
                          </div>
                          <div className="report-ranking-metrics">
                            <Tag>{Number(r.tongDatBan ?? 0)} lượt đặt</Tag>
                            <Tag color="green">{Number(r.tongHoanThanh ?? 0)} hoàn thành</Tag>
                            <strong>{Number(r.tongLuotKhach ?? 0)} khách</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty description="Chưa có dữ liệu khách hàng" />
                  )}
                </Card>
              </>
            ),
          },
          {
            key: 'danh-gia',
            label: <span><StarFilled /> Đánh giá</span>,
            children: (
              <>
                <Row gutter={[16, 16]} className="mb-24">
                  <Col xs={12} xl={6}>
                    <Card className="admin-kpi-card">
                      <span className="admin-kpi-icon"><StarFilled /></span>
                      <Statistic title="Tổng đánh giá" value={danhGia?.tongQuan.tongDanhGia ?? 0} />
                    </Card>
                  </Col>
                  <Col xs={12} xl={6}>
                    <Card className="admin-kpi-card">
                      <span className="admin-kpi-icon"><StarFilled /></span>
                      <Statistic
                        title="Điểm trung bình"
                        value={danhGia?.tongQuan.diemTrungBinh ?? 0}
                        precision={2}
                        suffix="/5"
                      />
                    </Card>
                  </Col>
                  <Col xs={12} xl={6}>
                    <Card className="admin-kpi-card">
                      <span className="admin-kpi-icon"><StarFilled /></span>
                      <Statistic title="Đã phản hồi" value={danhGia?.tongQuan.daPhanHoi ?? 0} />
                    </Card>
                  </Col>
                </Row>

                <Card title="Phân bố đánh giá" className="admin-chart-card">
                  {duLieuSao.length ? (
                    <Column
                      data={duLieuSao}
                      xField="soSao"
                      yField="soLuong"
                      height={300}
                      axis={{ y: { title: 'Số đánh giá' } }}
                    />
                  ) : (
                    <Empty description="Chưa có dữ liệu đánh giá" />
                  )}
                </Card>
              </>
            ),
          },
        ]}
      />
    </>
  );
}
