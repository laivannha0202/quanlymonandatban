import { Alert, App, Button, Card, Checkbox, Collapse, Empty, Space, Spin, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { heThongApi, type Quyen, type VaiTro } from '@/dich-vu/he-thong.api';
import { LoiApi } from '@/dich-vu/http';

export function QuanTriVaiTro() {
  const { message } = App.useApp();
  const [vaiTro, setVaiTro] = useState<VaiTro[]>([]);
  const [quyen, setQuyen] = useState<Quyen[]>([]);
  const [dangChon, setDangChon] = useState<VaiTro | null>(null);
  const [maQuyens, setMaQuyens] = useState<string[]>([]);
  const [tai, setTai] = useState(true);
  const [luu, setLuu] = useState(false);
  const [loi, setLoi] = useState('');
  useEffect(() => { Promise.all([heThongApi.vaiTro(), heThongApi.quyen()]).then(([v, q]) => { setVaiTro(v); setQuyen(q); const macDinh = v.find((x) => x.maVaiTro !== 'QUAN_TRI_VIEN') || v[0]; if (macDinh) { setDangChon(macDinh); setMaQuyens(macDinh.quyen.map((x) => x.maQuyen)); } }).catch((e: unknown) => setLoi(e instanceof LoiApi ? e.message : 'Không tải được phân quyền.')).finally(() => setTai(false)); }, []);
  const nhom = useMemo(() => quyen.reduce<Record<string, Quyen[]>>((acc, q) => { const key = q.nhomQuyen || 'KHAC'; (acc[key] ||= []).push(q); return acc; }, {}), [quyen]);
  const chonVaiTro = (v: VaiTro) => { setDangChon(v); setMaQuyens(v.quyen.map((x) => x.maQuyen)); };
  if (tai) return <Spin />;
  return <>
    <Typography.Title level={2}>Vai trò & phân quyền</Typography.Title>
    {loi && <Alert type="error" showIcon message={loi} className="mb-16" />}
    <Space align="start" size="large" className="rbac-layout" wrap>
      <Card title="Vai trò" className="rbac-role-list">{vaiTro.length === 0 ? <Empty /> : <Space direction="vertical" style={{ width: '100%' }}>{vaiTro.map((v) => <Button key={v.id} type={dangChon?.id === v.id ? 'primary' : 'default'} block onClick={() => chonVaiTro(v)}>{v.tenVaiTro}</Button>)}</Space>}</Card>
      <Card title={dangChon ? `Quyền của ${dangChon.tenVaiTro}` : 'Quyền'} className="rbac-permissions">
        {dangChon?.maVaiTro === 'QUAN_TRI_VIEN' && <Alert type="info" showIcon message="Vai trò QUAN_TRI_VIEN được backend bảo vệ và không cho chỉnh quyền." className="mb-16" />}
        <Checkbox.Group value={maQuyens} onChange={(v) => setMaQuyens(v.map(String))} disabled={dangChon?.maVaiTro === 'QUAN_TRI_VIEN'} style={{ width: '100%' }}>
          <Collapse items={Object.entries(nhom).map(([tenNhom, ds]) => ({ key: tenNhom, label: `${tenNhom} (${ds.length})`, children: <div className="permission-grid">{ds.map((q) => <Checkbox key={q.id} value={q.maQuyen}><span><strong>{q.maQuyen}</strong>{q.tenQuyen ? <small>{q.tenQuyen}</small> : null}</span></Checkbox>)}</div> }))} />
        </Checkbox.Group>
        <div className="mt-16"><Button type="primary" loading={luu} disabled={!dangChon || dangChon.maVaiTro === 'QUAN_TRI_VIEN'} onClick={async () => { if (!dangChon) return; setLuu(true); try { const moi = await heThongApi.capNhatQuyenVaiTro(dangChon.id, maQuyens); message.success('Đã cập nhật quyền'); setVaiTro((cu) => cu.map((x) => x.id === moi.id ? moi : x)); setDangChon(moi); } catch (e) { message.error(e instanceof LoiApi ? e.message : 'Không cập nhật được quyền.'); } finally { setLuu(false); } }}>Lưu phân quyền</Button></div>
      </Card>
    </Space>
  </>;
}
