import { EditOutlined, ReloadOutlined } from '@ant-design/icons';
import { App, Button, Card, Form, Input, Modal, Select, Space, Table } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { quanTriApi, type KhachHangPayload, type KhachHangQuanTri } from '@/dich-vu/quan-tri.api';
import { LoiApi } from '@/dich-vu/http';
import { useXacThuc } from '@/ngu-canh/xac-thuc.context';
import { CanhBaoLoi } from '@/thanh-phan/canh-bao-loi';
import { TieuDeTrang } from '@/thanh-phan/tieu-de-trang';
import { TrangThai } from '@/thanh-phan/trang-thai';

export function QuanTriKhachHang() {
  const { message } = App.useApp();
  const { coQuyen } = useXacThuc();
  const coSua = coQuyen('KHACH_HANG_SUA');
  const coKhoa = coQuyen('KHACH_HANG_KHOA');
  const [form] = Form.useForm<KhachHangPayload>();
  const [dangSua, setDangSua] = useState<KhachHangQuanTri | null>(null);
  const [tuKhoa, setTuKhoa] = useState('');
  const [trangThai, setTrangThai] = useState<string>();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['quan-tri', 'khach-hang', tuKhoa, trangThai],
    queryFn: () => quanTriApi.khachHang({
      tuKhoa: tuKhoa || undefined,
      trangThai,
    }),
  });

  const suaMutation = useMutation({
    mutationFn: ({ id, duLieu }: { id: string; duLieu: KhachHangPayload }) =>
      quanTriApi.capNhatKhachHang(id, duLieu),
    onSuccess: async () => {
      message.success('Đã cập nhật khách hàng');
      setDangSua(null);
      await queryClient.invalidateQueries({ queryKey: ['quan-tri', 'khach-hang'] });
    },
    onError: (e) => message.error(e instanceof LoiApi ? e.message : 'Không cập nhật được khách hàng.'),
  });

  const trangThaiMutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: 'HOAT_DONG' | 'BI_KHOA' | 'NGUNG_HOAT_DONG' }) =>
      quanTriApi.capNhatTrangThaiKhachHang(id, value),
    onSuccess: async () => {
      message.success('Đã cập nhật trạng thái khách hàng');
      await queryClient.invalidateQueries({ queryKey: ['quan-tri', 'khach-hang'] });
    },
    onError: (e) => message.error(e instanceof LoiApi ? e.message : 'Không cập nhật được trạng thái.'),
  });

  const moSua = (row: KhachHangQuanTri) => {
    setDangSua(row);
    form.setFieldsValue({
      hoTen: row.hoTen,
      soDienThoai: row.soDienThoai,
      email: row.email ?? undefined,
      ngaySinh: row.ngaySinh ?? undefined,
      gioiTinh: row.gioiTinh ?? undefined,
      ghiChu: row.ghiChu ?? undefined,
    });
  };

  return <>
    <TieuDeTrang
      tieuDe="Khách hàng"
      moTa="Tìm kiếm, cập nhật hồ sơ và khóa/mở khóa khách hàng; theo dõi thống kê đặt bàn tích lũy."
      hanhDong={<Button icon={<ReloadOutlined />} onClick={() => query.refetch()}>Làm mới</Button>}
    />

    <Card className="filter-card admin-filter-card mb-16">
      <Space wrap>
        <Input.Search
          allowClear
          placeholder="Tên / SĐT / email / mã khách"
          onSearch={setTuKhoa}
          style={{ width: 310 }}
        />
        <Select
          allowClear
          placeholder="Trạng thái"
          style={{ width: 190 }}
          value={trangThai}
          onChange={setTrangThai}
          options={[
            { value: 'HOAT_DONG', label: 'Hoạt động' },
            { value: 'BI_KHOA', label: 'Bị khóa' },
            { value: 'NGUNG_HOAT_DONG', label: 'Ngừng hoạt động' },
          ]}
        />
      </Space>
    </Card>

    <CanhBaoLoi loi={query.error} macDinh="Không tải được khách hàng." />
    <Card className="admin-table-card"><Table
        rowKey="id"
        loading={query.isPending || query.isFetching}
        dataSource={query.data?.danhSach ?? []}
        pagination={{ pageSize: 20, showSizeChanger: false }}
        scroll={{ x: 1260 }}
        columns={[
          { title: 'Mã', dataIndex: 'maKhachHang', width: 120, render: (v: string | null) => v || '—' },
          { title: 'Họ tên', dataIndex: 'hoTen', width: 180 },
          { title: 'Số điện thoại', dataIndex: 'soDienThoai', width: 135 },
          { title: 'Email', dataIndex: 'email', width: 220 },
          { title: 'Tổng đặt', dataIndex: 'tongDatBan', width: 90 },
          { title: 'Hoàn thành', dataIndex: 'tongHoanThanh', width: 100 },
          { title: 'Hủy', dataIndex: 'tongHuy', width: 70 },
          { title: 'Không đến', dataIndex: 'tongKhongDen', width: 95 },
          { title: 'Trạng thái', dataIndex: 'trangThai', width: 145, render: (v: string) => <TrangThai value={v} /> },
          {
            title: 'Thao tác',
            fixed: 'right',
            width: 250,
            render: (_: unknown, row: KhachHangQuanTri) => (coSua || coKhoa) ? <Space>
              {coSua ? <Button aria-label={`Sửa khách hàng ${row.hoTen}`} size="small" icon={<EditOutlined />} onClick={() => moSua(row)}>Sửa</Button> : null}
              {coKhoa ? <Select
                size="small"
                aria-label={`Trạng thái ${row.hoTen}`}
                value={row.trangThai}
                style={{ width: 150 }}
                loading={trangThaiMutation.isPending}
                onChange={(value: 'HOAT_DONG' | 'BI_KHOA' | 'NGUNG_HOAT_DONG') =>
                  trangThaiMutation.mutate({ id: row.id, value })
                }
                options={[
                  { value: 'HOAT_DONG', label: 'Hoạt động' },
                  { value: 'BI_KHOA', label: 'Khóa' },
                  { value: 'NGUNG_HOAT_DONG', label: 'Ngừng' },
                ]}
              /> : null}
            </Space> : '—',
          },
        ]}
      />
    </Card>

    <Modal className="admin-form-modal"
      open={Boolean(dangSua)}
      title="Sửa khách hàng"
      okText="Lưu"
      cancelText="Đóng"
      confirmLoading={suaMutation.isPending}
      onCancel={() => setDangSua(null)}
      onOk={() => form.submit()}
      destroyOnHidden
    >
      <Form size="middle"
        form={form}
        layout="vertical"
        onFinish={(duLieu) => {
          if (dangSua) suaMutation.mutate({ id: dangSua.id, duLieu });
        }}
      >
        <Form.Item name="hoTen" label="Họ tên" rules={[{ required: true, message: 'Nhập họ tên' }]}>
          <Input maxLength={150} />
        </Form.Item>
        <Form.Item name="soDienThoai" label="Số điện thoại" rules={[{ required: true, message: 'Nhập số điện thoại' }]}>
          <Input maxLength={30} />
        </Form.Item>
        <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Email không hợp lệ' }]}>
          <Input maxLength={255} />
        </Form.Item>
        <Space className="form-row" align="start" wrap>
          <Form.Item name="ngaySinh" label="Ngày sinh">
            <Input type="date" />
          </Form.Item>
          <Form.Item name="gioiTinh" label="Giới tính">
            <Select
              allowClear
              style={{ width: 160 }}
              options={[
                { value: 'NAM', label: 'Nam' },
                { value: 'NU', label: 'Nữ' },
                { value: 'KHAC', label: 'Khác' },
              ]}
            />
          </Form.Item>
        </Space>
        <Form.Item name="ghiChu" label="Ghi chú">
          <Input.TextArea rows={4} maxLength={2000} showCount />
        </Form.Item>
      </Form>
    </Modal>
  </>;
}
