import { Alert, App, Button, Card, Input, Modal, Rate, Select, Space, Switch, Table, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { heThongApi, type DanhGia } from '@/dich-vu/he-thong.api';
import { LoiApi } from '@/dich-vu/http';

export function QuanTriDanhGia() {
  const { message } = App.useApp();
  const [ds, setDs] = useState<DanhGia[]>([]);
  const [tai, setTai] = useState(true);
  const [loi, setLoi] = useState('');
  const [soSao, setSoSao] = useState<number>();
  const [hienThi, setHienThi] = useState<string>();
  const [dangPhanHoi, setDangPhanHoi] = useState<DanhGia | null>(null);
  const [phanHoi, setPhanHoi] = useState('');
  const taiLai = async () => { setTai(true); setLoi(''); try { setDs((await heThongApi.danhGiaQuanTri({ soSao, hienThi })).danhSach); } catch (e) { setLoi(e instanceof LoiApi ? e.message : 'Không tải được đánh giá.'); } finally { setTai(false); } };
  useEffect(() => { void taiLai(); }, [soSao, hienThi]);

  return <>
    <Typography.Title level={2}>Đánh giá khách hàng</Typography.Title>
    <Space wrap className="mb-16"><Select allowClear placeholder="Số sao" style={{ width: 130 }} value={soSao} onChange={setSoSao} options={[1,2,3,4,5].map((x) => ({ value: x, label: `${x} sao` }))} /><Select allowClear placeholder="Hiển thị" style={{ width: 150 }} value={hienThi} onChange={setHienThi} options={[{ value: 'true', label: 'Đang hiển thị' }, { value: 'false', label: 'Đang ẩn' }]} /><Button onClick={taiLai}>Làm mới</Button></Space>
    {loi && <Alert type="error" showIcon message={loi} className="mb-16" />}
    <Card><Table rowKey="id" loading={tai} dataSource={ds} scroll={{ x: 1100 }} columns={[
      { title: 'Khách', dataIndex: 'hoTen' }, { title: 'Sao', dataIndex: 'soSao', render: (v: number) => <Rate disabled value={v} /> },
      { title: 'Nội dung', dataIndex: 'noiDung', width: 280 }, { title: 'Phản hồi', dataIndex: 'phanHoi', width: 280 },
      { title: 'Ngày', dataIndex: 'ngayTao', render: (v: string) => new Date(v).toLocaleString('vi-VN') },
      { title: 'Hiển thị', dataIndex: 'hienThi', render: (v: boolean, r: DanhGia) => <Switch checked={Boolean(v)} onChange={async (checked) => { try { await heThongApi.hienThiDanhGia(r.id, checked); message.success('Đã cập nhật hiển thị'); await taiLai(); } catch (e) { message.error(e instanceof LoiApi ? e.message : 'Không cập nhật được.'); } }} /> },
      { title: '', fixed: 'right', render: (_: unknown, r: DanhGia) => <Button size="small" onClick={() => { setDangPhanHoi(r); setPhanHoi(r.phanHoi || ''); }}>Phản hồi</Button> },
    ]} /></Card>
    <Modal open={Boolean(dangPhanHoi)} title={`Phản hồi ${dangPhanHoi?.hoTen || ''}`} okText="Lưu phản hồi" cancelText="Đóng" onCancel={() => setDangPhanHoi(null)} onOk={async () => {
      if (!dangPhanHoi || !phanHoi.trim()) return;
      try { await heThongApi.phanHoiDanhGia(dangPhanHoi.id, phanHoi.trim()); message.success('Đã phản hồi'); setDangPhanHoi(null); await taiLai(); }
      catch (e) { message.error(e instanceof LoiApi ? e.message : 'Không phản hồi được.'); }
    }}><Input.TextArea value={phanHoi} onChange={(e) => setPhanHoi(e.target.value)} rows={5} maxLength={5000} showCount /></Modal>
  </>;
}
