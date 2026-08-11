import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  SearchOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Form,
  Input,
  InputNumber,
  Radio,
  Result,
  Row,
  Select,
  Space,
  Steps,
  Tag,
  Typography,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { datBanApi, type TaoDatBanPayload } from '@/dich-vu/dat-ban.api';
import { LoiApi } from '@/dich-vu/http';
import type { BanAnPhuongAn, DatBan } from '@/kieu/nghiep-vu';

type GiaTriForm = Omit<TaoDatBanPayload, 'banAnIds'>;

function tenBan(p: BanAnPhuongAn): string {
  return p.banAns
    .map((b) => b.tenBan || b.ten_ban || b.maBan || b.ma_ban || b.id)
    .join(' + ');
}

export function DatBanPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm<GiaTriForm>();
  const ngay = Form.useWatch('ngay', form);
  const gioBatDau = Form.useWatch('gioBatDau', form);
  const soNguoi = Form.useWatch('soNguoi', form);
  const hoTen = Form.useWatch('hoTen', form);
  const soDienThoai = Form.useWatch('soDienThoai', form);

  const [khungGio, setKhungGio] = useState<string[]>([]);
  const [phuongAn, setPhuongAn] = useState<BanAnPhuongAn[]>([]);
  const [chon, setChon] = useState<string>('');
  const [dangTim, setDangTim] = useState(false);
  const [dangGui, setDangGui] = useState(false);
  const [ketQua, setKetQua] = useState<DatBan | null>(null);
  const [loi, setLoi] = useState('');

  const ngayChuoi = ngay || '';

  useEffect(() => {
    setKhungGio([]);
    setPhuongAn([]);
    setChon('');
    form.setFieldValue('gioBatDau', undefined);

    if (!ngayChuoi) return;

    datBanApi
      .khungGio(ngayChuoi)
      .then((x) => setKhungGio(x.danhSach))
      .catch(() => setKhungGio([]));
  }, [form, ngayChuoi]);

  const phuongAnDaChon = useMemo(() => {
    if (!chon) return null;
    return phuongAn.find((p) => p.banAns.map((b) => b.id).join(',') === chon) ?? null;
  }, [chon, phuongAn]);

  const buocHienTai = ketQua ? 3 : phuongAn.length > 0 ? 2 : ngay && gioBatDau && soNguoi ? 1 : 0;

  async function timBan() {
    try {
      const v = await form.validateFields(['ngay', 'gioBatDau', 'soNguoi']);
      const ngayTim = v.ngay;
      if (!ngayTim) return;

      setDangTim(true);
      setLoi('');
      const kq = await datBanApi.timBan({
        ngay: ngayTim,
        gioBatDau: v.gioBatDau!,
        soNguoi: v.soNguoi!,
      });

      setPhuongAn(kq.phuongAn);
      setChon('');

      if (!kq.coBan) {
        message.warning('Khung giờ này chưa có phương án bàn phù hợp.');
      }
    } catch (e) {
      if (e instanceof LoiApi) setLoi(e.message);
    } finally {
      setDangTim(false);
    }
  }

  async function gui(v: GiaTriForm) {
    try {
      const ngayGui = v.ngay;
      if (!ngayGui) return;

      setDangGui(true);
      setLoi('');

      const banAnIds = chon ? chon.split(',') : undefined;
      const payload: TaoDatBanPayload = {
        hoTen: v.hoTen,
        soDienThoai: v.soDienThoai,
        email: v.email,
        ngay: ngayGui,
        gioBatDau: v.gioBatDau,
        soNguoi: v.soNguoi,
        ghiChu: v.ghiChu,
        banAnIds,
      };

      const kq = await datBanApi.tao(payload);
      setKetQua(kq);
    } catch (e) {
      setLoi(e instanceof LoiApi ? e.message : 'Không thể tạo đặt bàn.');
    } finally {
      setDangGui(false);
    }
  }

  if (ketQua) {
    return (
      <div className="page-container section booking-success-page">
        <Card className="booking-success-card">
          <Result
            status="success"
            title="Đã nhận yêu cầu đặt bàn"
            subTitle={`Mã đặt bàn: ${ketQua.maDatBan}`}
          />
          <Descriptions
            bordered
            column={{ xs: 1, sm: 2 }}
            items={[
              { key: 'ma', label: 'Mã đặt bàn', children: <Typography.Text copyable strong>{ketQua.maDatBan}</Typography.Text> },
              { key: 'khach', label: 'Khách hàng', children: ketQua.hoTen },
              { key: 'ngay', label: 'Ngày', children: ketQua.ngayDat },
              { key: 'gio', label: 'Giờ', children: `${ketQua.gioBatDau} – ${ketQua.gioKetThuc}` },
              { key: 'nguoi', label: 'Số người', children: `${ketQua.soNguoi} khách` },
              { key: 'ban', label: 'Bàn', children: ketQua.banAns?.map((b) => b.tenBan || b.maBan).join(', ') || 'Hệ thống sẽ sắp bàn' },
            ]}
          />
          <Space wrap className="booking-success-actions">
            <Button type="primary" href="/tra-cuu">Tra cứu đặt bàn</Button>
            <Button href="/thuc-don">Xem thực đơn</Button>
            <Button onClick={() => { setKetQua(null); form.resetFields(); setPhuongAn([]); setChon(''); }}>Đặt thêm bàn</Button>
          </Space>
        </Card>
      </div>
    );
  }

  return (
    <>
      <section className="booking-page-hero">
        <div className="page-container">
          <Typography.Text className="eyebrow">ĐẶT BÀN TRỰC TUYẾN</Typography.Text>
          <Typography.Title level={1}>Chọn thời gian, tìm bàn, xác nhận trong vài phút.</Typography.Title>
          <Typography.Paragraph>
            Hệ thống kiểm tra khung giờ và phương án bàn trực tiếp trước khi ghi nhận yêu cầu.
          </Typography.Paragraph>
        </div>
      </section>

      <div className="page-container section booking-page">
        <Steps
          current={buocHienTai}
          responsive
          className="booking-steps"
          items={[
            { title: 'Thông tin', icon: <CalendarOutlined /> },
            { title: 'Tìm bàn', icon: <SearchOutlined /> },
            { title: 'Xác nhận', icon: <CheckCircleOutlined /> },
          ]}
        />

        {loi && <Alert type="error" showIcon message={loi} className="mb-16" />}

        <Row gutter={[24, 24]} align="top">
          <Col xs={24} lg={16}>
            <Card className="booking-form-card">
              <Form
                form={form}
                layout="vertical"
                onFinish={gui}
                initialValues={{ soNguoi: 2 }}
                requiredMark="optional"
              >
                <div className="booking-section-title">
                  <span className="booking-section-icon"><TeamOutlined /></span>
                  <div>
                    <Typography.Title level={4}>Thông tin liên hệ</Typography.Title>
                    <Typography.Text type="secondary">Dùng để xác nhận và tra cứu đặt bàn.</Typography.Text>
                  </div>
                </div>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item name="hoTen" label="Họ tên" rules={[{ required: true, message: 'Nhập họ tên' }]}>
                      <Input size="large" maxLength={150} placeholder="Nguyễn Văn A" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="soDienThoai" label="Số điện thoại" rules={[{ required: true, message: 'Nhập số điện thoại' }]}>
                      <Input size="large" maxLength={30} placeholder="09xx xxx xxx" />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item name="email" label="Email">
                      <Input size="large" type="email" placeholder="email@example.com" />
                    </Form.Item>
                  </Col>
                </Row>

                <Divider />

                <div className="booking-section-title">
                  <span className="booking-section-icon"><ClockCircleOutlined /></span>
                  <div>
                    <Typography.Title level={4}>Thời gian & số khách</Typography.Title>
                    <Typography.Text type="secondary">Chọn ngày để hệ thống tải khung giờ đang nhận đặt.</Typography.Text>
                  </div>
                </div>

                <Row gutter={16}>
                  <Col xs={24} md={8}>
                    <Form.Item name="ngay" label="Ngày" rules={[{ required: true, message: 'Chọn ngày' }]}>
                      <Input
                        size="large"
                        type="date"
                        min={new Date().toISOString().slice(0, 10)}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="gioBatDau" label="Giờ" rules={[{ required: true, message: 'Chọn giờ' }]}>
                      <Select
                        size="large"
                        placeholder={ngay ? 'Chọn giờ' : 'Chọn ngày trước'}
                        disabled={!ngay}
                        options={khungGio.map((x) => ({ value: x, label: x }))}
                        notFoundContent={ngay ? 'Không có khung giờ phù hợp' : 'Chọn ngày trước'}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="soNguoi" label="Số người" rules={[{ required: true, message: 'Nhập số người' }]}>
                      <InputNumber size="large" min={1} max={20} style={{ width: '100%' }} addonAfter="khách" />
                    </Form.Item>
                  </Col>
                </Row>

                <Button
                  block
                  size="large"
                  icon={<SearchOutlined />}
                  loading={dangTim}
                  onClick={timBan}
                  disabled={!ngay || !gioBatDau || !soNguoi}
                  className="booking-find-button"
                >
                  Tìm bàn phù hợp
                </Button>

                {phuongAn.length > 0 ? (
                  <>
                    <Divider />
                    <div className="booking-section-title">
                      <span className="booking-section-icon"><EnvironmentOutlined /></span>
                      <div>
                        <Typography.Title level={4}>Chọn phương án bàn</Typography.Title>
                        <Typography.Text type="secondary">Bạn có thể chọn bàn gợi ý hoặc để hệ thống tự sắp.</Typography.Text>
                      </div>
                    </div>

                    <Radio.Group
                      value={chon}
                      onChange={(e) => setChon(e.target.value)}
                      className="booking-table-options"
                    >
                      <label className={`booking-table-option ${chon === '' ? 'selected' : ''}`}>
                        <Radio value="" />
                        <div>
                          <strong>Để hệ thống tự xếp bàn</strong>
                          <span>Hệ thống sẽ chọn phương án phù hợp nhất khi xử lý yêu cầu.</span>
                        </div>
                        <Tag color="blue">Khuyên dùng</Tag>
                      </label>

                      {phuongAn.map((p) => {
                        const ids = p.banAns.map((b) => b.id).join(',');
                        return (
                          <label key={ids} className={`booking-table-option ${chon === ids ? 'selected' : ''}`}>
                            <Radio value={ids} />
                            <div>
                              <strong>{p.kieu === 'GHEP_BAN' ? 'Ghép bàn' : 'Bàn'} · {tenBan(p)}</strong>
                              <span>
                                {p.banAns[0]?.tenKhuVuc ? `${p.banAns[0].tenKhuVuc} · ` : ''}
                                Phù hợp tối đa {p.tongSucChuaToiDa} khách
                              </span>
                            </div>
                            <Tag color={p.kieu === 'GHEP_BAN' ? 'orange' : 'green'}>
                              {p.kieu === 'GHEP_BAN' ? 'Ghép bàn' : 'Bàn đơn'}
                            </Tag>
                          </label>
                        );
                      })}
                    </Radio.Group>
                  </>
                ) : null}

                <Divider />

                <Form.Item name="ghiChu" label="Ghi chú cho nhà hàng">
                  <Input.TextArea
                    rows={4}
                    maxLength={2000}
                    showCount
                    placeholder="Ví dụ: ưu tiên bàn yên tĩnh, có trẻ nhỏ, sinh nhật..."
                  />
                </Form.Item>

                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={dangGui}
                >
                  Xác nhận đặt bàn
                </Button>
              </Form>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card className="booking-summary-card" title="Tóm tắt đặt bàn">
              <Descriptions
                column={1}
                size="small"
                colon={false}
                items={[
                  { key: 'ten', label: 'Khách hàng', children: hoTen || 'Chưa nhập' },
                  { key: 'sdt', label: 'Điện thoại', children: soDienThoai || 'Chưa nhập' },
                  { key: 'ngay', label: 'Ngày', children: ngay || 'Chưa chọn' },
                  { key: 'gio', label: 'Giờ', children: gioBatDau || 'Chưa chọn' },
                  { key: 'nguoi', label: 'Số khách', children: soNguoi ? `${soNguoi} khách` : 'Chưa chọn' },
                  {
                    key: 'ban',
                    label: 'Phương án',
                    children: phuongAnDaChon
                      ? tenBan(phuongAnDaChon)
                      : phuongAn.length
                        ? 'Hệ thống tự xếp'
                        : 'Tìm bàn để xem',
                  },
                ]}
              />
              <Divider />
              <Space direction="vertical" size={10}>
                <Typography.Text type="secondary"><CheckCircleOutlined /> Chỉ hiện khung giờ nhà hàng đang nhận đặt.</Typography.Text>
                <Typography.Text type="secondary"><CheckCircleOutlined /> Hệ thống kiểm tra xung đột bàn trước khi ghi nhận.</Typography.Text>
                <Typography.Text type="secondary"><CheckCircleOutlined /> Bạn sẽ nhận mã đặt bàn để tra cứu.</Typography.Text>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
}
