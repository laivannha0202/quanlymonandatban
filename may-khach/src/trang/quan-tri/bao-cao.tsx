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
import { dinhDangTien } from '@/cau-hinh/dinh-dang';
import { LoiApi } from '@/dich-vu/http';

const { RangePicker } = DatePicker;

const docSo = (r: Record<string, string | number>, key: string) => Number(r[key] ?? 0);
const docChuoi = (r: Record<string, string | number>, key: string) => String(r[key] ?? '');

const MAU_THUONG_HIEU = '#8f2d21';
const MAU_DANH_GIA = '#b77828';

const BANG_MAU_TRANG_THAI = [
  '#8f2d21',
  '#b64d3b',
  '#d17a5f',
  '#6d4a42',
  '#c39a7b',
  '#7b2f28',
];

const TEN_TRANG_THAI_DAT_BAN: Record<string, string> = {
  CHO_XAC_NHAN: 'Chờ xác nhận',
  DA_XAC_NHAN: 'Đã xác nhận',
  DA_CHECK_IN: 'Đã check-in',
  DA_HOAN_THANH: 'Đã hoàn thành',
  DA_HUY: 'Đã hủy',
  KHONG_DEN: 'Không đến',
};

const tenTrangThaiDatBan = (ma: string) =>
  TEN_TRANG_THAI_DAT_BAN[ma] ??
  ma
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/^./, (kyTu) => kyTu.toUpperCase());

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
      (datBan?.theoNgay ?? []).map((r) => {
        const ngay = docChuoi(r, 'ngay');

        return {
          ngay,
          ngayHienThi:
            dayjs(ngay).isValid()
              ? dayjs(ngay).format('DD/MM')
              : ngay,
          soDatBan: docSo(r, 'soDatBan'),
          soKhach: docSo(r, 'soKhach'),
        };
      }),
    [datBan],
  );

  const duLieuTrangThai = useMemo(
    () =>
      (datBan?.theoTrangThai ?? []).map((r) => {
        const trangThai = docChuoi(r, 'trangThai');

        return {
          trangThai,
          nhanTrangThai:
            tenTrangThaiDatBan(trangThai),
          soLuong: docSo(r, 'soLuong'),
        };
      }),
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
                        precision={2}
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
                          xField="ngayHienThi"
                          yField="soDatBan"
                          height={320}
                          smooth
                          style={{
                            stroke: MAU_THUONG_HIEU,
                            lineWidth: 2.5,
                          }}
                          point={{
                            size: 4,
                            style: {
                              fill: MAU_THUONG_HIEU,
                              stroke: '#fff',
                              lineWidth: 2,
                            },
                          }}
                          axis={{
                            x: {
                              title: 'Ngày',
                              labelAutoRotate: false,
                              labelAutoHide: true,
                            },
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
                          colorField="nhanTrangThai"
                          innerRadius={0.58}
                          height={320}
                          scale={{
                            color: {
                              range: BANG_MAU_TRANG_THAI,
                            },
                          }}
                          legend={{
                            position: 'bottom',
                          }}
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
                      style={{
                        fill: MAU_THUONG_HIEU,
                      }}
                      axis={{
                        x: {
                          title: 'Khu vực',
                          labelAutoRotate: false,
                        },
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
            key: 'tai-chinh',
            label: <span><BarChartOutlined /> Tài chính</span>,
            children: (
              <>
                <Alert
                  type="info"
                  showIcon
                  className="mb-16"
                  message="Số tiền dựa trên giao dịch thực tế"
                  description="Đã thu và đã hoàn được tính theo thời điểm giao dịch trong khoảng ngày đang chọn; booking chưa thanh toán không được tính là doanh thu."
                />

                <Row gutter={[16, 16]} className="mb-24">
                  <Col xs={12} xl={6}>
                    <Card className="admin-kpi-card">
                      <span className="admin-kpi-icon">
                        <BarChartOutlined />
                      </span>
                      <Statistic
                        title="Đã thu"
                        value={datBan?.taiChinh.tongDaThu ?? 0}
                        formatter={(value) =>
                          dinhDangTien(Number(value))
                        }
                      />
                    </Card>
                  </Col>

                  <Col xs={12} xl={6}>
                    <Card className="admin-kpi-card">
                      <span className="admin-kpi-icon">
                        <BarChartOutlined />
                      </span>
                      <Statistic
                        title="Đã hoàn"
                        value={datBan?.taiChinh.tongDaHoan ?? 0}
                        formatter={(value) =>
                          dinhDangTien(Number(value))
                        }
                      />
                    </Card>
                  </Col>

                  <Col xs={12} xl={6}>
                    <Card className="admin-kpi-card">
                      <span className="admin-kpi-icon">
                        <BarChartOutlined />
                      </span>
                      <Statistic
                        title="Thực thu"
                        value={datBan?.taiChinh.thucThu ?? 0}
                        formatter={(value) =>
                          dinhDangTien(Number(value))
                        }
                      />
                    </Card>
                  </Col>

                  <Col xs={12} xl={6}>
                    <Card className="admin-kpi-card">
                      <span className="admin-kpi-icon">
                        <BarChartOutlined />
                      </span>
                      <Statistic
                        title="Giao dịch đã thu"
                        value={
                          datBan?.taiChinh
                            .soGiaoDichDaThu ?? 0
                        }
                      />
                    </Card>
                  </Col>
                </Row>

                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Card title="Thanh toán đang chờ">
                      <Statistic
                        value={
                          datBan?.taiChinh
                            .soGiaoDichChoThanhToan ?? 0
                        }
                        suffix="giao dịch"
                      />
                      <Typography.Text type="secondary">
                        Hàng đợi hiện tại, không giới hạn theo khoảng ngày báo cáo.
                      </Typography.Text>
                    </Card>
                  </Col>

                  <Col xs={24} md={12}>
                    <Card title="Hoàn tiền đang chờ">
                      <Statistic
                        value={
                          datBan?.taiChinh
                            .soYeuCauHoanChoXuLy ?? 0
                        }
                        suffix="yêu cầu"
                      />
                      <Typography.Text type="secondary">
                        Đã hoàn thành {datBan?.taiChinh.soGiaoDichHoan ?? 0} giao dịch hoàn trong khoảng ngày.
                      </Typography.Text>
                    </Card>
                  </Col>
                </Row>
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
                      style={{
                        fill: MAU_DANH_GIA,
                      }}
                      axis={{
                        x: { title: 'Mức đánh giá' },
                        y: { title: 'Số đánh giá' },
                      }}
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
