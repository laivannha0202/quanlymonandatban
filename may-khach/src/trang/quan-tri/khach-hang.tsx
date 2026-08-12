import {
  DownOutlined,
  EditOutlined,
  LockOutlined,
  ReloadOutlined,
  StopOutlined,
  UnlockOutlined,
} from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  Dropdown,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tooltip,
  Typography,
} from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  quanTriApi,
  type KhachHangPayload,
  type KhachHangQuanTri,
} from '@/dich-vu/quan-tri.api';
import { LoiApi } from '@/dich-vu/http';
import { useXacThuc } from '@/ngu-canh/xac-thuc.context';
import { CanhBaoLoi } from '@/thanh-phan/canh-bao-loi';
import { TieuDeTrang } from '@/thanh-phan/tieu-de-trang';
import { TrangThai } from '@/thanh-phan/trang-thai';

type TrangThaiKhachHang = 'HOAT_DONG' | 'BI_KHOA' | 'NGUNG_HOAT_DONG';

const nhanTrangThai: Record<TrangThaiKhachHang, string> = {
  HOAT_DONG: 'Hoạt động',
  BI_KHOA: 'Bị khóa',
  NGUNG_HOAT_DONG: 'Ngừng hoạt động',
};

export function QuanTriKhachHang() {
  const { message, modal } = App.useApp();
  const { coQuyen } = useXacThuc();
  const coSua = coQuyen('KHACH_HANG_SUA');
  const coKhoa = coQuyen('KHACH_HANG_KHOA');
  const [form] = Form.useForm<KhachHangPayload>();
  const [dangSua, setDangSua] = useState<KhachHangQuanTri | null>(null);
  const [tuKhoaNhap, setTuKhoaNhap] = useState('');
  const [tuKhoa, setTuKhoa] = useState('');
  const [trangThai, setTrangThai] = useState<TrangThaiKhachHang>();
  const [trang, setTrang] = useState(1);
  const kichThuoc = 20;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['quan-tri', 'khach-hang', tuKhoa, trangThai, trang, kichThuoc],
    queryFn: () =>
      quanTriApi.khachHang({
        tuKhoa: tuKhoa || undefined,
        trangThai,
        trang,
        kichThuoc,
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
    onError: (e) =>
      message.error(e instanceof LoiApi ? e.message : 'Không cập nhật được khách hàng.'),
  });

  const trangThaiMutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: TrangThaiKhachHang }) =>
      quanTriApi.capNhatTrangThaiKhachHang(id, value),
    onSuccess: async (_data, variables) => {
      message.success(`Đã chuyển khách hàng sang "${nhanTrangThai[variables.value]}"`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['quan-tri', 'khach-hang'] }),
        queryClient.invalidateQueries({ queryKey: ['quan-tri', 'dashboard'] }),
      ]);
    },
    onError: (e) =>
      message.error(e instanceof LoiApi ? e.message : 'Không cập nhật được trạng thái.'),
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

  const timKiem = (value: string) => {
    setTrang(1);
    setTuKhoa(value.trim());
  };

  const doiTrangThaiLoc = (value?: TrangThaiKhachHang) => {
    setTrang(1);
    setTrangThai(value);
  };

  const xacNhanTrangThai = (row: KhachHangQuanTri, value: TrangThaiKhachHang) => {
    const dangKhoa = value === 'BI_KHOA';
    const dangNgung = value === 'NGUNG_HOAT_DONG';

    modal.confirm({
      title: dangKhoa
        ? `Khóa khách hàng ${row.hoTen}?`
        : dangNgung
          ? `Ngừng hoạt động khách hàng ${row.hoTen}?`
          : `Kích hoạt lại khách hàng ${row.hoTen}?`,
      content: dangKhoa
        ? 'Khách sẽ không thể tạo đặt bàn mới bằng hồ sơ này cho đến khi được mở khóa.'
        : dangNgung
          ? 'Tài khoản liên kết (nếu có) sẽ bị ngừng hoạt động và phiên đăng nhập hiện tại sẽ bị thu hồi.'
          : 'Khách hàng và tài khoản liên kết (nếu có) sẽ được hoạt động trở lại.',
      okText: dangKhoa ? 'Khóa khách' : dangNgung ? 'Ngừng hoạt động' : 'Kích hoạt',
      cancelText: 'Giữ nguyên',
      okButtonProps: dangKhoa || dangNgung ? { danger: true } : undefined,
      onOk: () => trangThaiMutation.mutateAsync({ id: row.id, value }),
    });
  };

  const menuTrangThai = (row: KhachHangQuanTri) => {
    const items = [];

    if (row.trangThai !== 'HOAT_DONG') {
      items.push({
        key: 'HOAT_DONG',
        icon: <UnlockOutlined />,
        label: row.trangThai === 'BI_KHOA' ? 'Mở khóa' : 'Kích hoạt lại',
      });
    }

    if (row.trangThai !== 'BI_KHOA') {
      items.push({
        key: 'BI_KHOA',
        icon: <LockOutlined />,
        label: 'Khóa tạm thời',
        danger: true,
      });
    }

    if (row.trangThai !== 'NGUNG_HOAT_DONG') {
      items.push({
        key: 'NGUNG_HOAT_DONG',
        icon: <StopOutlined />,
        label: 'Ngừng hoạt động',
        danger: true,
      });
    }

    return {
      items,
      onClick: ({ key }: { key: string }) =>
        xacNhanTrangThai(row, key as TrangThaiKhachHang),
    };
  };

  const danhSach = query.data?.danhSach ?? [];
  const phanTrang = query.data?.phanTrang;

  return (
    <>
      <TieuDeTrang
        tieuDe="Khách hàng"
        moTa="Tìm kiếm, cập nhật hồ sơ và quản lý trạng thái khách hàng; theo dõi lịch sử đặt bàn tích lũy."
        hanhDong={
          <Button
            icon={<ReloadOutlined />}
            loading={query.isFetching}
            onClick={() => void query.refetch()}
          >
            Làm mới
          </Button>
        }
      />

      <Card className="filter-card admin-filter-card mb-16">
        <Space wrap>
          <Input.Search
            allowClear
            value={tuKhoaNhap}
            placeholder="Tên / SĐT / email / mã khách"
            onChange={(e) => {
              const value = e.target.value;
              setTuKhoaNhap(value);
              if (!value) timKiem('');
            }}
            onSearch={timKiem}
            style={{ width: 330 }}
          />

          <Select<TrangThaiKhachHang>
            allowClear
            placeholder="Trạng thái"
            style={{ width: 190 }}
            value={trangThai}
            onChange={doiTrangThaiLoc}
            options={[
              { value: 'HOAT_DONG', label: 'Hoạt động' },
              { value: 'BI_KHOA', label: 'Bị khóa' },
              { value: 'NGUNG_HOAT_DONG', label: 'Ngừng hoạt động' },
            ]}
          />
        </Space>
      </Card>

      <CanhBaoLoi loi={query.error} macDinh="Không tải được khách hàng." />

      <Card className="admin-table-card">
        <Table
          rowKey="id"
          sticky
          loading={query.isPending || query.isFetching}
          dataSource={danhSach}
          scroll={{ x: 1280 }}
          pagination={{
            current: phanTrang?.trang ?? trang,
            pageSize: phanTrang?.kichThuoc ?? kichThuoc,
            total: phanTrang?.tong ?? danhSach.length,
            showSizeChanger: false,
            showTotal: (total) => `${total} khách hàng`,
          }}
          onChange={(p) => setTrang(p.current ?? 1)}
          columns={[
            {
              title: 'Mã',
              dataIndex: 'maKhachHang',
              width: 120,
              fixed: 'left',
              render: (v: string | null) => <strong>{v || '—'}</strong>,
            },
            {
              title: 'Họ tên',
              dataIndex: 'hoTen',
              width: 185,
              ellipsis: true,
            },
            {
              title: 'Số điện thoại',
              dataIndex: 'soDienThoai',
              width: 135,
            },
            {
              title: 'Email',
              dataIndex: 'email',
              width: 230,
              render: (v: string | null, row: KhachHangQuanTri) => {
                const email = v || row.emailTaiKhoan || '—';
                if (email === '—') return email;
                return (
                  <Tooltip title={email}>
                    <Typography.Text
                      ellipsis
                      style={{ display: 'block', maxWidth: 210 }}
                    >
                      {email}
                    </Typography.Text>
                  </Tooltip>
                );
              },
            },
            {
              title: 'Tổng đặt',
              dataIndex: 'tongDatBan',
              width: 90,
              align: 'center',
              render: (v?: number) => Number(v ?? 0),
            },
            {
              title: 'Hoàn thành',
              dataIndex: 'tongHoanThanh',
              width: 100,
              align: 'center',
              render: (v?: number) => Number(v ?? 0),
            },
            {
              title: 'Hủy',
              dataIndex: 'tongHuy',
              width: 70,
              align: 'center',
              render: (v?: number) => Number(v ?? 0),
            },
            {
              title: 'Không đến',
              dataIndex: 'tongKhongDen',
              width: 95,
              align: 'center',
              render: (v?: number) => Number(v ?? 0),
            },
            {
              title: 'Trạng thái',
              dataIndex: 'trangThai',
              width: 150,
              render: (v: string) => <TrangThai value={v} />,
            },
            {
              title: 'Thao tác',
              fixed: 'right',
              width: 205,
              render: (_: unknown, row: KhachHangQuanTri) =>
                coSua || coKhoa ? (
                  <Space>
                    {coSua ? (
                      <Button
                        aria-label={`Sửa khách hàng ${row.hoTen}`}
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => moSua(row)}
                      >
                        Sửa
                      </Button>
                    ) : null}

                    {coKhoa ? (
                      <Dropdown
                        trigger={['click']}
                        menu={menuTrangThai(row)}
                        disabled={trangThaiMutation.isPending}
                      >
                        <Button
                          size="small"
                          loading={trangThaiMutation.isPending}
                        >
                          Trạng thái <DownOutlined />
                        </Button>
                      </Dropdown>
                    ) : null}
                  </Space>
                ) : (
                  '—'
                ),
            },
          ]}
        />
      </Card>

      <Modal
        className="admin-form-modal"
        open={Boolean(dangSua)}
        title={dangSua ? `Sửa khách hàng ${dangSua.maKhachHang || ''}`.trim() : 'Sửa khách hàng'}
        okText="Lưu"
        cancelText="Đóng"
        confirmLoading={suaMutation.isPending}
        onCancel={() => setDangSua(null)}
        onOk={() => form.submit()}
        destroyOnHidden
      >
        <Form
          size="middle"
          form={form}
          layout="vertical"
          onFinish={(duLieu) => {
            if (dangSua) suaMutation.mutate({ id: dangSua.id, duLieu });
          }}
        >
          <Form.Item
            name="hoTen"
            label="Họ tên"
            rules={[{ required: true, message: 'Nhập họ tên' }]}
          >
            <Input maxLength={150} />
          </Form.Item>

          <Form.Item
            name="soDienThoai"
            label="Số điện thoại"
            rules={[{ required: true, message: 'Nhập số điện thoại' }]}
          >
            <Input maxLength={30} />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[{ type: 'email', message: 'Email không hợp lệ' }]}
          >
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
    </>
  );
}
