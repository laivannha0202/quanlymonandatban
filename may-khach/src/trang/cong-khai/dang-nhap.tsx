import {
  LockOutlined,
  MailOutlined,
} from '@ant-design/icons';
import { Alert, App, Button, Divider, Form, Input, Typography } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router';
import { useState } from 'react';
import { LoiApi } from '@/dich-vu/http';
import { useXacThuc } from '@/ngu-canh/xac-thuc.context';
import { KhungXacThuc } from '@/thanh-phan/khung-xac-thuc';

export function DangNhap() {
  const { message } = App.useApp();
  const { dangNhap } = useXacThuc();
  const navigate = useNavigate();
  const location = useLocation();
  const [loi, setLoi] = useState('');
  const [tai, setTai] = useState(false);

  return (
    <KhungXacThuc
      eyebrow="CHÀO MỪNG TRỞ LẠI"
      tieuDe="Đăng nhập"
      moTa="Truy cập lịch đặt bàn của bạn hoặc khu vực vận hành dành cho nhân viên."
    >
      {loi && <Alert type="error" showIcon message={loi} className="mb-16" />}
      <Form
        layout="vertical"
        size="large"
        requiredMark={false}
        onFinish={async (v: { taiKhoan: string; matKhau: string }) => {
          setTai(true);
          setLoi('');
          try {
            const u = await dangNhap(v.taiKhoan, v.matKhau);
            message.success('Đăng nhập thành công');
            const tu = (location.state as { tu?: string } | null)?.tu;

            if (u.batBuocDoiMatKhau) {
              navigate('/tai-khoan/doi-mat-khau', { replace: true });
              return;
            }

            navigate(
              tu || (u.vaiTro.maVaiTro === 'KHACH_HANG' ? '/tai-khoan/dat-ban' : '/quan-tri'),
              { replace: true },
            );
          } catch (e) {
            setLoi(e instanceof LoiApi ? e.message : 'Đăng nhập thất bại.');
          } finally {
            setTai(false);
          }
        }}
      >
        <Form.Item
          name="taiKhoan"
          label="Email hoặc tên đăng nhập"
          rules={[{ required: true, message: 'Nhập email hoặc tên đăng nhập' }]}
        >
          <Input prefix={<MailOutlined />} autoComplete="username" placeholder="email@example.com" />
        </Form.Item>

        <Form.Item
          name="matKhau"
          label="Mật khẩu"
          rules={[{ required: true, message: 'Nhập mật khẩu' }]}
        >
          <Input.Password prefix={<LockOutlined />} autoComplete="current-password" placeholder="Mật khẩu" />
        </Form.Item>

        <div className="auth-helper-row">
          <Typography.Text type="secondary">Dùng tài khoản đã đăng ký</Typography.Text>
          <Link to="/quen-mat-khau">Quên mật khẩu?</Link>
        </div>

        <Button block type="primary" htmlType="submit" loading={tai}>
          Đăng nhập
        </Button>
      </Form>

      <Divider plain>Chưa có tài khoản?</Divider>
      <Button block onClick={() => navigate('/dang-ky')}>Tạo tài khoản khách hàng</Button>
    </KhungXacThuc>
  );
}
