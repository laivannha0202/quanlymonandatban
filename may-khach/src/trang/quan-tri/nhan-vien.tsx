import { EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { App, Button, Card, Form, Input, Modal, Select, Space, Table } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { heThongApi } from '@/dich-vu/he-thong.api';
import {
  quanTriApi,
  type CapNhatNhanVienPayload,
  type NhanVienQuanTri,
  type TaoNhanVienPayload,
} from '@/dich-vu/quan-tri.api';
import { LoiApi } from '@/dich-vu/http';
import { useXacThuc } from '@/ngu-canh/xac-thuc.context';
import { CanhBaoLoi } from '@/thanh-phan/canh-bao-loi';
import { TieuDeTrang } from '@/thanh-phan/tieu-de-trang';
import { TrangThai } from '@/thanh-phan/trang-thai';

type FormNhanVien = {
  maNhanVien?: string;
  hoTen: string;
  email: string;
  tenDangNhap?: string;
  matKhau?: string;
  matKhauMoi?: string;
  maVaiTro?: string;
  soDienThoai?: string;
  ngayVaoLam?: string;
  ghiChu?: string;
  trangThai?: 'HOAT_DONG' | 'TAM_NGHI' | 'DA_NGHI';
};

export function QuanTriNhanVien() {
  const { message } = App.useApp();
  const { nguoiDung } = useXacThuc();
  const [form] = Form.useForm<FormNhanVien>();
  const [dangSua, setDangSua] = useState<NhanVienQuanTri | null>(null);
  const [moForm, setMoForm] = useState(false);
  const [tuKhoa, setTuKhoa] = useState('');
  const [trangThai, setTrangThai] = useState<string>();
  const [maVaiTro, setMaVaiTro] = useState<string>();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['quan-tri', 'nhan-vien', tuKhoa, trangThai, maVaiTro],
    queryFn: () => quanTriApi.nhanVien({
      tuKhoa: tuKhoa || undefined,
      trangThai,
      maVaiTro,
    }),
  });

  const vaiTroQuery = useQuery({
    queryKey: ['quan-tri', 'vai-tro', 'cho-nhan-vien'],
    queryFn: heThongApi.vaiTro,
  });

  const vaiTroOptions = (vaiTroQuery.data ?? [])
    .filter((item) => item.maVaiTro !== 'KHACH_HANG' && item.trangThai === 'HOAT_DONG')
    .map((item) => ({
      value: item.maVaiTro,
      label: item.tenVaiTro,
    }));

  const luuMutation = useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: FormNhanVien }) => {
      if (id) {
        const payload: CapNhatNhanVienPayload = {
          hoTen: values.hoTen,
          email: values.email,
          maVaiTro: values.maVaiTro,
          soDienThoai: values.soDienThoai,
          ngayVaoLam: values.ngayVaoLam,
          ghiChu: values.ghiChu,
          matKhauMoi: values.matKhauMoi || undefined,
        };
        return quanTriApi.capNhatNhanVien(id, payload);
      }

      if (!values.maNhanVien || !values.matKhau) {
        throw new Error('Thiếu mã nhân viên hoặc mật khẩu.');
      }

      const payload: TaoNhanVienPayload = {
        maNhanVien: values.maNhanVien,
        hoTen: values.hoTen,
        email: values.email,
        tenDangNhap: values.tenDangNhap,
        matKhau: values.matKhau,
        maVaiTro: values.maVaiTro,
        soDienThoai: values.soDienThoai,
        ngayVaoLam: values.ngayVaoLam,
        ghiChu: values.ghiChu,
        trangThai: values.trangThai,
      };
      return quanTriApi.taoNhanVien(payload);
    },
    onSuccess: async () => {
      message.success('Đã lưu nhân viên');
      setMoForm(false);
      setDangSua(null);
      await queryClient.invalidateQueries({ queryKey: ['quan-tri', 'nhan-vien'] });
    },
    onError: (e) => message.error(
      e instanceof LoiApi
        ? e.message
        : e instanceof Error
          ? e.message
          : 'Không lưu được nhân viên.',
    ),
  });

  const trangThaiMutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: 'HOAT_DONG' | 'TAM_NGHI' | 'DA_NGHI' }) =>
      quanTriApi.capNhatTrangThaiNhanVien(id, value),
    onSuccess: async () => {
      message.success('Đã cập nhật trạng thái nhân viên');
      await queryClient.invalidateQueries({ queryKey: ['quan-tri', 'nhan-vien'] });
    },
    onError: (e) => message.error(e instanceof LoiApi ? e.message : 'Không cập nhật được trạng thái.'),
  });

  const moTao = () => {
    setDangSua(null);
    form.resetFields();
    form.setFieldsValue({
      maVaiTro: 'NHAN_VIEN',
      trangThai: 'HOAT_DONG',
    });
    setMoForm(true);
  };

  const moSua = (row: NhanVienQuanTri) => {
    setDangSua(row);
    form.setFieldsValue({
      maNhanVien: row.maNhanVien,
      hoTen: row.hoTen,
      email: row.emailTaiKhoan || row.email || '',
      tenDangNhap: row.tenDangNhap ?? undefined,
      maVaiTro: row.maVaiTro,
      soDienThoai: row.soDienThoai ?? undefined,
      ngayVaoLam: row.ngayVaoLam ?? undefined,
      ghiChu: row.ghiChu ?? undefined,
      matKhauMoi: undefined,
    });
    setMoForm(true);
  };

  const dangSuaBanThan = Boolean(
    dangSua?.taiKhoanId &&
    dangSua.taiKhoanId === nguoiDung?.id,
  );

  return <>
    <TieuDeTrang
      tieuDe="Nhân viên"
      moTa="Tạo tài khoản nhân sự, cập nhật hồ sơ, vai trò, mật khẩu và trạng thái làm việc."
      hanhDong={<Space>
        <Button icon={<ReloadOutlined />} onClick={() => query.refetch()}>Làm mới</Button>
        <Button
          aria-label="Thêm nhân viên"
          type="primary"
          icon={<PlusOutlined />}
          onClick={moTao}
        >
          Thêm nhân viên
        </Button>
      </Space>}
    />

    <Card className="filter-card mb-16">
      <Space wrap>
        <Input.Search
          allowClear
          placeholder="Mã / tên / SĐT / email"
          onSearch={setTuKhoa}
          style={{ width: 290 }}
        />
        <Select
          allowClear
          placeholder="Vai trò"
          style={{ width: 190 }}
          value={maVaiTro}
          onChange={setMaVaiTro}
          options={vaiTroOptions}
        />
        <Select
          allowClear
          placeholder="Trạng thái"
          style={{ width: 190 }}
          value={trangThai}
          onChange={setTrangThai}
          options={[
            { value: 'HOAT_DONG', label: 'Hoạt động' },
            { value: 'TAM_NGHI', label: 'Tạm nghỉ' },
            { value: 'DA_NGHI', label: 'Đã nghỉ' },
          ]}
        />
      </Space>
    </Card>

    <CanhBaoLoi loi={query.error || vaiTroQuery.error} macDinh="Không tải được nhân viên." />
    <Card>
      <Table
        rowKey="id"
        loading={query.isPending || query.isFetching}
        dataSource={query.data?.danhSach ?? []}
        pagination={{ pageSize: 20, showSizeChanger: false }}
        scroll={{ x: 1150 }}
        columns={[
          { title: 'Mã', dataIndex: 'maNhanVien', width: 120 },
          { title: 'Họ tên', dataIndex: 'hoTen', width: 180 },
          {
            title: 'Email',
            dataIndex: 'emailTaiKhoan',
            width: 220,
            render: (v: string | undefined, row: NhanVienQuanTri) => v || row.email || '—',
          },
          { title: 'SĐT', dataIndex: 'soDienThoai', width: 130 },
          {
            title: 'Vai trò',
            dataIndex: 'tenVaiTro',
            width: 160,
            render: (v: string | undefined, row: NhanVienQuanTri) => v || row.maVaiTro || '—',
          },
          { title: 'Trạng thái', dataIndex: 'trangThai', width: 135, render: (v: string) => <TrangThai value={v} /> },
          {
            title: 'Thao tác',
            fixed: 'right',
            width: 250,
            render: (_: unknown, row: NhanVienQuanTri) => {
              const laBanThan = row.taiKhoanId === nguoiDung?.id;
              return <Space>
                <Button
                  aria-label="Sửa"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => moSua(row)}
                >
                  Sửa
                </Button>
                <Select
                  size="small"
                  aria-label={`Trạng thái ${row.hoTen}`}
                  disabled={laBanThan}
                  value={row.trangThai}
                  style={{ width: 135 }}
                  loading={trangThaiMutation.isPending}
                  onChange={(value: 'HOAT_DONG' | 'TAM_NGHI' | 'DA_NGHI') =>
                    trangThaiMutation.mutate({ id: row.id, value })
                  }
                  options={[
                    { value: 'HOAT_DONG', label: 'Hoạt động' },
                    { value: 'TAM_NGHI', label: 'Tạm nghỉ' },
                    { value: 'DA_NGHI', label: 'Đã nghỉ' },
                  ]}
                />
              </Space>;
            },
          },
        ]}
      />
    </Card>

    <Modal
      open={moForm}
      width={720}
      title={dangSua ? 'Sửa nhân viên' : 'Thêm nhân viên'}
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
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => luuMutation.mutate({ id: dangSua?.id, values })}
      >
        <Space className="form-row" align="start" wrap>
          <Form.Item
            name="maNhanVien"
            label="Mã nhân viên"
            rules={[{ required: !dangSua, message: 'Nhập mã nhân viên' }]}
          >
            <Input disabled={Boolean(dangSua)} maxLength={30} />
          </Form.Item>
          <Form.Item name="hoTen" label="Họ tên" rules={[{ required: true, message: 'Nhập họ tên' }]}>
            <Input maxLength={150} />
          </Form.Item>
        </Space>

        <Form.Item name="email" label="Email" rules={[
          { required: true, message: 'Nhập email' },
          { type: 'email', message: 'Email không hợp lệ' },
        ]}>
          <Input maxLength={255} />
        </Form.Item>

        {!dangSua && <>
          <Form.Item name="tenDangNhap" label="Tên đăng nhập">
            <Input maxLength={100} placeholder="Bỏ trống để dùng email" />
          </Form.Item>
          <Form.Item name="matKhau" label="Mật khẩu ban đầu" rules={[
            { required: true, message: 'Nhập mật khẩu' },
            { min: 8, message: 'Mật khẩu tối thiểu 8 ký tự' },
          ]}>
            <Input.Password maxLength={200} />
          </Form.Item>
        </>}

        {dangSua && <Form.Item name="matKhauMoi" label="Đặt lại mật khẩu" rules={[
          { min: 8, message: 'Mật khẩu tối thiểu 8 ký tự' },
        ]}>
          <Input.Password maxLength={200} placeholder="Bỏ trống nếu không đổi" />
        </Form.Item>}

        <Space className="form-row" align="start" wrap>
          <Form.Item name="maVaiTro" label="Vai trò" rules={[{ required: true, message: 'Chọn vai trò' }]}>
            <Select
              disabled={dangSuaBanThan}
              style={{ width: 190 }}
              options={vaiTroOptions}
            />
          </Form.Item>
          <Form.Item name="soDienThoai" label="Số điện thoại">
            <Input maxLength={30} />
          </Form.Item>
          <Form.Item name="ngayVaoLam" label="Ngày vào làm">
            <Input type="date" />
          </Form.Item>
        </Space>

        {!dangSua && <Form.Item name="trangThai" label="Trạng thái">
          <Select
            style={{ width: 190 }}
            options={[
              { value: 'HOAT_DONG', label: 'Hoạt động' },
              { value: 'TAM_NGHI', label: 'Tạm nghỉ' },
              { value: 'DA_NGHI', label: 'Đã nghỉ' },
            ]}
          />
        </Form.Item>}

        <Form.Item name="ghiChu" label="Ghi chú">
          <Input.TextArea rows={4} maxLength={2000} showCount />
        </Form.Item>
      </Form>
    </Modal>
  </>;
}
