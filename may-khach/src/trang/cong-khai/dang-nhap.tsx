import { Alert, App, Button, Card, Form, Input, Space, Typography } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router';
import { useState } from 'react';
import { LoiApi } from '@/dich-vu/http';
import { useXacThuc } from '@/ngu-canh/xac-thuc.context';

export function DangNhap() {
  const { message } = App.useApp();
  const { dangNhap } = useXacThuc();
  const navigate = useNavigate();
  const location = useLocation();
  const [loi, setLoi] = useState('');
  const [tai, setTai] = useState(false);

  return <div className="auth-wrap"><Card className="auth-card">
    <Typography.Title level={2}>Đăng nhập</Typography.Title>
    <Typography.Paragraph type="secondary">Quản lý đặt bàn hoặc xem lịch đặt của bạn.</Typography.Paragraph>
    {loi && <Alert type="error" showIcon message={loi} className="mb-16" />}
    <Form layout="vertical" onFinish={async (v: { taiKhoan: string; matKhau: string }) => {
      setTai(true); setLoi('');
      try {
        const u = await dangNhap(v.taiKhoan, v.matKhau);
        message.success('Đăng nhập thành công');
        const tu = (location.state as { tu?: string } | null)?.tu;

        if (u.batBuocDoiMatKhau) {
          navigate('/tai-khoan/doi-mat-khau', { replace: true });
          return;
        }

        navigate(
          tu ||
            (
              u.vaiTro.maVaiTro === 'KHACH_HANG'
                ? '/tai-khoan/dat-ban'
                : '/quan-tri'
            ),
          { replace: true },
        );
      } catch (e) { setLoi(e instanceof LoiApi ? e.message : 'Đăng nhập thất bại.'); }
      finally { setTai(false); }
    }}>
      <Form.Item name="taiKhoan" label="Email hoặc tên đăng nhập" rules={[{ required: true }]}><Input autoComplete="username" /></Form.Item>
      <Form.Item name="matKhau" label="Mật khẩu" rules={[{ required: true }]}><Input.Password autoComplete="current-password" /></Form.Item>
      <Button block type="primary" htmlType="submit" loading={tai}>Đăng nhập</Button>
    </Form>
    <Space className="auth-links" wrap><Link to="/dang-ky">Tạo tài khoản</Link><Link to="/quen-mat-khau">Quên mật khẩu?</Link></Space>
  </Card></div>;
}
