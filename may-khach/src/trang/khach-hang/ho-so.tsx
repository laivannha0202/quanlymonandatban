import { Alert, App, Button, Card, Form, Input, Select, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { khachHangApi, type HoSoKhachHang } from '@/dich-vu/khach-hang.api';
import { LoiApi } from '@/dich-vu/http';

export function HoSo() {
  const { message } = App.useApp();
  const [form] = Form.useForm<HoSoKhachHang>();
  const [loi, setLoi] = useState('');
  useEffect(() => { khachHangApi.hoSo().then((x) => form.setFieldsValue(x)).catch((e: unknown) => setLoi(e instanceof LoiApi ? e.message : 'Không tải được hồ sơ.')); }, [form]);
  return <div className="page-container section narrow"><Typography.Title level={2}>Hồ sơ</Typography.Title>
    {loi && <Alert type="error" message={loi} showIcon className="mb-16" />}
    <Card><Form form={form} layout="vertical" onFinish={async (v) => { try { await khachHangApi.capNhatHoSo(v); message.success('Đã cập nhật hồ sơ'); } catch (e) { message.error(e instanceof LoiApi ? e.message : 'Cập nhật thất bại'); } }}>
      <Form.Item name="hoTen" label="Họ tên"><Input /></Form.Item>
      <Form.Item name="soDienThoai" label="Số điện thoại"><Input /></Form.Item>
      <Form.Item name="email" label="Email"><Input type="email" /></Form.Item>
      <Form.Item name="ngaySinh" label="Ngày sinh"><Input type="date" /></Form.Item>
      <Form.Item name="gioiTinh" label="Giới tính"><Select allowClear options={[{value:'NAM',label:'Nam'},{value:'NU',label:'Nữ'},{value:'KHAC',label:'Khác'}]} /></Form.Item>
      <Button type="primary" htmlType="submit">Lưu thay đổi</Button>
    </Form></Card>
  </div>;
}
