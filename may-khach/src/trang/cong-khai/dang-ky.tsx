import {
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Alert, Button, Divider, Form, Input, Progress, Typography } from 'antd';
import { Link, useNavigate } from 'react-router';
import { useMemo, useState } from 'react';
import { LoiApi } from '@/dich-vu/http';
import { useXacThuc } from '@/ngu-canh/xac-thuc.context';
import { KhungXacThuc } from '@/thanh-phan/khung-xac-thuc';

function diemMatKhau(value = '') {
  let diem = 0;
  if (value.length >= 8) diem += 25;
  if (/[A-Z]/.test(value)) diem += 25;
  if (/[0-9]/.test(value)) diem += 25;
  if (/[^A-Za-z0-9]/.test(value)) diem += 25;
  return diem;
}

export function DangKy() {
  const { dangKy } = useXacThuc();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const matKhau = Form.useWatch('matKhau', form) as string | undefined;
  const [loi, setLoi] = useState('');
  const [tai, setTai] = useState(false);
  const diem = useMemo(() => diemMatKhau(matKhau), [matKhau]);

  return (
    <KhungXacThuc
      eyebrow="TÀI KHOẢN KHÁCH HÀNG"
      tieuDe="Tạo tài khoản"
      moTa="Lưu lịch đặt bàn, nhận thông báo và đánh giá trải nghiệm sau khi dùng bữa."
    >
      {loi && <Alert type="error" showIcon message={loi} className="mb-16" />}
      <Form
        form={form}
        layout="vertical"
        size="large"
        requiredMark={false}
        onFinish={async (v: {
          hoTen: string;
          soDienThoai: string;
          email: string;
          matKhau: string;
          xacNhan: string;
        }) => {
          setTai(true);
          setLoi('');
          try {
            await dangKy({
              hoTen: v.hoTen,
              soDienThoai: v.soDienThoai,
              email: v.email,
              matKhau: v.matKhau,
            });
            navigate('/tai-khoan/dat-ban');
          } catch (e) {
            setLoi(e instanceof LoiApi ? e.message : 'Không thể đăng ký.');
          } finally {
            setTai(false);
          }
        }}
      >
        <Form.Item name="hoTen" label="Họ tên" rules={[{ required: true, message: 'Nhập họ tên' }]}>
          <Input prefix={<UserOutlined />} autoComplete="name" />
        </Form.Item>
        <Form.Item name="soDienThoai" label="Số điện thoại" rules={[{ required: true, message: 'Nhập số điện thoại' }]}>
          <Input prefix={<PhoneOutlined />} autoComplete="tel" />
        </Form.Item>
        <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Nhập email' }, { type: 'email', message: 'Email không hợp lệ' }]}>
          <Input prefix={<MailOutlined />} autoComplete="email" />
        </Form.Item>
        <Form.Item name="matKhau" label="Mật khẩu" rules={[{ required: true, message: 'Nhập mật khẩu' }, { min: 8, message: 'Tối thiểu 8 ký tự' }]}>
          <Input.Password prefix={<LockOutlined />} autoComplete="new-password" />
        </Form.Item>

        {matKhau ? (
          <div className="password-strength">
            <Progress percent={diem} steps={4} showInfo={false} status={diem < 50 ? 'exception' : 'normal'} />
            <Typography.Text type="secondary">
              Nên có chữ hoa, số và ký tự đặc biệt.
            </Typography.Text>
          </div>
        ) : null}

        <Form.Item
          name="xacNhan"
          label="Nhập lại mật khẩu"
          dependencies={['matKhau']}
          rules={[
            { required: true, message: 'Nhập lại mật khẩu' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('matKhau') === value) return Promise.resolve();
                return Promise.reject(new Error('Mật khẩu xác nhận không khớp.'));
              },
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined />} autoComplete="new-password" />
        </Form.Item>

        <Button block type="primary" htmlType="submit" loading={tai}>Đăng ký</Button>
      </Form>

      <Divider plain>Đã có tài khoản?</Divider>
      <Typography.Paragraph className="auth-bottom-copy">
        <Link to="/dang-nhap">Quay lại đăng nhập</Link>
      </Typography.Paragraph>
    </KhungXacThuc>
  );
}
