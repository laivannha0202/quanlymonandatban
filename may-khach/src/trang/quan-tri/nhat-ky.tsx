import { Alert, Button, Card, Drawer, Input, Space, Table, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { heThongApi, type NhatKy } from '@/dich-vu/he-thong.api';
import { LoiApi } from '@/dich-vu/http';

const jsonDep = (v: unknown) => v == null ? '—' : typeof v === 'string' ? v : JSON.stringify(v, null, 2);

export function QuanTriNhatKy() {
  const [ds, setDs] = useState<NhatKy[]>([]);
  const [tai, setTai] = useState(true);
  const [loi, setLoi] = useState('');
  const [hanhDong, setHanhDong] = useState('');
  const [doiTuong, setDoiTuong] = useState('');
  const [chiTiet, setChiTiet] = useState<NhatKy | null>(null);
  const taiLai = async () => { setTai(true); setLoi(''); try { setDs((await heThongApi.nhatKy({ hanhDong, doiTuong })).danhSach); } catch (e) { setLoi(e instanceof LoiApi ? e.message : 'Không tải được nhật ký.'); } finally { setTai(false); } };
  useEffect(() => { void taiLai(); }, []);
  return <>
    <Typography.Title level={2}>Nhật ký hoạt động</Typography.Title>
    <Space wrap className="mb-16"><Input placeholder="Hành động" value={hanhDong} onChange={(e) => setHanhDong(e.target.value)} /><Input placeholder="Đối tượng" value={doiTuong} onChange={(e) => setDoiTuong(e.target.value)} /><Button type="primary" onClick={taiLai}>Lọc</Button></Space>
    {loi && <Alert type="error" showIcon message={loi} className="mb-16" />}
    <Card className="admin-table-card"><Table rowKey="id" loading={tai} dataSource={ds} scroll={{ x: 1050 }} columns={[
      { title: 'Thời gian', dataIndex: 'thoiGian', render: (v: string) => new Date(v).toLocaleString('vi-VN') },
      { title: 'Hành động', dataIndex: 'hanhDong' }, { title: 'Đối tượng', dataIndex: 'doiTuong' }, { title: 'ID', dataIndex: 'doiTuongId' }, { title: 'Tài khoản', dataIndex: 'taiKhoanId' }, { title: 'Mã yêu cầu', dataIndex: 'maYeuCau' },
      { title: '', render: (_: unknown, r: NhatKy) => <Button size="small" onClick={() => setChiTiet(r)}>Chi tiết</Button> },
    ]} /></Card>
    <Drawer className="admin-detail-drawer" width={680} open={Boolean(chiTiet)} onClose={() => setChiTiet(null)} title="Chi tiết nhật ký">
      {chiTiet && <><Typography.Title level={5}>Dữ liệu cũ</Typography.Title><pre className="json-box">{jsonDep(chiTiet.duLieuCu)}</pre><Typography.Title level={5}>Dữ liệu mới</Typography.Title><pre className="json-box">{jsonDep(chiTiet.duLieuMoi)}</pre></>}
    </Drawer>
  </>;
}
