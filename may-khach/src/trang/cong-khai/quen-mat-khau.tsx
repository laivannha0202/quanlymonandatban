import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { useState } from 'react';
import { xacThucApi } from '@/dich-vu/xac-thuc.api';
import { LoiApi } from '@/dich-vu/http';

export function QuenMatKhau() {
  const [thongBao, setThongBao] = useState('');
  const [tokenDev, setTokenDev] = useState('');
  const [loi, setLoi] = useState('');
  return <div className="auth-wrap"><Card className="auth-card">
    <Typography.Title level={2}>Quên mật khẩu</Typography.Title>
    {loi && <Alert type="error" showIcon message={loi} className="mb-16" />}
    {thongBao && <Alert type="success" showIcon message={thongBao} description={tokenDev ? `Token DEV: ${tokenDev}` : undefined} className="mb-16" />}
    <Form layout="vertical" onFinish={async (v: { email: string }) => {
      setLoi('');
      try { const kq = await xacThucApi.quenMatKhau(v.email); setThongBao(kq.thongBao); setTokenDev(kq.tokenDatLaiMatKhau || ''); }
      catch (e) { setLoi(e instanceof LoiApi ? e.message : 'Không gửi được yêu cầu.'); }
    }}>
      <Form.Item name="email" label="Email" rules={[{ required: true }, { type: 'email' }]}><Input /></Form.Item>
      <Button type="primary" htmlType="submit">Gửi yêu cầu</Button>
    </Form>
  </Card></div>;
}
