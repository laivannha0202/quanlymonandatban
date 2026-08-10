import { Alert, Button, Card, Col, Input, Row, Space, Statistic, Table, Tabs, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { heThongApi, type BaoCaoDanhGia, type BaoCaoDatBan, type BaoCaoKhachHang } from '@/dich-vu/he-thong.api';
import { LoiApi } from '@/dich-vu/http';

const homNay = () => new Date().toISOString().slice(0, 10);
const tru30Ngay = () => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10); };

export function QuanTriBaoCao() {
  const [tuNgay, setTuNgay] = useState(tru30Ngay());
  const [denNgay, setDenNgay] = useState(homNay());
  const [datBan, setDatBan] = useState<BaoCaoDatBan | null>(null);
  const [khachHang, setKhachHang] = useState<BaoCaoKhachHang | null>(null);
  const [danhGia, setDanhGia] = useState<BaoCaoDanhGia | null>(null);
  const [tai, setTai] = useState(true);
  const [loi, setLoi] = useState('');
  const taiLai = async () => {
    setTai(true); setLoi('');
    try {
      const [a, b, c] = await Promise.all([heThongApi.baoCaoDatBan(tuNgay, denNgay), heThongApi.baoCaoKhachHang(tuNgay, denNgay), heThongApi.baoCaoDanhGia(tuNgay, denNgay)]);
      setDatBan(a); setKhachHang(b); setDanhGia(c);
    } catch (e) { setLoi(e instanceof LoiApi ? e.message : 'Không tải được báo cáo.'); }
    finally { setTai(false); }
  };
  useEffect(() => { void taiLai(); }, []);
  const thongKeDatBan = useMemo(() => datBan?.tongQuan || {}, [datBan]);

  return <>
    <Typography.Title level={2}>Báo cáo</Typography.Title>
    <Space wrap className="mb-16"><Input type="date" value={tuNgay} onChange={(e) => setTuNgay(e.target.value)} /><Input type="date" value={denNgay} onChange={(e) => setDenNgay(e.target.value)} /><Button type="primary" loading={tai} onClick={taiLai}>Xem báo cáo</Button></Space>
    {loi && <Alert type="error" showIcon message={loi} className="mb-16" />}
    <Tabs items={[
      { key: 'dat-ban', label: 'Đặt bàn', children: <>
        <Row gutter={[16,16]} className="mb-24"><Col xs={12} lg={6}><Card><Statistic title="Tổng đặt bàn" value={thongKeDatBan.tongDatBan ?? 0} /></Card></Col><Col xs={12} lg={6}><Card><Statistic title="Tổng lượt khách" value={thongKeDatBan.tongLuotKhach ?? 0} /></Card></Col><Col xs={12} lg={6}><Card><Statistic title="Hoàn thành" value={thongKeDatBan.daHoanThanh ?? 0} /></Card></Col><Col xs={12} lg={6}><Card><Statistic title="Tỷ lệ hoàn thành" value={thongKeDatBan.tyLeHoanThanh ?? 0} suffix="%" /></Card></Col></Row>
        <Card title="Theo ngày"><Table rowKey={(r) => String(r.ngay)} loading={tai} dataSource={datBan?.theoNgay || []} pagination={false} columns={[{ title: 'Ngày', dataIndex: 'ngay' }, { title: 'Số đặt bàn', dataIndex: 'soDatBan' }, { title: 'Số khách', dataIndex: 'soKhach' }]} /></Card>
        <Row gutter={[16,16]} className="report-grid"><Col xs={24} lg={8}><Card title="Theo trạng thái"><Table rowKey={(r) => String(r.trangThai)} dataSource={datBan?.theoTrangThai || []} pagination={false} size="small" columns={[{ title: 'Trạng thái', dataIndex: 'trangThai' }, { title: 'Số lượng', dataIndex: 'soLuong' }]} /></Card></Col><Col xs={24} lg={8}><Card title="Theo nguồn"><Table rowKey={(r) => String(r.nguonDat)} dataSource={datBan?.theoNguon || []} pagination={false} size="small" columns={[{ title: 'Nguồn', dataIndex: 'nguonDat' }, { title: 'Số lượng', dataIndex: 'soLuong' }]} /></Card></Col><Col xs={24} lg={8}><Card title="Theo khu vực"><Table rowKey={(r) => String(r.tenKhuVuc)} dataSource={datBan?.theoKhuVuc || []} pagination={false} size="small" columns={[{ title: 'Khu vực', dataIndex: 'tenKhuVuc' }, { title: 'Số lượng', dataIndex: 'soLuong' }]} /></Card></Col></Row>
      </> },
      { key: 'khach-hang', label: 'Khách hàng', children: <>
        <Row gutter={[16,16]} className="mb-24"><Col xs={12} lg={6}><Card><Statistic title="Khách có đặt bàn" value={khachHang?.tongQuan.khachCoDatBan ?? 0} /></Card></Col><Col xs={12} lg={6}><Card><Statistic title="Khách mới" value={khachHang?.tongQuan.khachMoi ?? 0} /></Card></Col></Row>
        <Card title="Top khách hàng"><Table rowKey={(r) => String(r.id)} loading={tai} dataSource={khachHang?.topKhachHang || []} scroll={{ x: 800 }} columns={[{ title: 'Họ tên', dataIndex: 'hoTen' }, { title: 'SĐT', dataIndex: 'soDienThoai' }, { title: 'Tổng đặt', dataIndex: 'tongDatBan' }, { title: 'Hoàn thành', dataIndex: 'tongHoanThanh' }, { title: 'Lượt khách', dataIndex: 'tongLuotKhach' }]} /></Card>
      </> },
      { key: 'danh-gia', label: 'Đánh giá', children: <>
        <Row gutter={[16,16]} className="mb-24"><Col xs={12} lg={6}><Card><Statistic title="Tổng đánh giá" value={danhGia?.tongQuan.tongDanhGia ?? 0} /></Card></Col><Col xs={12} lg={6}><Card><Statistic title="Điểm trung bình" value={danhGia?.tongQuan.diemTrungBinh ?? 0} precision={2} suffix="/5" /></Card></Col><Col xs={12} lg={6}><Card><Statistic title="Đã phản hồi" value={danhGia?.tongQuan.daPhanHoi ?? 0} /></Card></Col></Row>
        <Card title="Phân bố số sao"><Table rowKey={(r) => String(r.soSao)} loading={tai} dataSource={danhGia?.theoSoSao || []} pagination={false} columns={[{ title: 'Số sao', dataIndex: 'soSao' }, { title: 'Số lượng', dataIndex: 'soLuong' }]} /></Card>
      </> },
    ]} />
  </>;
}
