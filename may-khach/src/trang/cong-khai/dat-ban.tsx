import { Alert, App, Button, Card, Col, Form, Input, InputNumber, Radio, Result, Row, Select, Space, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { datBanApi, type TaoDatBanPayload } from '@/dich-vu/dat-ban.api';
import { LoiApi } from '@/dich-vu/http';
import type { BanAnPhuongAn, DatBan } from '@/kieu/nghiep-vu';

type GiaTriForm = Omit<TaoDatBanPayload, 'banAnIds'>;

export function DatBanPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm<GiaTriForm>();
  const ngay = Form.useWatch('ngay', form);
  const [khungGio, setKhungGio] = useState<string[]>([]);
  const [phuongAn, setPhuongAn] = useState<BanAnPhuongAn[]>([]);
  const [chon, setChon] = useState<string>('');
  const [dangTim, setDangTim] = useState(false);
  const [dangGui, setDangGui] = useState(false);
  const [ketQua, setKetQua] = useState<DatBan | null>(null);
  const [loi, setLoi] = useState('');

  useEffect(() => {
    setKhungGio([]); setPhuongAn([]); setChon('');
    if (!ngay) return;
    datBanApi.khungGio(ngay).then((x) => setKhungGio(x.danhSach)).catch(() => setKhungGio([]));
  }, [ngay]);

  async function timBan() {
    try {
      const v = await form.validateFields(['ngay', 'gioBatDau', 'soNguoi']);
      setDangTim(true); setLoi('');
      const kq = await datBanApi.timBan({ ngay: v.ngay!, gioBatDau: v.gioBatDau!, soNguoi: v.soNguoi! });
      setPhuongAn(kq.phuongAn); setChon('');
      if (!kq.coBan) message.warning('Khung giờ này chưa có phương án bàn phù hợp.');
    } catch (e) {
      if (e instanceof LoiApi) setLoi(e.message);
    } finally { setDangTim(false); }
  }

  async function gui(v: GiaTriForm) {
    try {
      setDangGui(true); setLoi('');
      const banAnIds = chon ? chon.split(',') : undefined;
      const kq = await datBanApi.tao({ ...v, banAnIds });
      setKetQua(kq);
    } catch (e) {
      setLoi(e instanceof LoiApi ? e.message : 'Không thể tạo đặt bàn.');
    } finally { setDangGui(false); }
  }

  if (ketQua) return <div className="page-container section"><Result status="success" title="Đã nhận yêu cầu đặt bàn" subTitle={`Mã đặt bàn: ${ketQua.maDatBan}`} extra={<Button type="primary" href="/tra-cuu">Tra cứu đặt bàn</Button>} /></div>;

  return <div className="page-container section narrow">
    <Typography.Title level={2}>Đặt bàn</Typography.Title>
    <Typography.Paragraph type="secondary">Bạn có thể chọn bàn gợi ý hoặc để hệ thống tự sắp bàn phù hợp.</Typography.Paragraph>
    {loi && <Alert type="error" showIcon message={loi} className="mb-16" />}
    <Card>
      <Form form={form} layout="vertical" onFinish={gui} initialValues={{ soNguoi: 2 }}>
        <Row gutter={16}>
          <Col xs={24} md={12}><Form.Item name="hoTen" label="Họ tên" rules={[{ required: true, message: 'Nhập họ tên' }]}><Input maxLength={150} /></Form.Item></Col>
          <Col xs={24} md={12}><Form.Item name="soDienThoai" label="Số điện thoại" rules={[{ required: true, message: 'Nhập số điện thoại' }]}><Input maxLength={30} /></Form.Item></Col>
          <Col xs={24}><Form.Item name="email" label="Email"><Input type="email" /></Form.Item></Col>
          <Col xs={24} md={8}><Form.Item name="ngay" label="Ngày" rules={[{ required: true, message: 'Chọn ngày' }]}><Input type="date" /></Form.Item></Col>
          <Col xs={24} md={8}><Form.Item name="gioBatDau" label="Giờ" rules={[{ required: true, message: 'Chọn giờ' }]}><Select placeholder={ngay ? 'Chọn giờ' : 'Chọn ngày trước'} options={khungGio.map((x) => ({ value: x, label: x }))} /></Form.Item></Col>
          <Col xs={24} md={8}><Form.Item name="soNguoi" label="Số người" rules={[{ required: true }]}><InputNumber min={1} max={20} style={{ width: '100%' }} /></Form.Item></Col>
          <Col xs={24}><Form.Item name="ghiChu" label="Ghi chú"><Input.TextArea rows={3} maxLength={2000} placeholder="Ví dụ: bàn yên tĩnh, có trẻ nhỏ..." /></Form.Item></Col>
        </Row>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Button onClick={timBan} loading={dangTim}>Tìm bàn phù hợp</Button>
          {phuongAn.length > 0 && <Radio.Group value={chon} onChange={(e) => setChon(e.target.value)} style={{ width: '100%' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Radio value="">Để hệ thống tự xếp bàn</Radio>
              {phuongAn.map((p) => {
                const ids = p.banAns.map((b) => b.id).join(',');
                const ten = p.banAns.map((b) => b.maBan || b.ma_ban || b.tenBan || b.ten_ban || b.id).join(' + ');
                return <Radio key={ids} value={ids}>{p.kieu === 'GHEP_BAN' ? 'Ghép bàn' : 'Bàn'} {ten} · tối đa {p.tongSucChuaToiDa} khách</Radio>;
              })}
            </Space>
          </Radio.Group>}
          <Button type="primary" htmlType="submit" size="large" loading={dangGui}>Xác nhận đặt bàn</Button>
        </Space>
      </Form>
    </Card>
  </div>;
}
