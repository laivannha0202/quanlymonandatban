import {
  LockOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { Alert, App, Button, Card, Col, Form, Input, Row, Space, Typography } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { xacThucApi } from '@/dich-vu/xac-thuc.api';
import { LoiApi } from '@/dich-vu/http';
import { useXacThuc } from '@/ngu-canh/xac-thuc.context';
import { KhungTaiKhoan } from '@/thanh-phan/khung-tai-khoan';

type FormDoiMatKhau = {
  matKhauHienTai: string;
  matKhauMoi: string;
  xacNhan: string;
};

export function DoiMatKhau() {
  const { message } = App.useApp();
  const { nguoiDung, dangXuat } = useXacThuc();
  const navigate = useNavigate();
  const [form] = Form.useForm<FormDoiMatKhau>();
  const [loi, setLoi] = useState('');
  const [dangLuu, setDangLuu] = useState(false);

  return (
    <KhungTaiKhoan
      tieuDe="Bảo mật tài khoản"
      moTa="Cập nhật mật khẩu định kỳ để bảo vệ phiên đăng nhập và thông tin cá nhân."
    >
      {nguoiDung?.batBuocDoiMatKhau ? (
        <Alert
          type="warning"
          showIcon
          message="Bạn phải đổi mật khẩu trước khi tiếp tục sử dụng hệ thống."
          className="mb-16"
        />
      ) : null}

      {loi ? <Alert type="error" showIcon message={loi} className="mb-16" /> : null}

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={16}>
          <Card className="account-data-card">
            <Form
              form={form}
              layout="vertical"
              size="large"
              requiredMark={false}
              onFinish={async (values) => {
                setLoi('');
                if (values.matKhauMoi !== values.xacNhan) {
                  setLoi('Mật khẩu mới và xác nhận không khớp.');
                  return;
                }

                setDangLuu(true);
                try {
                  await xacThucApi.doiMatKhau(values.matKhauHienTai, values.matKhauMoi);
                  message.success('Đã đổi mật khẩu. Vui lòng đăng nhập lại.');
                  await dangXuat();
                  navigate('/dang-nhap', { replace: true });
                } catch (e) {
                  setLoi(e instanceof LoiApi ? e.message : 'Đổi mật khẩu thất bại.');
                } finally {
                  setDangLuu(false);
                }
              }}
            >
              <Form.Item name="matKhauHienTai" label="Mật khẩu hiện tại" rules={[{ required: true }, { min: 8 }]}>
                <Input.Password prefix={<LockOutlined />} autoComplete="current-password" />
              </Form.Item>

              <Form.Item name="matKhauMoi" label="Mật khẩu mới" rules={[{ required: true }, { min: 8 }]}>
                <Input.Password prefix={<LockOutlined />} autoComplete="new-password" />
              </Form.Item>

              <Form.Item
                name="xacNhan"
                label="Nhập lại mật khẩu mới"
                dependencies={['matKhauMoi']}
                rules={[
                  { required: true },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('matKhauMoi') === value) return Promise.resolve();
                      return Promise.reject(new Error('Mật khẩu xác nhận không khớp.'));
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<LockOutlined />} autoComplete="new-password" />
              </Form.Item>

              <Button type="primary" htmlType="submit" loading={dangLuu}>
                Lưu mật khẩu mới
              </Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card className="security-tip-card">
            <Space direction="vertical" size={12}>
              <span className="security-tip-icon"><SafetyCertificateOutlined /></span>
              <Typography.Title level={4}>Gợi ý mật khẩu an toàn</Typography.Title>
              <Typography.Text type="secondary">• Tối thiểu 8 ký tự</Typography.Text>
              <Typography.Text type="secondary">• Kết hợp chữ hoa, chữ thường và số</Typography.Text>
              <Typography.Text type="secondary">• Không dùng lại mật khẩu ở dịch vụ khác</Typography.Text>
              <Typography.Text type="secondary">• Sau khi đổi, hệ thống yêu cầu đăng nhập lại</Typography.Text>
            </Space>
          </Card>
        </Col>
      </Row>
    </KhungTaiKhoan>
  );
}
