import { Alert, App, Button, Card, Form, Input, InputNumber, Modal, Select, Space, Table, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { heThongApi, type DanhMucQuanTri } from '@/dich-vu/he-thong.api';
import { LoiApi } from '@/dich-vu/http';
import { useXacThuc } from '@/ngu-canh/xac-thuc.context';
import { TrangThai } from '@/thanh-phan/trang-thai';

type FormData = {
  maDanhMuc: string;
  tenDanhMuc: string;
  duongDan?: string;
  moTa?: string;
  hinhAnh?: string;
  thuTu?: number;
  trangThai?: string;
};

export function QuanTriDanhMucMon() {
  const { message, modal } = App.useApp();
  const { coQuyen } = useXacThuc();
  const coQuanLy = coQuyen('DANH_MUC_MON_QUAN_LY');
  const [form] = Form.useForm<FormData>();
  const [ds, setDs] = useState<DanhMucQuanTri[]>([]);
  const [tai, setTai] = useState(true);
  const [loi, setLoi] = useState('');
  const [dangSua, setDangSua] = useState<DanhMucQuanTri | null>(null);
  const [moForm, setMoForm] = useState(false);

  const taiLai = async () => {
    setTai(true); setLoi('');
    try { setDs(await heThongApi.danhMucQuanTri()); }
    catch (e) { setLoi(e instanceof LoiApi ? e.message : 'Không tải được danh mục.'); }
    finally { setTai(false); }
  };
  useEffect(() => { void taiLai(); }, []);

  const moTao = () => { setDangSua(null); form.resetFields(); form.setFieldsValue({ thuTu: 0, trangThai: 'HOAT_DONG' }); setMoForm(true); };
  const moSua = (r: DanhMucQuanTri) => {
    setDangSua(r);

    form.setFieldsValue({
      maDanhMuc: r.maDanhMuc,
      tenDanhMuc: r.tenDanhMuc,
      duongDan: r.duongDan,
      moTa: r.moTa ?? undefined,
      hinhAnh: r.hinhAnh ?? undefined,
      thuTu: r.thuTu,
      trangThai: r.trangThai,
    });

    setMoForm(true);
  };

  return <>
    <Space className="page-title-row" wrap><Typography.Title level={2}>Danh mục món</Typography.Title>{coQuanLy ? <Button type="primary" onClick={moTao}>Thêm danh mục</Button> : null}</Space>
    {loi && <Alert type="error" showIcon message={loi} className="mb-16" />}
    <Card className="admin-table-card"><Table rowKey="id" loading={tai} dataSource={ds} pagination={false} scroll={{ x: 900 }} columns={[
      { title: 'Mã', dataIndex: 'maDanhMuc' },
      { title: 'Tên danh mục', dataIndex: 'tenDanhMuc' },
      { title: 'Đường dẫn', dataIndex: 'duongDan' },
      { title: 'Thứ tự', dataIndex: 'thuTu' },
      { title: 'Số món', dataIndex: 'soMon' },
      { title: 'Trạng thái', dataIndex: 'trangThai', render: (v: string) => <TrangThai value={v} /> },
      { title: 'Thao tác', render: (_: unknown, r: DanhMucQuanTri) => coQuanLy ? <Space><Button size="small" onClick={() => moSua(r)}>Sửa</Button><Button size="small" danger onClick={() => modal.confirm({ title: 'Xóa danh mục?', content: r.tenDanhMuc, okText: 'Xóa', cancelText: 'Đóng', okButtonProps: { danger: true }, onOk: async () => { try { await heThongApi.xoaDanhMuc(r.id); message.success('Đã xóa danh mục'); await taiLai(); } catch (e) { message.error(e instanceof LoiApi ? e.message : 'Không xóa được.'); } } })}>Xóa</Button></Space> : '—' },
    ]} /></Card>

    <Modal className="admin-form-modal" open={moForm} title={dangSua ? 'Sửa danh mục' : 'Thêm danh mục'} okText="Lưu" cancelText="Đóng" onCancel={() => setMoForm(false)} onOk={() => form.submit()} destroyOnHidden>
      <Form size="middle" form={form} layout="vertical" onFinish={async (v) => {
        try {
          if (dangSua) await heThongApi.capNhatDanhMuc(dangSua.id, v);
          else await heThongApi.taoDanhMuc(v);
          message.success(dangSua ? 'Đã cập nhật danh mục' : 'Đã tạo danh mục'); setMoForm(false); await taiLai();
        } catch (e) { message.error(e instanceof LoiApi ? e.message : 'Không lưu được danh mục.'); }
      }}>
        <Form.Item name="maDanhMuc" label="Mã danh mục" rules={[{ required: true }]}><Input maxLength={30} disabled={Boolean(dangSua)} /></Form.Item>
        <Form.Item name="tenDanhMuc" label="Tên danh mục" rules={[{ required: true }]}><Input maxLength={150} /></Form.Item>
        <Form.Item name="duongDan" label="Đường dẫn"><Input maxLength={200} placeholder="Bỏ trống để hệ thống tự tạo" /></Form.Item>
        <Form.Item name="moTa" label="Mô tả"><Input.TextArea rows={3} maxLength={2000} /></Form.Item>
        <Form.Item name="hinhAnh" label="URL hình ảnh"><Input maxLength={500} /></Form.Item>
        <Form.Item name="thuTu" label="Thứ tự"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
        <Form.Item name="trangThai" label="Trạng thái"><Select options={[{ value: 'HOAT_DONG', label: 'Hoạt động' }, { value: 'NGUNG_HOAT_DONG', label: 'Ngừng hoạt động' }]} /></Form.Item>
      </Form>
    </Modal>
  </>;
}
