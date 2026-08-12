import {
  ArrowRightOutlined,
  SearchOutlined,
  StarFilled,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Input,
  Row,
  Segmented,
  Skeleton,
  Space,
  Tag,
  Typography,
} from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { layAnhMonMacDinh } from '@/cau-hinh/hinh-anh-mau';
import { dinhDangTien } from '@/cau-hinh/dinh-dang';
import { LoiApi } from '@/dich-vu/http';
import { thucDonApi } from '@/dich-vu/thuc-don.api';

export function ThucDon() {
  const navigate = useNavigate();
  const [dm, setDm] = useState('tat-ca');
  const [tuKhoa, setTuKhoa] = useState('');

  const danhMucQuery = useQuery({
    queryKey: ['thuc-don', 'danh-muc'],
    queryFn: thucDonApi.danhMuc,
    staleTime: 60_000,
  });
  const monQuery = useQuery({
    queryKey: ['thuc-don', 'mon-an'],
    queryFn: () => thucDonApi.monAn({ trang: 1, kichThuoc: 100 }),
    staleTime: 30_000,
  });

  const danhMuc = danhMucQuery.data ?? [];
  const mon = monQuery.data?.danhSach ?? [];
  const loiGoc = danhMucQuery.error ?? monQuery.error;
  const loi = loiGoc instanceof LoiApi ? loiGoc.message : loiGoc ? 'Không tải được thực đơn.' : '';
  const dangTai = danhMucQuery.isPending || monQuery.isPending;

  const hienThi = useMemo(() => {
    const tuKhoaChuan = tuKhoa.trim().toLocaleLowerCase('vi');
    return mon.filter((m) =>
      (dm === 'tat-ca' || m.danhMucId === dm) &&
      (!tuKhoaChuan ||
        m.tenMon.toLocaleLowerCase('vi').includes(tuKhoaChuan) ||
        (m.moTa || '').toLocaleLowerCase('vi').includes(tuKhoaChuan)),
    );
  }, [mon, dm, tuKhoa]);

  return (
    <>
      <section className="menu-page-hero">
        <div className="page-container">
          <Typography.Text className="eyebrow">THỰC ĐƠN NHÀ HÀNG</Typography.Text>
          <Typography.Title level={1}>Chọn món bạn thích trước khi chọn bàn.</Typography.Title>
          <Typography.Paragraph>
            Khám phá món đang phục vụ, mức giá hiện tại và chọn hương vị phù hợp cho bữa ăn của bạn.
          </Typography.Paragraph>
        </div>
      </section>

      <div className="page-container section menu-page-content">
        {loi && <Alert type="error" showIcon message={loi} className="mb-16" />}

        <Card className="menu-toolbar-card mb-24">
          <Flex gap={12} wrap className="menu-filter-bar">
            <Segmented
              value={dm}
              onChange={(v) => setDm(String(v))}
              options={[
                { label: 'Tất cả', value: 'tat-ca' },
                ...danhMuc.map((x) => ({ label: x.tenDanhMuc, value: x.id })),
              ]}
            />
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Tìm theo tên hoặc mô tả món..."
              className="menu-search"
              value={tuKhoa}
              onChange={(e) => setTuKhoa(e.target.value)}
            />
          </Flex>
          <div className="menu-result-copy">
            <Typography.Text type="secondary">
              {dangTai ? 'Đang tải thực đơn...' : `${hienThi.length} món phù hợp`}
            </Typography.Text>
          </div>
        </Card>

        {dangTai ? (
          <Row gutter={[18, 18]}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Col xs={24} sm={12} lg={8} key={i}><Card><Skeleton active /></Card></Col>
            ))}
          </Row>
        ) : hienThi.length ? (
          <Row gutter={[20, 20]}>
            {hienThi.map((m, index) => (
              <Col xs={24} sm={12} lg={8} key={m.id}>
                <Card
                  hoverable
                  className="dish-card menu-dish-card"
                  onClick={() => navigate(`/thuc-don/${m.duongDan}`)}
                  cover={
                    <div className="dish-image-wrap">
                      <img
                        src={m.hinhAnhChinh || layAnhMonMacDinh(index)}
                        alt={m.tenMon}
                        loading="lazy"
                      />
                      <div className="dish-image-overlay">
                        {m.laMonNoiBat ? <Tag color="gold" icon={<StarFilled />}>Nổi bật</Tag> : null}
                        <Tag color={m.conMon === false ? 'default' : 'green'}>
                          {m.conMon === false ? 'Hết món' : 'Đang phục vụ'}
                        </Tag>
                      </div>
                    </div>
                  }
                >
                  <Space direction="vertical" size={6} style={{ width: '100%' }}>
                    <Typography.Text type="secondary">{m.tenDanhMuc || 'Thực đơn'}</Typography.Text>
                    <Typography.Title level={4} className="dish-title">{m.tenMon}</Typography.Title>
                    <Typography.Paragraph type="secondary" ellipsis={{ rows: 2 }} className="dish-description">
                      {m.moTa || 'Món ngon được chuẩn bị tại nhà hàng.'}
                    </Typography.Paragraph>
                    <div className="dish-card-footer">
                      <div>
                        {m.giaKhuyenMai != null ? <div className="price-old">{dinhDangTien(m.gia)}</div> : null}
                        <div className="price">{dinhDangTien(m.giaKhuyenMai ?? m.gia)}</div>
                      </div>
                      <Button type="text" aria-label={`Xem ${m.tenMon}`}>
                        Chi tiết <ArrowRightOutlined />
                      </Button>
                    </div>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Card className="menu-empty-card">
            <Empty
              description="Không có món phù hợp"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button onClick={() => { setDm('tat-ca'); setTuKhoa(''); }}>Xóa bộ lọc</Button>
            </Empty>
          </Card>
        )}
      </div>
    </>
  );
}
