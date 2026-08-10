import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { useNavigate } from 'react-router';
import { useState } from 'react';
import { LoiApi } from '@/dich-vu/http';
import { useXacThuc } from '@/ngu-canh/xac-thuc.context';

export function DangKy() {
  const { dangKy } = useXacThuc();
  const navigate = useNavigate();
  const [loi, setLoi] = useState('');
  const [tai, setTai] = useState(false);

  return <div className="auth-wrap"><Card className="auth-card">
    <Typography.Title level={2}>Tạo tài khoản</Typography.Title>
    {loi && <Alert type="error" showIcon message={loi} className="mb-16" />}
    <Form layout="vertical" onFinish={async (v: { hoTen: string; soDienThoai: string; email: string; matKhau: string }) => {
      setTai(true); setLoi('');
      try { await dangKy(v); navigate('/tai-khoan/dat-ban'); }
      catch (e) { setLoi(e instanceof LoiApi ? e.message : 'Không thể đăng ký.'); }
      finally { setTai(false); }
    }}>
      <Form.Item name="hoTen" label="Họ tên" rules={[{ required: true }]}><Input /></Form.Item>
      <Form.Item name="soDienThoai" label="Số điện thoại" rules={[{ required: true }]}><Input /></Form.Item>
      <Form.Item name="email" label="Email" rules={[{ required: true }, { type: 'email' }]}><Input /></Form.Item>
      <Form.Item name="matKhau" label="Mật khẩu" rules={[{ required: true }, { min: 8, message: 'Tối thiểu 8 ký tự' }]}><Input.Password /></Form.Item>
      <Button block type="primary" htmlType="submit" loading={tai}>Đăng ký</Button>
    </Form>
  </Card></div>;
}
