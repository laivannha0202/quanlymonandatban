import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PictureOutlined,
  PlusOutlined,
  ReloadOutlined,
  StarFilled,
} from '@ant-design/icons';
import {
  App,
  Avatar,
  Button,
  Card,
  Drawer,
  Form,
  Image,
  Input,
  InputNumber,
  List,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
} from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { heThongApi } from '@/dich-vu/he-thong.api';
import { LoiApi } from '@/dich-vu/http';
import { quanTriApi, type HinhAnhMonPayload, type MonAnPayload } from '@/dich-vu/quan-tri.api';
import type { HinhAnhMon, MonAn } from '@/kieu/nghiep-vu';
import { dinhDangTien } from '@/cau-hinh/dinh-dang';
import { CanhBaoLoi } from '@/thanh-phan/canh-bao-loi';
import { TieuDeTrang } from '@/thanh-phan/tieu-de-trang';
import { TrangThai } from '@/thanh-phan/trang-thai';

type FormMon = MonAnPayload;
type FormHinh = HinhAnhMonPayload;

export function QuanTriMonAn() {
  const { message, modal } = App.useApp();
  const qc = useQueryClient();
  const [form] = Form.useForm<FormMon>();
  const [formHinh] = Form.useForm<FormHinh>();
  const [dangSua, setDangSua] = useState<MonAn | null>(null);
  const [moForm, setMoForm] = useState(false);
  const [monAnhId, setMonAnhId] = useState<string | null>(null);
  const [moThemHinh, setMoThemHinh] = useState(false);
  const [tuKhoa, setTuKhoa] = useState('');
  const [danhMucId, setDanhMucId] = useState<string>();
  const [trangThai, setTrangThai] = useState<string>();
  const [conMon, setConMon] = useState<string>();

  const danhMucQuery = useQuery({ queryKey: ['quan-tri', 'danh-muc-mon', 'cho-mon-an'], queryFn: heThongApi.danhMucQuanTri });
  const monQuery = useQuery({
    queryKey: ['quan-tri', 'mon-an', tuKhoa, danhMucId, trangThai, conMon],
    queryFn: () => quanTriApi.monAn({ tuKhoa, danhMucId, trangThai, conMon }),
  });
  const chiTietQuery = useQuery({
    queryKey: ['quan-tri', 'mon-an', 'chi-tiet', monAnhId],
    queryFn: () => quanTriApi.monAnChiTiet(monAnhId!),
    enabled: Boolean(monAnhId),
  });

  const lamMoi = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['quan-tri', 'mon-an'] }),
      qc.invalidateQueries({ queryKey: ['thuc-don'] }),
    ]);
  };

  const luuMutation = useMutation({
    mutationFn: ({ id, duLieu }: { id?: string; duLieu: FormMon }) => id ? quanTriApi.capNhatMonAn(id, duLieu) : quanTriApi.taoMonAn(duLieu),
    onSuccess: async (_r, bien) => { message.success(bien.id ? 'Đã cập nhật món ăn' : 'Đã tạo món ăn'); setMoForm(false); await lamMoi(); },
    onError: (e) => message.error(e instanceof LoiApi ? e.message : 'Không lưu được món ăn.'),
  });
  const xoaMutation = useMutation({
    mutationFn: quanTriApi.xoaMonAn,
    onSuccess: async () => { message.success('Đã xóa món ăn'); await lamMoi(); },
    onError: (e) => message.error(e instanceof LoiApi ? e.message : 'Không xóa được món ăn.'),
  });
  const themHinhMutation = useMutation({
    mutationFn: ({ id, duLieu }: { id: string; duLieu: FormHinh }) => quanTriApi.themHinhMon(id, duLieu),
    onSuccess: async () => {
      message.success('Đã thêm hình ảnh');
      setMoThemHinh(false);
      await lamMoi();
      await qc.invalidateQueries({ queryKey: ['quan-tri', 'mon-an', 'chi-tiet', monAnhId] });
    },
    onError: (e) => message.error(e instanceof LoiApi ? e.message : 'Không thêm được hình ảnh.'),
  });
  const chinhHinhMutation = useMutation({
    mutationFn: ({ monId, hinhId }: { monId: string; hinhId: string }) => quanTriApi.capNhatHinhMon(monId, hinhId, { laAnhChinh: true }),
    onSuccess: async () => {
      message.success('Đã đặt làm ảnh chính');
      await lamMoi();
      await qc.invalidateQueries({ queryKey: ['quan-tri', 'mon-an', 'chi-tiet', monAnhId] });
    },
    onError: (e) => message.error(e instanceof LoiApi ? e.message : 'Không cập nhật được ảnh chính.'),
  });
  const xoaHinhMutation = useMutation({
    mutationFn: ({ monId, hinhId }: { monId: string; hinhId: string }) => quanTriApi.xoaHinhMon(monId, hinhId),
    onSuccess: async () => {
      message.success('Đã xóa hình ảnh');
      await lamMoi();
      await qc.invalidateQueries({ queryKey: ['quan-tri', 'mon-an', 'chi-tiet', monAnhId] });
    },
    onError: (e) => message.error(e instanceof LoiApi ? e.message : 'Không xóa được hình ảnh.'),
  });

  const moTao = () => {
    setDangSua(null);
    form.resetFields();
    form.setFieldsValue({ conMon: true, laMonNoiBat: false, trangThai: 'HOAT_DONG' } as Partial<FormMon>);
    setMoForm(true);
  };

  const moSua = (r: MonAn) => {
    setDangSua(r);
    form.setFieldsValue({
      maMon: r.maMon,
      danhMucId: r.danhMucId,
      tenMon: r.tenMon,
      duongDan: r.duongDan,
      moTa: r.moTa ?? undefined,
      gia: r.gia,
      giaKhuyenMai: r.giaKhuyenMai ?? undefined,
      hinhAnhChinh: r.hinhAnhChinh ?? undefined,
      laMonNoiBat: Boolean(r.laMonNoiBat),
      conMon: r.conMon !== false,
      trangThai: r.trangThai ?? 'HOAT_DONG',
    });
    setMoForm(true);
  };

  const moAnh = (r: MonAn) => setMonAnhId(r.id);

  return <>
    <TieuDeTrang
      tieuDe="Món ăn"
      moTa="Quản lý thông tin, giá, trạng thái bán và bộ hình ảnh của từng món."
      hanhDong={<Button type="primary" icon={<PlusOutlined />} onClick={moTao}>Thêm món ăn</Button>}
    />
    <Card className="filter-card mb-16">
      <Space wrap>
        <Input.Search allowClear placeholder="Mã / tên món" onSearch={setTuKhoa} style={{ width: 240 }} />
        <Select allowClear placeholder="Danh mục" value={danhMucId} onChange={setDanhMucId} style={{ width: 200 }} options={(danhMucQuery.data ?? []).map((x) => ({ value: x.id, label: x.tenDanhMuc }))} />
        <Select allowClear placeholder="Trạng thái" value={trangThai} onChange={setTrangThai} style={{ width: 180 }} options={[
          { value: 'HOAT_DONG', label: 'Hoạt động' }, { value: 'NGUNG_HOAT_DONG', label: 'Ngừng hoạt động' },
        ]} />
        <Select allowClear placeholder="Tình trạng món" value={conMon} onChange={setConMon} style={{ width: 170 }} options={[
          { value: 'true', label: 'Còn món' }, { value: 'false', label: 'Hết món' },
        ]} />
        <Button icon={<ReloadOutlined />} onClick={() => monQuery.refetch()}>Làm mới</Button>
      </Space>
    </Card>
    <CanhBaoLoi loi={monQuery.error ?? danhMucQuery.error} macDinh="Không tải được món ăn." />
    <Card><Table
      rowKey="id"
      loading={monQuery.isPending || monQuery.isFetching}
      dataSource={monQuery.data?.danhSach ?? []}
      scroll={{ x: 1200 }}
      pagination={{ pageSize: 20, showSizeChanger: false }}
      columns={[
        { title: 'Ảnh', width: 72, render: (_: unknown, r: MonAn) => <Avatar shape="square" size={46} src={r.hinhAnhChinh || undefined} icon={<PictureOutlined />} /> },
        { title: 'Mã', dataIndex: 'maMon', width: 100 },
        { title: 'Tên món', dataIndex: 'tenMon', fixed: 'left', width: 190, render: (v: string, r: MonAn) => <Space>{r.laMonNoiBat ? <Tooltip title="Món nổi bật"><StarFilled className="featured-star" /></Tooltip> : null}<span>{v}</span></Space> },
        { title: 'Danh mục', dataIndex: 'tenDanhMuc', width: 150 },
        { title: 'Giá', dataIndex: 'gia', width: 130, render: (v: number, r: MonAn) => r.giaKhuyenMai != null ? <Space direction="vertical" size={0}><span className="price-old">{dinhDangTien(v)}</span><strong>{dinhDangTien(r.giaKhuyenMai)}</strong></Space> : dinhDangTien(v) },
        { title: 'Còn món', dataIndex: 'conMon', width: 100, render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? 'Còn món' : 'Hết món'}</Tag> },
        { title: 'Trạng thái', dataIndex: 'trangThai', width: 130, render: (v: string) => <TrangThai value={v} /> },
        { title: 'Thao tác', fixed: 'right', width: 170, render: (_: unknown, r: MonAn) => <Space>
          <Button size="small" aria-label="Quản lý ảnh" icon={<EyeOutlined />} onClick={() => moAnh(r)} />
          <Button size="small" aria-label="Sửa món" icon={<EditOutlined />} onClick={() => moSua(r)} />
          <Button size="small" aria-label="Xóa món" danger icon={<DeleteOutlined />} onClick={() => modal.confirm({
            title: 'Xóa món ăn?', content: r.tenMon, okText: 'Xóa', cancelText: 'Đóng', okButtonProps: { danger: true }, onOk: () => xoaMutation.mutateAsync(r.id),
          })} />
        </Space> },
      ]}
    /></Card>

    <Modal width={720} open={moForm} title={dangSua ? 'Sửa món ăn' : 'Thêm món ăn'} okText="Lưu" cancelText="Đóng" confirmLoading={luuMutation.isPending} onCancel={() => setMoForm(false)} onOk={() => form.submit()} destroyOnHidden>
      <Form form={form} layout="vertical" onFinish={(v) => luuMutation.mutate({ id: dangSua?.id, duLieu: v })}>
        <Space className="form-row" align="start" wrap>
          <Form.Item name="maMon" label="Mã món" rules={[{ required: true, message: 'Nhập mã món' }]}><Input maxLength={30} /></Form.Item>
          <Form.Item name="danhMucId" label="Danh mục" rules={[{ required: true, message: 'Chọn danh mục' }]}><Select style={{ minWidth: 220 }} options={(danhMucQuery.data ?? []).filter((x) => x.trangThai === 'HOAT_DONG' || x.id === dangSua?.danhMucId).map((x) => ({ value: x.id, label: x.tenDanhMuc }))} /></Form.Item>
        </Space>
        <Form.Item name="tenMon" label="Tên món" rules={[{ required: true, message: 'Nhập tên món' }]}><Input maxLength={200} /></Form.Item>
        <Form.Item name="duongDan" label="Đường dẫn"><Input maxLength={220} placeholder="Bỏ trống khi tạo để backend tự sinh" /></Form.Item>
        <Form.Item name="moTa" label="Mô tả"><Input.TextArea rows={4} maxLength={5000} showCount /></Form.Item>
        <Space className="form-row" align="start" wrap>
          <Form.Item name="gia" label="Giá" rules={[{ required: true, message: 'Nhập giá' }]}><InputNumber min={0} step={1000} style={{ width: 190 }} addonAfter="₫" /></Form.Item>
          <Form.Item name="giaKhuyenMai" label="Giá khuyến mãi"><InputNumber min={0} step={1000} style={{ width: 190 }} addonAfter="₫" /></Form.Item>
          <Form.Item name="trangThai" label="Trạng thái"><Select style={{ width: 180 }} options={[{ value: 'HOAT_DONG', label: 'Hoạt động' }, { value: 'NGUNG_HOAT_DONG', label: 'Ngừng hoạt động' }]} /></Form.Item>
        </Space>
        <Form.Item name="hinhAnhChinh" label="URL ảnh chính"><Input maxLength={500} placeholder="https://..." /></Form.Item>
        <Space size="large" wrap>
          <Form.Item name="laMonNoiBat" label="Món nổi bật" valuePropName="checked"><Switch /></Form.Item>
          <Form.Item name="conMon" label="Còn món" valuePropName="checked"><Switch /></Form.Item>
        </Space>
      </Form>
    </Modal>

    <Drawer width={620} open={Boolean(monAnhId)} onClose={() => setMonAnhId(null)} title={`Hình ảnh · ${chiTietQuery.data?.tenMon ?? ''}`} extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { formHinh.resetFields(); formHinh.setFieldsValue({ thuTu: 0, laAnhChinh: false }); setMoThemHinh(true); }}>Thêm ảnh</Button>}>
      <CanhBaoLoi loi={chiTietQuery.error} macDinh="Không tải được hình ảnh món." />
      <List
        loading={chiTietQuery.isPending || chiTietQuery.isFetching}
        dataSource={chiTietQuery.data?.hinhAnh ?? []}
        locale={{ emptyText: 'Món này chưa có hình ảnh phụ.' }}
        renderItem={(h: HinhAnhMon) => <List.Item actions={[
          h.laAnhChinh ? <Tag color="gold" key="main"><StarFilled /> Ảnh chính</Tag> : <Button key="main" size="small" onClick={() => monAnhId && chinhHinhMutation.mutate({ monId: monAnhId, hinhId: h.id })}>Đặt ảnh chính</Button>,
          <Button key="delete" danger size="small" icon={<DeleteOutlined />} onClick={() => monAnhId && modal.confirm({ title: 'Xóa hình ảnh?', okText: 'Xóa', cancelText: 'Đóng', okButtonProps: { danger: true }, onOk: () => xoaHinhMutation.mutateAsync({ monId: monAnhId, hinhId: h.id }) })} />,
        ]}>
          <List.Item.Meta
            avatar={<Image width={84} height={64} className="admin-dish-image" src={h.duongDanAnh} fallback="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" />}
            title={h.altText || 'Hình món ăn'}
            description={<span>Thứ tự: {h.thuTu} · {h.duongDanAnh}</span>}
          />
        </List.Item>}
      />
      <div className="image-manager-note">Hiện Backend quản lý ảnh bằng URL/path. Upload file vật lý sẽ chỉ bật khi có storage endpoint riêng, tránh giả lập upload ở Frontend.</div>
    </Drawer>

    <Modal open={moThemHinh} title="Thêm hình ảnh món" okText="Thêm ảnh" cancelText="Đóng" confirmLoading={themHinhMutation.isPending} onCancel={() => setMoThemHinh(false)} onOk={() => formHinh.submit()} destroyOnHidden>
      <Form form={formHinh} layout="vertical" onFinish={(v) => monAnhId && themHinhMutation.mutate({ id: monAnhId, duLieu: v })}>
        <Form.Item name="duongDanAnh" label="URL/path hình ảnh" rules={[{ required: true, message: 'Nhập URL/path hình ảnh' }]}><Input maxLength={500} /></Form.Item>
        <Form.Item name="altText" label="Mô tả ảnh"><Input maxLength={255} /></Form.Item>
        <Space className="form-row" align="start" wrap>
          <Form.Item name="thuTu" label="Thứ tự"><InputNumber min={0} /></Form.Item>
          <Form.Item name="laAnhChinh" label="Đặt làm ảnh chính" valuePropName="checked"><Switch /></Form.Item>
        </Space>
      </Form>
    </Modal>
  </>;
}
