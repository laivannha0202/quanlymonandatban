import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { LoiApi } from '@/dich-vu/http';
import { xacThucApi } from '@/dich-vu/xac-thuc.api';

export function DatLaiMatKhau() {
  const [params] = useSearchParams();
  const [thanhCong, setThanhCong] = useState(false);
  const [loi, setLoi] = useState('');
  const tokenMacDinh = params.get('token') || '';

  return <div className="auth-wrap"><Card className="auth-card">
    <Typography.Title level={2}>Đặt lại mật khẩu</Typography.Title>
    {loi && <Alert type="error" showIcon message={loi} className="mb-16" />}
    {thanhCong ? <>
      <Alert type="success" showIcon message="Mật khẩu đã được thay đổi." className="mb-16" />
      <Link to="/dang-nhap">Quay lại đăng nhập</Link>
    </> : <Form layout="vertical" initialValues={{ token: tokenMacDinh }} onFinish={async (v: { token: string; matKhauMoi: string; xacNhan: string }) => {
      setLoi('');
      if (v.matKhauMoi !== v.xacNhan) { setLoi('Mật khẩu xác nhận không khớp.'); return; }
      try { await xacThucApi.datLaiMatKhau(v.token.trim(), v.matKhauMoi); setThanhCong(true); }
      catch (e) { setLoi(e instanceof LoiApi ? e.message : 'Không đặt lại được mật khẩu.'); }
    }}>
      <Form.Item name="token" label="Token đặt lại mật khẩu" rules={[{ required: true, min: 32 }]}><Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} /></Form.Item>
      <Form.Item name="matKhauMoi" label="Mật khẩu mới" rules={[{ required: true, min: 8 }]}><Input.Password /></Form.Item>
      <Form.Item name="xacNhan" label="Nhập lại mật khẩu" rules={[{ required: true }]}><Input.Password /></Form.Item>
      <Button type="primary" htmlType="submit" block>Đặt lại mật khẩu</Button>
    </Form>}
  </Card></div>;
}
