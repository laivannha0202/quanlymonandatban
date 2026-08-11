import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { App, Button, Card, Form, Input, InputNumber, Modal, Select, Space, Switch, Table, Tag } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { quanTriApi, type GioHoatDongPayload, type GioHoatDongQuanTri } from '@/dich-vu/quan-tri.api';
import { LoiApi } from '@/dich-vu/http';
import { CanhBaoLoi } from '@/thanh-phan/canh-bao-loi';
import { TieuDeTrang } from '@/thanh-phan/tieu-de-trang';

const TEN_THU: Record<number, string> = {
  1: 'Thứ Hai',
  2: 'Thứ Ba',
  3: 'Thứ Tư',
  4: 'Thứ Năm',
  5: 'Thứ Sáu',
  6: 'Thứ Bảy',
  7: 'Chủ Nhật',
};

export function QuanTriGioHoatDong() {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<GioHoatDongPayload>();
  const [moForm, setMoForm] = useState(false);
  const [dangSua, setDangSua] = useState<GioHoatDongQuanTri | null>(null);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['quan-tri', 'gio-hoat-dong'],
    queryFn: quanTriApi.gioHoatDong,
  });

  const luuMutation = useMutation({
    mutationFn: (duLieu: GioHoatDongPayload) => quanTriApi.capNhatGioHoatDong([duLieu]),
    onSuccess: async () => {
      message.success('Đã lưu ca hoạt động');
      setMoForm(false);
      setDangSua(null);
      await queryClient.invalidateQueries({ queryKey: ['quan-tri', 'gio-hoat-dong'] });
    },
    onError: (e) => message.error(e instanceof LoiApi ? e.message : 'Không lưu được ca hoạt động.'),
  });

  const xoaMutation = useMutation({
    mutationFn: ({ thu, ca }: { thu: number; ca: number }) => quanTriApi.xoaGioHoatDong(thu, ca),
    onSuccess: async () => {
      message.success('Đã xóa ca hoạt động');
      await queryClient.invalidateQueries({ queryKey: ['quan-tri', 'gio-hoat-dong'] });
    },
    onError: (e) => message.error(e instanceof LoiApi ? e.message : 'Không xóa được ca hoạt động.'),
  });

  const moTao = () => {
    setDangSua(null);
    form.resetFields();
    form.setFieldsValue({
      thuTrongTuan: 1,
      caSo: 1,
      gioMoCua: '10:00',
      gioDongCua: '22:00',
      hoatDong: true,
    });
    setMoForm(true);
  };

  const moSua = (row: GioHoatDongQuanTri) => {
    setDangSua(row);
    form.setFieldsValue({
      thuTrongTuan: row.thuTrongTuan,
      caSo: row.caSo,
      gioMoCua: row.gioMoCua,
      gioDongCua: row.gioDongCua,
      hoatDong: row.hoatDong,
      ghiChu: row.ghiChu ?? undefined,
    });
    setMoForm(true);
  };

  return <>
    <TieuDeTrang
      tieuDe="Giờ hoạt động"
      moTa="Khai báo một hoặc nhiều ca phục vụ trong từng ngày. Backend từ chối các ca đang hoạt động bị chồng lấn."
      hanhDong={<Space>
        <Button icon={<ReloadOutlined />} onClick={() => query.refetch()}>Làm mới</Button>
        <Button
          aria-label="Thêm ca"
          type="primary"
          icon={<PlusOutlined />}
          onClick={moTao}
        >
          Thêm ca
        </Button>
      </Space>}
    />
    <CanhBaoLoi loi={query.error} macDinh="Không tải được giờ hoạt động." />
    <Card className="admin-table-card"><Table
        rowKey={(row) => `${row.thuTrongTuan}-${row.caSo}`}
        loading={query.isPending || query.isFetching}
        dataSource={query.data ?? []}
        pagination={false}
        scroll={{ x: 820 }}
        columns={[
          { title: 'Ngày', dataIndex: 'thuTrongTuan', render: (v: number) => TEN_THU[v] ?? `Thứ ${v}` },
          { title: 'Ca', dataIndex: 'caSo', width: 80 },
          { title: 'Mở cửa', dataIndex: 'gioMoCua', width: 110 },
          { title: 'Đóng cửa', dataIndex: 'gioDongCua', width: 110 },
          {
            title: 'Trạng thái',
            dataIndex: 'hoatDong',
            width: 120,
            render: (v: boolean) => v ? <Tag color="green">Hoạt động</Tag> : <Tag>Đã tắt</Tag>,
          },
          { title: 'Ghi chú', dataIndex: 'ghiChu' },
          {
            title: 'Thao tác',
            fixed: 'right',
            width: 155,
            render: (_: unknown, row: GioHoatDongQuanTri) => <Space>
              <Button
                aria-label="Sửa"
                size="small"
                icon={<EditOutlined />}
                onClick={() => moSua(row)}
              >
                Sửa
              </Button>
              <Button
                aria-label={`Xóa ${TEN_THU[row.thuTrongTuan]} ca ${row.caSo}`}
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => modal.confirm({
                  title: 'Xóa ca hoạt động?',
                  content: `${TEN_THU[row.thuTrongTuan]} · ca ${row.caSo} · ${row.gioMoCua}–${row.gioDongCua}`,
                  okText: 'Xóa',
                  cancelText: 'Đóng',
                  okButtonProps: { danger: true },
                  onOk: () => xoaMutation.mutateAsync({ thu: row.thuTrongTuan, ca: row.caSo }),
                })}
              />
            </Space>,
          },
        ]}
      />
    </Card>

    <Modal className="admin-form-modal"
      open={moForm}
      title={dangSua ? 'Sửa ca hoạt động' : 'Thêm ca hoạt động'}
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
      <Form size="middle" form={form} layout="vertical" onFinish={(values) => luuMutation.mutate(values)}>
        <Space className="form-row" align="start" wrap>
          <Form.Item name="thuTrongTuan" label="Ngày trong tuần" rules={[{ required: true }]}>
            <Select
              disabled={Boolean(dangSua)}
              style={{ width: 190 }}
              options={Object.entries(TEN_THU).map(([value, label]) => ({
                value: Number(value),
                label,
              }))}
            />
          </Form.Item>
          <Form.Item name="caSo" label="Số ca" rules={[{ required: true }]}>
            <InputNumber disabled={Boolean(dangSua)} min={1} max={20} />
          </Form.Item>
          <Form.Item name="hoatDong" label="Hoạt động" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Space>
        <Space className="form-row" align="start" wrap>
          <Form.Item name="gioMoCua" label="Giờ mở cửa" rules={[{ required: true }]}>
            <Input type="time" />
          </Form.Item>
          <Form.Item name="gioDongCua" label="Giờ đóng cửa" rules={[{ required: true }]}>
            <Input type="time" />
          </Form.Item>
        </Space>
        <Form.Item name="ghiChu" label="Ghi chú">
          <Input.TextArea rows={3} maxLength={500} showCount />
        </Form.Item>
      </Form>
    </Modal>
  </>;
}
