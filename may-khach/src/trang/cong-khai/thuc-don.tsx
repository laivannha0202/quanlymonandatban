import { SearchOutlined } from '@ant-design/icons';
import { Alert, Card, Col, Empty, Flex, Input, Row, Segmented, Skeleton, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { thucDonApi } from '@/dich-vu/thuc-don.api';
import { LoiApi } from '@/dich-vu/http';
import { dinhDangTien } from '@/cau-hinh/dinh-dang';

export function ThucDon() {
  const navigate = useNavigate();
  const [dm, setDm] = useState('tat-ca');
  const [tuKhoa, setTuKhoa] = useState('');
  const danhMucQuery = useQuery({ queryKey: ['thuc-don', 'danh-muc'], queryFn: thucDonApi.danhMuc });
  const monQuery = useQuery({
    queryKey: ['thuc-don', 'mon-an'],
    queryFn: () => thucDonApi.monAn({ trang: 1, kichThuoc: 20 }),
  });

  const danhMuc = danhMucQuery.data ?? [];
  const mon = monQuery.data?.danhSach ?? [];
  const loiGoc = danhMucQuery.error ?? monQuery.error;
  const loi = loiGoc instanceof LoiApi ? loiGoc.message : loiGoc ? 'Không tải được thực đơn.' : '';
  const dangTai = danhMucQuery.isPending || monQuery.isPending;

  const hienThi = useMemo(() => mon.filter((m) =>
    (dm === 'tat-ca' || m.danhMucId === dm) &&
    (!tuKhoa || m.tenMon.toLocaleLowerCase('vi').includes(tuKhoa.toLocaleLowerCase('vi'))),
  ), [mon, dm, tuKhoa]);

  return <div className="page-container section">
    <div className="public-page-heading">
      <Typography.Title level={2}>Thực đơn</Typography.Title>
      <Typography.Paragraph type="secondary">Chọn món để xem chi tiết, hình ảnh và tình trạng phục vụ hiện tại.</Typography.Paragraph>
    </div>
    {loi && <Alert type="error" showIcon message={loi} className="mb-16" />}
    <Flex gap={12} wrap className="mb-24 menu-filter-bar">
      <Segmented value={dm} onChange={(v) => setDm(String(v))} options={[
        { label: 'Tất cả', value: 'tat-ca' }, ...danhMuc.map((x) => ({ label: x.tenDanhMuc, value: x.id })),
      ]} />
      <Input
        allowClear
        prefix={<SearchOutlined />}
        placeholder="Tìm món..."
        className="menu-search"
        value={tuKhoa}
        onChange={(e) => setTuKhoa(e.target.value)}
      />
    </Flex>
    {dangTai ? <Skeleton active /> : hienThi.length ? <Row gutter={[18, 18]}>
      {hienThi.map((m) => <Col xs={24} sm={12} lg={8} key={m.id}>
        <Card
          hoverable
          className="dish-card"
          onClick={() => navigate(`/thuc-don/${m.duongDan}`)}
          cover={m.hinhAnhChinh ? <img src={m.hinhAnhChinh} alt={m.tenMon} loading="lazy" /> : <div className="dish-placeholder">{m.tenMon.slice(0, 1)}</div>}
        >
          <Typography.Title level={4} style={{ marginTop: 0 }}>{m.tenMon}</Typography.Title>
          <Typography.Paragraph type="secondary" ellipsis={{ rows: 2 }}>{m.moTa || 'Món ngon tại nhà hàng'}</Typography.Paragraph>
          <div className="dish-card-footer">
            <div className="price">{dinhDangTien(m.giaKhuyenMai ?? m.gia)}</div>
            <Typography.Text type="secondary">Xem chi tiết →</Typography.Text>
          </div>
        </Card>
      </Col>)}
    </Row> : <Empty description="Không có món phù hợp" />}
  </div>;
}
