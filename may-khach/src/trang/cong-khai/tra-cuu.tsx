import {
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  SearchOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  Row,
  Space,
  Timeline,
  Typography,
} from 'antd';
import { useState } from 'react';
import { datBanApi } from '@/dich-vu/dat-ban.api';
import { LoiApi } from '@/dich-vu/http';
import type { DatBan } from '@/kieu/nghiep-vu';
import { TrangThai } from '@/thanh-phan/trang-thai';
import { dinhDangNgay, dinhDangNgayGio } from '@/cau-hinh/ngay-gio';

export function TraCuu() {
  const [kq, setKq] = useState<DatBan | null>(null);
  const [loi, setLoi] = useState('');
  const [tai, setTai] = useState(false);

  return (
    <>
      <section className="lookup-hero">
        <div className="page-container narrow">
          <Typography.Text className="eyebrow">TRA CỨU NHANH</Typography.Text>
          <Typography.Title level={1}>Kiểm tra trạng thái đặt bàn</Typography.Title>
          <Typography.Paragraph>
            Nhập mã đặt bàn và số điện thoại đã dùng khi đặt để xem thông tin mới nhất.
          </Typography.Paragraph>
        </div>
      </section>

      <div className="page-container section narrow">
        <Card className="lookup-form-card mb-24">
          <Form
            layout="vertical"
            size="large"
            requiredMark={false}
            onFinish={async (v: { maDatBan: string; soDienThoai: string }) => {
              setTai(true);
              setLoi('');
              setKq(null);
              try {
                setKq(await datBanApi.traCuu(v.maDatBan.trim(), v.soDienThoai.trim()));
              } catch (e) {
                setLoi(e instanceof LoiApi ? e.message : 'Không tra cứu được.');
              } finally {
                setTai(false);
              }
            }}
          >
            <Row gutter={16}>
              <Col xs={24} md={14}>
                <Form.Item name="maDatBan" label="Mã đặt bàn" rules={[{ required: true, message: 'Nhập mã đặt bàn' }]}>
                  <Input prefix={<CalendarOutlined />} placeholder="DB20260820-000001" />
                </Form.Item>
              </Col>
              <Col xs={24} md={10}>
                <Form.Item name="soDienThoai" label="Số điện thoại" rules={[{ required: true, message: 'Nhập số điện thoại' }]}>
                  <Input placeholder="09xx xxx xxx" />
                </Form.Item>
              </Col>
            </Row>
            <Button block type="primary" htmlType="submit" loading={tai} icon={<SearchOutlined />}>
              Tra cứu đặt bàn
            </Button>
          </Form>
        </Card>

        {loi && <Alert type="error" showIcon message={loi} className="mb-24" />}

        {kq && (
          <Card
            className="lookup-result-card"
            title={<Space wrap>Đặt bàn {kq.maDatBan}<TrangThai value={kq.trangThai} /></Space>}
          >
            <Descriptions
              column={{ xs: 1, sm: 2 }}
              items={[
                { key: 'ten', label: 'Khách', children: kq.hoTen },
                { key: 'sdt', label: 'Điện thoại', children: kq.soDienThoai },
                { key: 'ngay', label: 'Ngày', children: <span><CalendarOutlined /> {dinhDangNgay(kq.ngayDat)}</span> },
                { key: 'gio', label: 'Giờ', children: <span><ClockCircleOutlined /> {dinhDangNgayGio(kq.gioBatDau)}</span> },
                { key: 'nguoi', label: 'Số người', children: <span><TeamOutlined /> {kq.soNguoi} khách</span> },
                {
                  key: 'ban',
                  label: 'Bàn',
                  children: <span><EnvironmentOutlined /> {kq.banAns?.map((b) => b.tenBan || b.maBan).join(', ') || 'Hệ thống sẽ sắp'}</span>,
                },
              ]}
            />

            {kq.lichSu?.length ? (
              <div className="lookup-timeline">
                <Typography.Title level={5}>Lịch sử xử lý</Typography.Title>
                <Timeline
                  items={kq.lichSu.map((x) => ({
                    children: (
                      <div>
                        <strong>{x.hanhDong}</strong>
                        <div><Typography.Text type="secondary">{dinhDangNgayGio(x.thoiGian)}</Typography.Text></div>
                      </div>
                    ),
                  }))}
                />
              </div>
            ) : null}
          </Card>
        )}
      </div>
    </>
  );
}
