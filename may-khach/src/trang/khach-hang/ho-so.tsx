import {
  MailOutlined,
  PhoneOutlined,
  SaveOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Alert, App, Button, Card, Col, DatePicker, Form, Input, Row, Select } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';
import { khachHangApi, type HoSoKhachHang } from '@/dich-vu/khach-hang.api';
import { LoiApi } from '@/dich-vu/http';
import { KhungTaiKhoan } from '@/thanh-phan/khung-tai-khoan';

type HoSoForm = Omit<HoSoKhachHang, 'ngaySinh'> & { ngaySinh?: Dayjs | null };

export function HoSo() {
  const { message } = App.useApp();
  const [form] = Form.useForm<HoSoForm>();
  const [loi, setLoi] = useState('');
  const [dangLuu, setDangLuu] = useState(false);
  const [dangTai, setDangTai] = useState(true);

  useEffect(() => {
    khachHangApi
      .hoSo()
      .then((x) => form.setFieldsValue({
        ...x,
        ngaySinh: x.ngaySinh ? dayjs(x.ngaySinh) : null,
      }))
      .catch((e: unknown) => setLoi(e instanceof LoiApi ? e.message : 'Không tải được hồ sơ.'))
      .finally(() => setDangTai(false));
  }, [form]);

  return (
    <KhungTaiKhoan
      tieuDe="Hồ sơ cá nhân"
      moTa="Thông tin này giúp quá trình đặt bàn và liên hệ với nhà hàng thuận tiện hơn."
    >
      {loi && <Alert type="error" message={loi} showIcon className="mb-16" />}
      <Card loading={dangTai} className="account-data-card">
        <Form
          form={form}
          layout="vertical"
          size="large"
          requiredMark={false}
          onFinish={async (v) => {
            setDangLuu(true);
            try {
              await khachHangApi.capNhatHoSo({
                hoTen: v.hoTen,
                soDienThoai: v.soDienThoai,
                email: v.email,
                ngaySinh: v.ngaySinh ? v.ngaySinh.format('YYYY-MM-DD') : undefined,
                gioiTinh: v.gioiTinh,
              });
              message.success('Đã cập nhật hồ sơ');
            } catch (e) {
              message.error(e instanceof LoiApi ? e.message : 'Cập nhật thất bại');
            } finally {
              setDangLuu(false);
            }
          }}
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="hoTen" label="Họ tên" rules={[{ required: true, message: 'Nhập họ tên' }]}>
                <Input prefix={<UserOutlined />} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="soDienThoai" label="Số điện thoại" rules={[{ required: true, message: 'Nhập số điện thoại' }]}>
                <Input prefix={<PhoneOutlined />} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Email không hợp lệ' }]}>
                <Input prefix={<MailOutlined />} type="email" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="ngaySinh" label="Ngày sinh">
                <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="gioiTinh" label="Giới tính">
                <Select allowClear options={[
                  { value: 'NAM', label: 'Nam' },
                  { value: 'NU', label: 'Nữ' },
                  { value: 'KHAC', label: 'Khác' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Button type="primary" htmlType="submit" loading={dangLuu} icon={<SaveOutlined />}>
            Lưu thay đổi
          </Button>
        </Form>
      </Card>
    </KhungTaiKhoan>
  );
}
