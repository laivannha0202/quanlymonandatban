import { Alert, App, Button, Card, Form, Input, InputNumber, Modal, Select, Space, Table, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { heThongApi, type KhuyenMai } from '@/dich-vu/he-thong.api';
import { LoiApi } from '@/dich-vu/http';
import { TrangThai } from '@/thanh-phan/trang-thai';

const tien = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
const localDateTime = (value?: string | null) => {
  if (!value) return '';
  const d = new Date(value);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};

type FormData = {
  maKhuyenMai: string;
  tenKhuyenMai: string;
  moTa?: string;
  loaiGiam: 'PHAN_TRAM' | 'SO_TIEN';
  giaTri: number;
  giaTriDonToiThieu?: number;
  giamToiDa?: number;
  ngayBatDau: string;
  ngayKetThuc: string;
  soLuotToiDa?: number;
  trangThai?: string;
};

export function QuanTriKhuyenMai() {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<FormData>();
  const [ds, setDs] = useState<KhuyenMai[]>([]);
  const [tai, setTai] = useState(true);
  const [loi, setLoi] = useState('');
  const [dangSua, setDangSua] = useState<KhuyenMai | null>(null);
  const [moForm, setMoForm] = useState(false);
  const taiLai = async () => { setTai(true); setLoi(''); try { setDs((await heThongApi.khuyenMaiQuanTri()).danhSach); } catch (e) { setLoi(e instanceof LoiApi ? e.message : 'Không tải được khuyến mãi.'); } finally { setTai(false); } };
  useEffect(() => { void taiLai(); }, []);
  const moTao = () => { setDangSua(null); form.resetFields(); form.setFieldsValue({ loaiGiam: 'PHAN_TRAM', trangThai: 'HOAT_DONG' }); setMoForm(true); };
  const moSua = (r: KhuyenMai) => {
    setDangSua(r);

    form.setFieldsValue({
      maKhuyenMai: r.maKhuyenMai,
      tenKhuyenMai: r.tenKhuyenMai,
      moTa: r.moTa ?? undefined,
      loaiGiam: r.loaiGiam,
      giaTri: r.giaTri,
      giaTriDonToiThieu: r.giaTriDonToiThieu ?? undefined,
      giamToiDa: r.giamToiDa ?? undefined,
      soLuotToiDa: r.soLuotToiDa ?? undefined,
      ngayBatDau: localDateTime(r.ngayBatDau),
      ngayKetThuc: localDateTime(r.ngayKetThuc),
      trangThai: r.trangThai,
    });

    setMoForm(true);
  };

  return <>
    <Space className="page-title-row" wrap><Typography.Title level={2}>Khuyến mãi</Typography.Title><Button type="primary" onClick={moTao}>Thêm khuyến mãi</Button></Space>
    {loi && <Alert type="error" showIcon message={loi} className="mb-16" />}
    <Card><Table rowKey="id" loading={tai} dataSource={ds} scroll={{ x: 1150 }} columns={[
      { title: 'Mã', dataIndex: 'maKhuyenMai' }, { title: 'Tên', dataIndex: 'tenKhuyenMai' },
      { title: 'Mức giảm', render: (_: unknown, r: KhuyenMai) => <Tag color="red">{r.loaiGiam === 'PHAN_TRAM' ? `${r.giaTri}%` : tien.format(r.giaTri)}</Tag> },
      { title: 'Bắt đầu', dataIndex: 'ngayBatDau', render: (v: string) => new Date(v).toLocaleString('vi-VN') },
      { title: 'Kết thúc', dataIndex: 'ngayKetThuc', render: (v: string) => new Date(v).toLocaleString('vi-VN') },
      { title: 'Đã dùng', dataIndex: 'soLuotDaDung' }, { title: 'Trạng thái', dataIndex: 'trangThai', render: (v: string) => <TrangThai value={v} /> },
      { title: 'Thao tác', fixed: 'right', render: (_: unknown, r: KhuyenMai) => <Space><Button size="small" onClick={() => moSua(r)}>Sửa</Button><Button size="small" danger onClick={() => modal.confirm({ title: 'Xóa khuyến mãi?', content: r.tenKhuyenMai, okText: 'Xóa', cancelText: 'Đóng', okButtonProps: { danger: true }, onOk: async () => { try { await heThongApi.xoaKhuyenMai(r.id); message.success('Đã xóa'); await taiLai(); } catch (e) { message.error(e instanceof LoiApi ? e.message : 'Không xóa được.'); } } })}>Xóa</Button></Space> },
    ]} /></Card>

    <Modal open={moForm} width={720} title={dangSua ? 'Sửa khuyến mãi' : 'Thêm khuyến mãi'} okText="Lưu" cancelText="Đóng" onCancel={() => setMoForm(false)} onOk={() => form.submit()} destroyOnHidden>
      <Form form={form} layout="vertical" onFinish={async (v) => {
        const payload = { ...v, ngayBatDau: new Date(v.ngayBatDau).toISOString(), ngayKetThuc: new Date(v.ngayKetThuc).toISOString() };
        try { if (dangSua) await heThongApi.capNhatKhuyenMai(dangSua.id, payload); else await heThongApi.taoKhuyenMai(payload); message.success('Đã lưu khuyến mãi'); setMoForm(false); await taiLai(); }
        catch (e) { message.error(e instanceof LoiApi ? e.message : 'Không lưu được khuyến mãi.'); }
      }}>
        <Form.Item name="maKhuyenMai" label="Mã khuyến mãi" rules={[{ required: true }]}><Input maxLength={50} /></Form.Item>
        <Form.Item name="tenKhuyenMai" label="Tên khuyến mãi" rules={[{ required: true }]}><Input maxLength={200} /></Form.Item>
        <Form.Item name="moTa" label="Mô tả"><Input.TextArea rows={3} maxLength={5000} /></Form.Item>
        <Space className="form-row" align="start" wrap>
          <Form.Item name="loaiGiam" label="Loại giảm" rules={[{ required: true }]}><Select style={{ width: 180 }} options={[{ value: 'PHAN_TRAM', label: 'Phần trăm' }, { value: 'SO_TIEN', label: 'Số tiền' }]} /></Form.Item>
          <Form.Item name="giaTri" label="Giá trị" rules={[{ required: true }]}><InputNumber min={0.01} style={{ width: 180 }} /></Form.Item>
          <Form.Item name="giamToiDa" label="Giảm tối đa"><InputNumber min={0} style={{ width: 180 }} /></Form.Item>
        </Space>
        <Space className="form-row" align="start" wrap>
          <Form.Item name="giaTriDonToiThieu" label="Giá trị đơn tối thiểu"><InputNumber min={0} style={{ width: 200 }} /></Form.Item>
          <Form.Item name="soLuotToiDa" label="Số lượt tối đa"><InputNumber min={1} style={{ width: 180 }} /></Form.Item>
          <Form.Item name="trangThai" label="Trạng thái"><Select style={{ width: 180 }} options={[{ value: 'HOAT_DONG', label: 'Hoạt động' }, { value: 'NGUNG_HOAT_DONG', label: 'Ngừng' }]} /></Form.Item>
        </Space>
        <Space className="form-row" align="start" wrap>
          <Form.Item name="ngayBatDau" label="Bắt đầu" rules={[{ required: true }]}><Input type="datetime-local" /></Form.Item>
          <Form.Item name="ngayKetThuc" label="Kết thúc" rules={[{ required: true }]}><Input type="datetime-local" /></Form.Item>
        </Space>
      </Form>
    </Modal>
  </>;
}
