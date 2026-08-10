import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { App, Button, Card, Form, Input, InputNumber, Modal, Select, Space, Table } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { quanTriApi, type KhuVucPayload, type KhuVucQuanTri } from '@/dich-vu/quan-tri.api';
import { LoiApi } from '@/dich-vu/http';
import { CanhBaoLoi } from '@/thanh-phan/canh-bao-loi';
import { TieuDeTrang } from '@/thanh-phan/tieu-de-trang';
import { TrangThai } from '@/thanh-phan/trang-thai';

type FormData = KhuVucPayload;

export function QuanTriKhuVuc() {
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<FormData>();
  const [dangSua, setDangSua] = useState<KhuVucQuanTri | null>(null);
  const [moForm, setMoForm] = useState(false);
  const [tuKhoa, setTuKhoa] = useState('');
  const [trangThai, setTrangThai] = useState<string>();

  const query = useQuery({
    queryKey: ['quan-tri', 'khu-vuc', tuKhoa, trangThai],
    queryFn: () => quanTriApi.khuVuc({ tuKhoa, trangThai }),
  });

  const luuMutation = useMutation({
    mutationFn: ({ id, duLieu }: { id?: string; duLieu: FormData }) => id ? quanTriApi.capNhatKhuVuc(id, duLieu) : quanTriApi.taoKhuVuc(duLieu),
    onSuccess: async (_data, bien) => {
      message.success(bien.id ? 'Đã cập nhật khu vực' : 'Đã tạo khu vực');
      setMoForm(false);
      await queryClient.invalidateQueries({ queryKey: ['quan-tri', 'khu-vuc'] });
    },
    onError: (e) => message.error(e instanceof LoiApi ? e.message : 'Không lưu được khu vực.'),
  });

  const xoaMutation = useMutation({
    mutationFn: quanTriApi.xoaKhuVuc,
    onSuccess: async () => {
      message.success('Đã xóa khu vực');
      await queryClient.invalidateQueries({ queryKey: ['quan-tri', 'khu-vuc'] });
    },
    onError: (e) => message.error(e instanceof LoiApi ? e.message : 'Không xóa được khu vực.'),
  });

  const moTao = () => {
    setDangSua(null);
    form.resetFields();
    form.setFieldsValue({ thuTu: 0, trangThai: 'HOAT_DONG' });
    setMoForm(true);
  };

  const moSua = (r: KhuVucQuanTri) => {
    setDangSua(r);
    form.setFieldsValue({
      maKhuVuc: r.maKhuVuc,
      tenKhuVuc: r.tenKhuVuc,
      moTa: r.moTa ?? undefined,
      hinhAnh: r.hinhAnh ?? undefined,
      thuTu: r.thuTu,
      trangThai: r.trangThai,
    });
    setMoForm(true);
  };

  return <>
    <TieuDeTrang
      tieuDe="Khu vực"
      moTa="Quản lý các khu vực phục vụ trước khi sắp bàn vào từng khu."
      hanhDong={<Button type="primary" icon={<PlusOutlined />} onClick={moTao}>Thêm khu vực</Button>}
    />
    <Card className="filter-card mb-16">
      <Space wrap>
        <Input.Search allowClear placeholder="Mã / tên khu vực" onSearch={setTuKhoa} style={{ width: 260 }} />
        <Select allowClear placeholder="Trạng thái" value={trangThai} onChange={setTrangThai} style={{ width: 190 }} options={[
          { value: 'HOAT_DONG', label: 'Hoạt động' },
          { value: 'NGUNG_HOAT_DONG', label: 'Ngừng hoạt động' },
        ]} />
        <Button icon={<ReloadOutlined />} onClick={() => query.refetch()}>Làm mới</Button>
      </Space>
    </Card>
    <CanhBaoLoi loi={query.error} macDinh="Không tải được khu vực." />
    <Card>
      <Table
        rowKey="id"
        loading={query.isPending || query.isFetching}
        dataSource={query.data ?? []}
        pagination={false}
        scroll={{ x: 900 }}
        columns={[
          { title: 'Mã', dataIndex: 'maKhuVuc' },
          { title: 'Tên khu vực', dataIndex: 'tenKhuVuc' },
          { title: 'Mô tả', dataIndex: 'moTa', ellipsis: true },
          { title: 'Thứ tự', dataIndex: 'thuTu', width: 90 },
          { title: 'Trạng thái', dataIndex: 'trangThai', render: (v: string) => <TrangThai value={v} /> },
          { title: 'Thao tác', fixed: 'right', width: 150, render: (_: unknown, r: KhuVucQuanTri) => <Space>
            <Button aria-label="Sửa khu vực" size="small" icon={<EditOutlined />} onClick={() => moSua(r)} />
            <Button aria-label="Xóa khu vực" size="small" danger icon={<DeleteOutlined />} onClick={() => modal.confirm({
              title: 'Xóa khu vực?',
              content: `Khu vực “${r.tenKhuVuc}” chỉ xóa được khi không còn bàn đang thuộc khu vực này.`,
              okText: 'Xóa', cancelText: 'Đóng', okButtonProps: { danger: true },
              onOk: () => xoaMutation.mutateAsync(r.id),
            })} />
          </Space> },
        ]}
      />
    </Card>

    <Modal
      open={moForm}
      title={dangSua ? 'Sửa khu vực' : 'Thêm khu vực'}
      okText="Lưu"
      cancelText="Đóng"
      confirmLoading={luuMutation.isPending}
      onCancel={() => setMoForm(false)}
      onOk={() => form.submit()}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={(v) => luuMutation.mutate({ id: dangSua?.id, duLieu: v })}>
        <Form.Item name="maKhuVuc" label="Mã khu vực" rules={[{ required: true, message: 'Nhập mã khu vực' }]}><Input maxLength={30} /></Form.Item>
        <Form.Item name="tenKhuVuc" label="Tên khu vực" rules={[{ required: true, message: 'Nhập tên khu vực' }]}><Input maxLength={150} /></Form.Item>
        <Form.Item name="moTa" label="Mô tả"><Input.TextArea rows={3} /></Form.Item>
        <Form.Item name="hinhAnh" label="URL hình ảnh"><Input maxLength={500} placeholder="https://..." /></Form.Item>
        <Space className="form-row" align="start" wrap>
          <Form.Item name="thuTu" label="Thứ tự"><InputNumber min={0} /></Form.Item>
          <Form.Item name="trangThai" label="Trạng thái"><Select style={{ width: 190 }} options={[
            { value: 'HOAT_DONG', label: 'Hoạt động' },
            { value: 'NGUNG_HOAT_DONG', label: 'Ngừng hoạt động' },
          ]} /></Form.Item>
        </Space>
      </Form>
    </Modal>
  </>;
}
