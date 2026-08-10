import { Alert, Button, Card, Descriptions, Form, Input, Space, Timeline, Typography } from 'antd';
import { useState } from 'react';
import { datBanApi } from '@/dich-vu/dat-ban.api';
import { LoiApi } from '@/dich-vu/http';
import type { DatBan } from '@/kieu/nghiep-vu';
import { TrangThai } from '@/thanh-phan/trang-thai';

export function TraCuu() {
  const [kq, setKq] = useState<DatBan | null>(null);
  const [loi, setLoi] = useState('');
  const [tai, setTai] = useState(false);

  return <div className="page-container section narrow">
    <Typography.Title level={2}>Tra cứu đặt bàn</Typography.Title>
    <Card className="mb-24"><Form layout="vertical" onFinish={async (v: { maDatBan: string; soDienThoai: string }) => {
      setTai(true); setLoi(''); setKq(null);
      try { setKq(await datBanApi.traCuu(v.maDatBan.trim(), v.soDienThoai.trim())); }
      catch (e) { setLoi(e instanceof LoiApi ? e.message : 'Không tra cứu được.'); }
      finally { setTai(false); }
    }}>
      <Form.Item name="maDatBan" label="Mã đặt bàn" rules={[{ required: true }]}><Input placeholder="DB20260820-000001" /></Form.Item>
      <Form.Item name="soDienThoai" label="Số điện thoại" rules={[{ required: true }]}><Input /></Form.Item>
      <Button type="primary" htmlType="submit" loading={tai}>Tra cứu</Button>
    </Form></Card>
    {loi && <Alert type="error" showIcon message={loi} />}
    {kq && <Card title={<Space>Đặt bàn {kq.maDatBan}<TrangThai value={kq.trangThai} /></Space>}>
      <Descriptions column={{ xs: 1, sm: 2 }} items={[
        { key: 'ten', label: 'Khách', children: kq.hoTen }, { key: 'sdt', label: 'Điện thoại', children: kq.soDienThoai },
        { key: 'ngay', label: 'Ngày', children: kq.ngayDat }, { key: 'gio', label: 'Giờ', children: `${kq.gioBatDau} – ${kq.gioKetThuc}` },
        { key: 'nguoi', label: 'Số người', children: kq.soNguoi }, { key: 'ban', label: 'Bàn', children: kq.banAns?.map((b) => b.maBan).join(', ') || 'Hệ thống sẽ sắp' },
      ]} />
      {kq.lichSu?.length ? <><Typography.Title level={5}>Lịch sử</Typography.Title><Timeline items={kq.lichSu.map((x) => ({ children: `${x.hanhDong} · ${new Date(x.thoiGian).toLocaleString('vi-VN')}` }))} /></> : null}
    </Card>}
  </div>;
}
