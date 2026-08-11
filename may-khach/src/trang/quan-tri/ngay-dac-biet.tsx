import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { App, Button, Card, Form, Input, Modal, Space, Switch, Table, Tag, Typography } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { quanTriApi, type NgayDacBietPayload, type NgayDacBietQuanTri } from '@/dich-vu/quan-tri.api';
import { LoiApi } from '@/dich-vu/http';
import { CanhBaoLoi } from '@/thanh-phan/canh-bao-loi';
import { TieuDeTrang } from '@/thanh-phan/tieu-de-trang';

export function QuanTriNgayDacBiet() {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<NgayDacBietPayload>();
  const [dangSua, setDangSua] = useState<NgayDacBietQuanTri | null>(null);
  const [moForm, setMoForm] = useState(false);
  const [tuNgay, setTuNgay] = useState('');
  const [denNgay, setDenNgay] = useState('');
  const queryClient = useQueryClient();
  const dongCuaCaNgay = Form.useWatch('dongCuaCaNgay', form);

  const query = useQuery({
    queryKey: ['quan-tri', 'ngay-dac-biet', tuNgay, denNgay],
    queryFn: () => quanTriApi.ngayDacBiet({
      tuNgay: tuNgay || undefined,
      denNgay: denNgay || undefined,
    }),
  });

  const luuMutation = useMutation({
    mutationFn: ({ id, duLieu }: { id?: string; duLieu: NgayDacBietPayload }) =>
      id
        ? quanTriApi.capNhatNgayDacBiet(id, duLieu)
        : quanTriApi.taoNgayDacBiet(duLieu),
    onSuccess: async () => {
      message.success('Đã lưu ngày đặc biệt');
      setMoForm(false);
      setDangSua(null);
      await queryClient.invalidateQueries({ queryKey: ['quan-tri', 'ngay-dac-biet'] });
    },
    onError: (e) => message.error(e instanceof LoiApi ? e.message : 'Không lưu được ngày đặc biệt.'),
  });

  const xoaMutation = useMutation({
    mutationFn: quanTriApi.xoaNgayDacBiet,
    onSuccess: async () => {
      message.success('Đã xóa ngày đặc biệt');
      await queryClient.invalidateQueries({ queryKey: ['quan-tri', 'ngay-dac-biet'] });
    },
    onError: (e) => message.error(e instanceof LoiApi ? e.message : 'Không xóa được ngày đặc biệt.'),
  });

  const moTao = () => {
    setDangSua(null);
    form.resetFields();
    form.setFieldsValue({ dongCuaCaNgay: true });
    setMoForm(true);
  };

  const moSua = (row: NgayDacBietQuanTri) => {
    setDangSua(row);
    form.setFieldsValue({
      ngay: row.ngay,
      tenSuKien: row.tenSuKien,
      dongCuaCaNgay: row.dongCuaCaNgay,
      gioMoCua: row.gioMoCua ?? undefined,
      gioDongCua: row.gioDongCua ?? undefined,
      ghiChu: row.ghiChu ?? undefined,
    });
    setMoForm(true);
  };

  return <>
    <TieuDeTrang
      tieuDe="Ngày đặc biệt"
      moTa="Ngày nghỉ, ngày lễ hoặc ngày có giờ phục vụ riêng sẽ ghi đè lịch hoạt động theo tuần."
      hanhDong={<Space>
        <Button icon={<ReloadOutlined />} onClick={() => query.refetch()}>Làm mới</Button>
        <Button
          aria-label="Thêm ngày đặc biệt"
          type="primary"
          icon={<PlusOutlined />}
          onClick={moTao}
        >
          Thêm ngày đặc biệt
        </Button>
      </Space>}
    />

    <Card className="filter-card admin-filter-card mb-16">
      <Space wrap align="end">
        <Space direction="vertical" size={4}>
          <Typography.Text>Từ ngày</Typography.Text>
          <Input aria-label="Từ ngày" type="date" value={tuNgay} onChange={(e) => setTuNgay(e.target.value)} />
        </Space>
        <Space direction="vertical" size={4}>
          <Typography.Text>Đến ngày</Typography.Text>
          <Input aria-label="Đến ngày" type="date" value={denNgay} onChange={(e) => setDenNgay(e.target.value)} />
        </Space>
        {(tuNgay || denNgay) && <Button onClick={() => {
          setTuNgay('');
          setDenNgay('');
        }}>Xóa lọc</Button>}
      </Space>
    </Card>

    <CanhBaoLoi loi={query.error} macDinh="Không tải được ngày đặc biệt." />
    <Card className="admin-table-card"><Table
        rowKey="id"
        loading={query.isPending || query.isFetching}
        dataSource={query.data ?? []}
        pagination={{ pageSize: 20, showSizeChanger: false }}
        scroll={{ x: 900 }}
        columns={[
          { title: 'Ngày', dataIndex: 'ngay', width: 130 },
          { title: 'Sự kiện', dataIndex: 'tenSuKien', width: 220 },
          {
            title: 'Hoạt động',
            dataIndex: 'dongCuaCaNgay',
            width: 170,
            render: (v: boolean, row: NgayDacBietQuanTri) =>
              v
                ? <Tag color="red">Đóng cả ngày</Tag>
                : <Tag color="green">{row.gioMoCua}–{row.gioDongCua}</Tag>,
          },
          { title: 'Ghi chú', dataIndex: 'ghiChu' },
          {
            title: 'Thao tác',
            fixed: 'right',
            width: 160,
            render: (_: unknown, row: NgayDacBietQuanTri) => <Space>
              <Button
                aria-label="Sửa"
                size="small"
                icon={<EditOutlined />}
                onClick={() => moSua(row)}
              >
                Sửa
              </Button>
              <Button
                aria-label={`Xóa ngày đặc biệt ${row.ngay}`}
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => modal.confirm({
                  title: 'Xóa ngày đặc biệt?',
                  content: `${row.ngay} · ${row.tenSuKien}`,
                  okText: 'Xóa',
                  cancelText: 'Đóng',
                  okButtonProps: { danger: true },
                  onOk: () => xoaMutation.mutateAsync(row.id),
                })}
              />
            </Space>,
          },
        ]}
      />
    </Card>

    <Modal className="admin-form-modal"
      open={moForm}
      title={dangSua ? 'Sửa ngày đặc biệt' : 'Thêm ngày đặc biệt'}
      okText="Lưu"
      cancelText="Đóng"
      confirmLoading={luuMutation.isPending}
      onCancel={() => {
        setMoForm(false);
        setDangSua(null);
      }}
      onOk={() => form.submit()}
      destroyOnHidden
    >
      <Form size="middle"
        form={form}
        layout="vertical"
        onFinish={(duLieu) => luuMutation.mutate({ id: dangSua?.id, duLieu })}
      >
        <Form.Item name="ngay" label="Ngày" rules={[{ required: true, message: 'Chọn ngày' }]}>
          <Input type="date" />
        </Form.Item>
        <Form.Item name="tenSuKien" label="Tên sự kiện" rules={[{ required: true, message: 'Nhập tên sự kiện' }]}>
          <Input maxLength={200} />
        </Form.Item>
        <Form.Item name="dongCuaCaNgay" label="Đóng cửa cả ngày" valuePropName="checked">
          <Switch />
        </Form.Item>
        {!dongCuaCaNgay && <Space className="form-row" align="start" wrap>
          <Form.Item name="gioMoCua" label="Giờ mở cửa" rules={[{ required: true, message: 'Chọn giờ mở cửa' }]}>
            <Input type="time" />
          </Form.Item>
          <Form.Item name="gioDongCua" label="Giờ đóng cửa" rules={[{ required: true, message: 'Chọn giờ đóng cửa' }]}>
            <Input type="time" />
          </Form.Item>
        </Space>}
        <Form.Item name="ghiChu" label="Ghi chú">
          <Input.TextArea rows={3} maxLength={500} showCount />
        </Form.Item>
      </Form>
    </Modal>
  </>;
}
