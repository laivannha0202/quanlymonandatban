import { DeleteOutlined, EditOutlined, LinkOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { App, Button, Card, Form, Input, InputNumber, Modal, Select, Space, Switch, Table, Tabs, Tag } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  quanTriApi,
  type BanAnPayload,
  type BanAnQuanTri,
  type LienKetBanQuanTri,
} from '@/dich-vu/quan-tri.api';
import { LoiApi } from '@/dich-vu/http';
import { useXacThuc } from '@/ngu-canh/xac-thuc.context';
import { CanhBaoLoi } from '@/thanh-phan/canh-bao-loi';
import { TieuDeTrang } from '@/thanh-phan/tieu-de-trang';
import { TrangThai } from '@/thanh-phan/trang-thai';

type FormBan = BanAnPayload;
type FormLienKet = { ban1Id: string; ban2Id: string; coTheGhep: boolean; ghiChu?: string };

export function QuanTriBanAn() {
  const { message, modal } = App.useApp();
  const { coQuyen } = useXacThuc();
  const coQuanLy = coQuyen('BAN_AN_QUAN_LY');
  const qc = useQueryClient();
  const [formBan] = Form.useForm<FormBan>();
  const [formLienKet] = Form.useForm<FormLienKet>();
  const [dangSua, setDangSua] = useState<BanAnQuanTri | null>(null);
  const [moFormBan, setMoFormBan] = useState(false);
  const [moFormLienKet, setMoFormLienKet] = useState(false);
  const [tuKhoa, setTuKhoa] = useState('');
  const [khuVucId, setKhuVucId] = useState<string>();
  const [trangThai, setTrangThai] = useState<string>();

  const khuVucQuery = useQuery({ queryKey: ['quan-tri', 'khu-vuc', 'cho-ban'], queryFn: () => quanTriApi.khuVuc() });
  const banQuery = useQuery({
    queryKey: ['quan-tri', 'ban-an', tuKhoa, khuVucId, trangThai],
    queryFn: () => quanTriApi.banAn({ tuKhoa, khuVucId, trangThai }),
  });
  const lienKetQuery = useQuery({ queryKey: ['quan-tri', 'ban-an', 'lien-ket'], queryFn: quanTriApi.lienKetBan });

  const tenKhuVuc = useMemo(() => new Map((khuVucQuery.data ?? []).map((x) => [x.id, x.tenKhuVuc])), [khuVucQuery.data]);
  const tenBan = useMemo(() => new Map((banQuery.data?.danhSach ?? []).map((x) => [x.id, `${x.maBan} · ${x.tenBan}`])), [banQuery.data]);

  const lamMoi = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['quan-tri', 'ban-an'] }),
      qc.invalidateQueries({ queryKey: ['quan-tri', 'khu-vuc'] }),
    ]);
  };

  const luuBan = useMutation({
    mutationFn: ({ id, duLieu }: { id?: string; duLieu: FormBan }) => id ? quanTriApi.capNhatBanAn(id, duLieu) : quanTriApi.taoBanAn(duLieu),
    onSuccess: async (_r, bien) => { message.success(bien.id ? 'Đã cập nhật bàn' : 'Đã tạo bàn'); setMoFormBan(false); await lamMoi(); },
    onError: (e) => message.error(e instanceof LoiApi ? e.message : 'Không lưu được bàn.'),
  });
  const xoaBan = useMutation({
    mutationFn: quanTriApi.xoaBanAn,
    onSuccess: async () => { message.success('Đã xóa bàn'); await lamMoi(); },
    onError: (e) => message.error(e instanceof LoiApi ? e.message : 'Không xóa được bàn.'),
  });
  const taoLienKet = useMutation({
    mutationFn: quanTriApi.taoLienKetBan,
    onSuccess: async () => { message.success('Đã tạo liên kết bàn'); setMoFormLienKet(false); await qc.invalidateQueries({ queryKey: ['quan-tri', 'ban-an', 'lien-ket'] }); },
    onError: (e) => message.error(e instanceof LoiApi ? e.message : 'Không tạo được liên kết.'),
  });
  const capNhatLienKet = useMutation({
    mutationFn: ({ id, coTheGhep }: { id: string; coTheGhep: boolean }) => quanTriApi.capNhatLienKetBan(id, { coTheGhep }),
    onSuccess: async () => { message.success('Đã cập nhật liên kết'); await qc.invalidateQueries({ queryKey: ['quan-tri', 'ban-an', 'lien-ket'] }); },
    onError: (e) => message.error(e instanceof LoiApi ? e.message : 'Không cập nhật được liên kết.'),
  });
  const xoaLienKet = useMutation({
    mutationFn: quanTriApi.xoaLienKetBan,
    onSuccess: async () => { message.success('Đã xóa liên kết'); await qc.invalidateQueries({ queryKey: ['quan-tri', 'ban-an', 'lien-ket'] }); },
    onError: (e) => message.error(e instanceof LoiApi ? e.message : 'Không xóa được liên kết.'),
  });

  const moTaoBan = () => {
    setDangSua(null);
    formBan.resetFields();
    formBan.setFieldsValue({ sucChua: 2, sucChuaToiDa: 2, trangThai: 'TRONG' } as Partial<FormBan>);
    setMoFormBan(true);
  };
  const moSuaBan = (r: BanAnQuanTri) => {
    setDangSua(r);
    formBan.setFieldsValue({
      maBan: r.maBan,
      tenBan: r.tenBan,
      khuVucId: r.khuVucId,
      sucChua: r.sucChua,
      sucChuaToiDa: r.sucChuaToiDa,
      viTriX: r.viTriX ?? undefined,
      viTriY: r.viTriY ?? undefined,
      trangThai: r.trangThai,
      ghiChu: r.ghiChu ?? undefined,
    });
    setMoFormBan(true);
  };

  const tabBan = <>
    <Card className="filter-card mb-16">
      <Space wrap>
        <Input.Search allowClear placeholder="Mã / tên bàn" onSearch={setTuKhoa} style={{ width: 230 }} />
        <Select allowClear placeholder="Khu vực" value={khuVucId} onChange={setKhuVucId} style={{ width: 200 }} options={(khuVucQuery.data ?? []).map((x) => ({ value: x.id, label: x.tenKhuVuc }))} />
        <Select allowClear placeholder="Trạng thái" value={trangThai} onChange={setTrangThai} style={{ width: 190 }} options={[
          { value: 'TRONG', label: 'Trống' }, { value: 'DANG_SU_DUNG', label: 'Đang sử dụng' }, { value: 'BAO_TRI', label: 'Bảo trì' }, { value: 'NGUNG_SU_DUNG', label: 'Ngừng sử dụng' },
        ]} />
        <Button icon={<ReloadOutlined />} onClick={() => banQuery.refetch()}>Làm mới</Button>
      </Space>
    </Card>
    <CanhBaoLoi loi={banQuery.error ?? khuVucQuery.error} macDinh="Không tải được bàn ăn." />
    <Card><Table
      rowKey="id"
      loading={banQuery.isPending || banQuery.isFetching}
      dataSource={banQuery.data?.danhSach ?? []}
      scroll={{ x: 1050 }}
      pagination={{ pageSize: 20, showSizeChanger: false }}
      columns={[
        { title: 'Mã bàn', dataIndex: 'maBan', fixed: 'left' },
        { title: 'Tên bàn', dataIndex: 'tenBan' },
        { title: 'Khu vực', dataIndex: 'khuVucId', render: (id: string) => tenKhuVuc.get(id) || id },
        { title: 'Sức chứa', dataIndex: 'sucChua', width: 100 },
        { title: 'Tối đa', dataIndex: 'sucChuaToiDa', width: 90 },
        { title: 'Trạng thái', dataIndex: 'trangThai', render: (v: string) => <TrangThai value={v} /> },
        { title: 'Ghi chú', dataIndex: 'ghiChu', ellipsis: true },
        { title: 'Thao tác', fixed: 'right', width: 150, render: (_: unknown, r: BanAnQuanTri) => coQuanLy ? <Space>
          <Button size="small" aria-label="Sửa bàn" icon={<EditOutlined />} onClick={() => moSuaBan(r)} />
          <Button size="small" aria-label="Xóa bàn" danger icon={<DeleteOutlined />} onClick={() => modal.confirm({
            title: 'Xóa bàn?', content: `${r.maBan} · ${r.tenBan}`, okText: 'Xóa', cancelText: 'Đóng', okButtonProps: { danger: true }, onOk: () => xoaBan.mutateAsync(r.id),
          })} />
        </Space> : '—' },
      ]}
    /></Card>
  </>;

  const tabLienKet = <>
    <CanhBaoLoi loi={lienKetQuery.error} macDinh="Không tải được liên kết bàn." />
    <Card><Table
      rowKey="id"
      loading={lienKetQuery.isPending || lienKetQuery.isFetching}
      dataSource={lienKetQuery.data ?? []}
      pagination={false}
      scroll={{ x: 760 }}
      columns={[
        { title: 'Bàn 1', dataIndex: 'ban1Id', render: (id: string) => tenBan.get(id) || id },
        { title: 'Bàn 2', dataIndex: 'ban2Id', render: (id: string) => tenBan.get(id) || id },
        { title: 'Có thể ghép', dataIndex: 'coTheGhep', render: (v: boolean, r: LienKetBanQuanTri) => <Switch disabled={!coQuanLy} checked={Boolean(v)} onChange={(checked) => capNhatLienKet.mutate({ id: r.id, coTheGhep: checked })} /> },
        { title: 'Ghi chú', dataIndex: 'ghiChu', ellipsis: true },
        { title: '', width: 80, render: (_: unknown, r: LienKetBanQuanTri) => coQuanLy ? <Button danger size="small" icon={<DeleteOutlined />} onClick={() => modal.confirm({ title: 'Xóa liên kết bàn?', okText: 'Xóa', cancelText: 'Đóng', okButtonProps: { danger: true }, onOk: () => xoaLienKet.mutateAsync(r.id) })} /> : null },
      ]}
    /></Card>
  </>;

  return <>
    <TieuDeTrang
      tieuDe="Bàn ăn"
      moTa="Quản lý bàn, sức chứa và các cặp bàn được phép ghép khi tìm bàn trống."
      hanhDong={coQuanLy ? <Space wrap><Button icon={<LinkOutlined />} onClick={() => { formLienKet.resetFields(); formLienKet.setFieldsValue({ coTheGhep: true } as Partial<FormLienKet>); setMoFormLienKet(true); }}>Liên kết bàn</Button><Button type="primary" icon={<PlusOutlined />} onClick={moTaoBan}>Thêm bàn</Button></Space> : undefined}
    />
    <Tabs items={[
      { key: 'ban', label: <span>Bàn ăn <Tag>{banQuery.data?.danhSach.length ?? 0}</Tag></span>, children: tabBan },
      { key: 'lien-ket', label: <span>Liên kết ghép bàn <Tag>{lienKetQuery.data?.length ?? 0}</Tag></span>, children: tabLienKet },
    ]} />

    <Modal open={moFormBan} title={dangSua ? 'Sửa bàn ăn' : 'Thêm bàn ăn'} okText="Lưu" cancelText="Đóng" confirmLoading={luuBan.isPending} onCancel={() => setMoFormBan(false)} onOk={() => formBan.submit()} destroyOnHidden>
      <Form form={formBan} layout="vertical" onFinish={(v) => luuBan.mutate({ id: dangSua?.id, duLieu: v })}>
        <Space className="form-row" align="start" wrap>
          <Form.Item name="maBan" label="Mã bàn" rules={[{ required: true, message: 'Nhập mã bàn' }]}><Input maxLength={30} /></Form.Item>
          <Form.Item name="tenBan" label="Tên bàn" rules={[{ required: true, message: 'Nhập tên bàn' }]}><Input maxLength={100} /></Form.Item>
        </Space>
        <Form.Item name="khuVucId" label="Khu vực" rules={[{ required: true, message: 'Chọn khu vực' }]}><Select options={(khuVucQuery.data ?? []).filter((x) => x.trangThai === 'HOAT_DONG' || x.id === dangSua?.khuVucId).map((x) => ({ value: x.id, label: x.tenKhuVuc }))} /></Form.Item>
        <Space className="form-row" align="start" wrap>
          <Form.Item name="sucChua" label="Sức chứa" rules={[{ required: true }]}><InputNumber min={1} max={100} /></Form.Item>
          <Form.Item name="sucChuaToiDa" label="Sức chứa tối đa" rules={[{ required: true }]}><InputNumber min={1} max={100} /></Form.Item>
          <Form.Item name="trangThai" label="Trạng thái"><Select style={{ width: 180 }} options={[
            { value: 'TRONG', label: 'Trống' }, { value: 'DANG_SU_DUNG', label: 'Đang sử dụng' }, { value: 'BAO_TRI', label: 'Bảo trì' }, { value: 'NGUNG_SU_DUNG', label: 'Ngừng sử dụng' },
          ]} /></Form.Item>
        </Space>
        <Space className="form-row" align="start" wrap>
          <Form.Item name="viTriX" label="Vị trí X"><InputNumber /></Form.Item>
          <Form.Item name="viTriY" label="Vị trí Y"><InputNumber /></Form.Item>
        </Space>
        <Form.Item name="ghiChu" label="Ghi chú"><Input.TextArea rows={3} /></Form.Item>
      </Form>
    </Modal>

    <Modal open={moFormLienKet} title="Liên kết hai bàn" okText="Tạo liên kết" cancelText="Đóng" confirmLoading={taoLienKet.isPending} onCancel={() => setMoFormLienKet(false)} onOk={() => formLienKet.submit()} destroyOnHidden>
      <Form form={formLienKet} layout="vertical" onFinish={(v) => taoLienKet.mutate(v)}>
        <Form.Item name="ban1Id" label="Bàn 1" rules={[{ required: true, message: 'Chọn bàn 1' }]}><Select showSearch optionFilterProp="label" options={(banQuery.data?.danhSach ?? []).map((x) => ({ value: x.id, label: `${x.maBan} · ${x.tenBan} · ${tenKhuVuc.get(x.khuVucId) || x.khuVucId}` }))} /></Form.Item>
        <Form.Item name="ban2Id" label="Bàn 2" rules={[{ required: true, message: 'Chọn bàn 2' }]}><Select showSearch optionFilterProp="label" options={(banQuery.data?.danhSach ?? []).map((x) => ({ value: x.id, label: `${x.maBan} · ${x.tenBan} · ${tenKhuVuc.get(x.khuVucId) || x.khuVucId}` }))} /></Form.Item>
        <Form.Item name="coTheGhep" label="Cho phép ghép" valuePropName="checked"><Switch /></Form.Item>
        <Form.Item name="ghiChu" label="Ghi chú"><Input.TextArea rows={3} maxLength={500} /></Form.Item>
      </Form>
    </Modal>
  </>;
}
