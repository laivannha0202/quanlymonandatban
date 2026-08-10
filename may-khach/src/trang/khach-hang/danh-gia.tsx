import { Alert, App, Button, Card, Empty, Form, Input, Modal, Rate, Space, Table, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { datBanApi } from '@/dich-vu/dat-ban.api';
import { heThongApi } from '@/dich-vu/he-thong.api';
import { LoiApi } from '@/dich-vu/http';
import type { DatBan } from '@/kieu/nghiep-vu';

export function DanhGiaCuaToi() {
  const { message } = App.useApp();
  const [ds, setDs] = useState<DatBan[]>([]);
  const [tai, setTai] = useState(true);
  const [loi, setLoi] = useState('');
  const [dangDanhGia, setDangDanhGia] = useState<DatBan | null>(null);
  const [form] = Form.useForm<{ soSao: number; noiDung?: string }>();
  useEffect(() => { datBanApi.cuaToi().then((x) => setDs(x.danhSach)).catch((e: unknown) => setLoi(e instanceof LoiApi ? e.message : 'Không tải được lịch đặt.')).finally(() => setTai(false)); }, []);
  const hoanThanh = useMemo(() => ds.filter((x) => x.trangThai === 'DA_HOAN_THANH'), [ds]);
  return <div className="page-container section">
    <Typography.Title level={2}>Đánh giá trải nghiệm</Typography.Title>
    <Typography.Paragraph type="secondary">Bạn có thể đánh giá các lượt đặt bàn đã hoàn thành. Mỗi lượt chỉ được tạo một đánh giá.</Typography.Paragraph>
    {loi && <Alert type="error" showIcon message={loi} className="mb-16" />}
    <Card>{!tai && hoanThanh.length === 0 ? <Empty description="Chưa có lượt đặt bàn đã hoàn thành" /> : <Table loading={tai} rowKey="id" dataSource={hoanThanh} pagination={false} columns={[
      { title: 'Mã đặt bàn', dataIndex: 'maDatBan' },
      { title: 'Ngày', dataIndex: 'ngayDat' },
      { title: 'Giờ', dataIndex: 'gioBatDau' },
      { title: 'Số người', dataIndex: 'soNguoi' },
      { title: '', render: (_: unknown, r: DatBan) => <Button type="primary" size="small" onClick={() => { form.resetFields(); form.setFieldValue('soSao', 5); setDangDanhGia(r); }}>Đánh giá</Button> },
    ]} />}</Card>
    <Modal open={Boolean(dangDanhGia)} title={`Đánh giá ${dangDanhGia?.maDatBan || ''}`} okText="Gửi đánh giá" cancelText="Đóng" onCancel={() => setDangDanhGia(null)} onOk={() => form.submit()}>
      <Form form={form} layout="vertical" onFinish={async (v) => {
        if (!dangDanhGia) return;
        try { await heThongApi.taoDanhGia({ datBanId: dangDanhGia.id, soSao: v.soSao, noiDung: v.noiDung }); message.success('Cảm ơn bạn đã đánh giá'); setDangDanhGia(null); }
        catch (e) { message.error(e instanceof LoiApi ? e.message : 'Không gửi được đánh giá.'); }
      }}>
        <Form.Item name="soSao" label="Số sao" rules={[{ required: true }]}><Rate /></Form.Item>
        <Form.Item name="noiDung" label="Nội dung"><Input.TextArea rows={4} maxLength={5000} showCount /></Form.Item>
      </Form>
      <Space />
    </Modal>
  </div>;
}
