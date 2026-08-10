import { Alert, App, Button, Card, Form, Input, Typography } from 'antd';
import { useState } from 'react';
import { xacThucApi } from '@/dich-vu/xac-thuc.api';
import { LoiApi } from '@/dich-vu/http';

export function DoiMatKhau() {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loi, setLoi] = useState('');
  return <div className="page-container section narrow">
    <Typography.Title level={2}>Đổi mật khẩu</Typography.Title>
    {loi && <Alert type="error" showIcon message={loi} className="mb-16" />}
    <Card><Form form={form} layout="vertical" onFinish={async (v: { matKhauHienTai: string; matKhauMoi: string; xacNhan: string }) => {
      setLoi('');
      if (v.matKhauMoi !== v.xacNhan) { setLoi('Mật khẩu mới và xác nhận không khớp.'); return; }
      try { await xacThucApi.doiMatKhau(v.matKhauHienTai, v.matKhauMoi); message.success('Đã đổi mật khẩu'); form.resetFields(); }
      catch (e) { setLoi(e instanceof LoiApi ? e.message : 'Đổi mật khẩu thất bại.'); }
    }}>
      <Form.Item name="matKhauHienTai" label="Mật khẩu hiện tại" rules={[{ required: true, min: 8 }]}><Input.Password /></Form.Item>
      <Form.Item name="matKhauMoi" label="Mật khẩu mới" rules={[{ required: true, min: 8 }]}><Input.Password /></Form.Item>
      <Form.Item name="xacNhan" label="Nhập lại mật khẩu mới" rules={[{ required: true }]}><Input.Password /></Form.Item>
      <Button type="primary" htmlType="submit">Lưu mật khẩu mới</Button>
    </Form></Card>
  </div>;
}
