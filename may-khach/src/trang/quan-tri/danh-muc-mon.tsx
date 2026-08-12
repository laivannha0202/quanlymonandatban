import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Typography,
} from 'antd';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { heThongApi, type DanhMucQuanTri } from '@/dich-vu/he-thong.api';
import { LoiApi } from '@/dich-vu/http';
import { useXacThuc } from '@/ngu-canh/xac-thuc.context';
import { TrangThai } from '@/thanh-phan/trang-thai';
import { TieuDeTrang } from '@/thanh-phan/tieu-de-trang';
import type { TrangThaiHoatDong } from '@/kieu/trang-thai';

type FormData = {
  maDanhMuc: string;
  tenDanhMuc: string;
  duongDan?: string;
  moTa?: string;
  thuTu?: number;
  trangThai?: TrangThaiHoatDong;
};

function boDau(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

function taoSlug(value: string) {
  return boDau(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180);
}

function taoMaDanhMuc(value: string) {
  const than = boDau(value)
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24);

  return than ? `HV_DM_${than}`.slice(0, 30) : '';
}

export function QuanTriDanhMucMon() {
  const { message, modal } = App.useApp();
  const { coQuyen } = useXacThuc();
  const coQuanLy = coQuyen('DANH_MUC_MON_QUAN_LY');
  const queryClient = useQueryClient();
  const [form] = Form.useForm<FormData>();

  const [dangSua, setDangSua] = useState<DanhMucQuanTri | null>(null);
  const [moForm, setMoForm] = useState(false);
  const [tuKhoa, setTuKhoa] = useState('');
  const [trangThai, setTrangThai] = useState<TrangThaiHoatDong | ''>('HOAT_DONG');

  const query = useQuery({
    queryKey: ['quan-tri', 'danh-muc-mon'],
    queryFn: () => heThongApi.danhMucQuanTri(),
  });

  const dsLoc = useMemo(() => {
    const q = boDau(tuKhoa.trim()).toLowerCase();

    return (query.data ?? []).filter((r) => {
      if (trangThai && r.trangThai !== trangThai) return false;
      if (!q) return true;

      const haystack = boDau(`${r.tenDanhMuc} ${r.maDanhMuc}`).toLowerCase();
      return haystack.includes(q);
    });
  }, [query.data, trangThai, tuKhoa]);

  const luuMutation = useMutation({
    mutationFn: ({ id, duLieu }: { id?: string; duLieu: FormData }) => {
      if (id) {
        const { maDanhMuc: _ma, duongDan: _slug, ...capNhat } = duLieu;
        return heThongApi.capNhatDanhMuc(id, capNhat);
      }

      return heThongApi.taoDanhMuc({
        ...duLieu,
        maDanhMuc: duLieu.maDanhMuc.trim(),
        duongDan: duLieu.duongDan?.trim(),
      });
    },
    onSuccess: async (_data, variables) => {
      message.success(variables.id ? 'Đã cập nhật danh mục' : 'Đã tạo danh mục');
      setMoForm(false);
      await queryClient.invalidateQueries({ queryKey: ['quan-tri', 'danh-muc-mon'] });
      await queryClient.invalidateQueries({ queryKey: ['thuc-don'] });
    },
    onError: (e) => {
      message.error(e instanceof LoiApi ? e.message : 'Không lưu được danh mục.');
    },
  });

  const xoaMutation = useMutation({
    mutationFn: heThongApi.xoaDanhMuc,
    onSuccess: async () => {
      message.success('Đã xóa danh mục');
      await queryClient.invalidateQueries({ queryKey: ['quan-tri', 'danh-muc-mon'] });
      await queryClient.invalidateQueries({ queryKey: ['thuc-don'] });
    },
    onError: (e) => {
      message.error(e instanceof LoiApi ? e.message : 'Không xóa được danh mục.');
    },
  });

  const moTao = () => {
    setDangSua(null);
    form.resetFields();
    form.setFieldsValue({
      maDanhMuc: '',
      tenDanhMuc: '',
      duongDan: '',
      thuTu: 0,
      trangThai: 'HOAT_DONG',
    });
    setMoForm(true);
  };

  const moSua = (r: DanhMucQuanTri) => {
    setDangSua(r);
    form.setFieldsValue({
      maDanhMuc: r.maDanhMuc,
      tenDanhMuc: r.tenDanhMuc,
      duongDan: r.duongDan,
      moTa: r.moTa ?? undefined,
      thuTu: r.thuTu,
      trangThai: r.trangThai,
    });
    setMoForm(true);
  };

  return <>
    <TieuDeTrang
      tieuDe="Danh mục món"
      moTa="Sắp xếp các nhóm món hiển thị trên thực đơn. Mã và đường dẫn được hệ thống tạo tự động."
      hanhDong={coQuanLy
        ? <Button type="primary" icon={<PlusOutlined />} onClick={moTao}>Thêm danh mục</Button>
        : undefined}
    />

    <Card className="filter-card admin-filter-card mb-16">
      <Space wrap>
        <Input.Search
          allowClear
          placeholder="Tìm tên danh mục"
          value={tuKhoa}
          onChange={(e) => setTuKhoa(e.target.value)}
          style={{ width: 280 }}
        />

        <Select
          value={trangThai}
          onChange={setTrangThai}
          style={{ width: 190 }}
          options={[
            { value: 'HOAT_DONG', label: 'Đang hoạt động' },
            { value: 'NGUNG_HOAT_DONG', label: 'Ngừng hoạt động' },
            { value: '', label: 'Tất cả trạng thái' },
          ]}
        />

        <Button
          icon={<ReloadOutlined />}
          onClick={() => query.refetch()}
          loading={query.isFetching}
        >
          Làm mới
        </Button>

        <Typography.Text type="secondary">
          {dsLoc.length} danh mục phù hợp
        </Typography.Text>
      </Space>
    </Card>

    {query.error ? (
      <Alert
        type="error"
        showIcon
        message={query.error instanceof LoiApi ? query.error.message : 'Không tải được danh mục.'}
        className="mb-16"
      />
    ) : null}

    <Card className="admin-table-card">
      <Table
        rowKey="id"
        loading={query.isPending}
        dataSource={dsLoc}
        pagination={false}
        scroll={{ x: 820 }}
        columns={[
          {
            title: 'Danh mục',
            dataIndex: 'tenDanhMuc',
            render: (v: string, r: DanhMucQuanTri) => (
              <div>
                <strong>{v}</strong>
                <div className="admin-muted-code">{r.maDanhMuc}</div>
              </div>
            ),
          },
          { title: 'Số món', dataIndex: 'soMon', width: 110 },
          { title: 'Thứ tự', dataIndex: 'thuTu', width: 100 },
          {
            title: 'Trạng thái',
            dataIndex: 'trangThai',
            width: 150,
            render: (v: string) => <TrangThai value={v} />,
          },
          {
            title: 'Thao tác',
            fixed: 'right' as const,
            width: 150,
            render: (_: unknown, r: DanhMucQuanTri) => coQuanLy ? (
              <Space>
                <Button
                  aria-label={`Sửa danh mục ${r.tenDanhMuc}`}
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => moSua(r)}
                />
                <Button
                  aria-label={`Xóa danh mục ${r.tenDanhMuc}`}
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => modal.confirm({
                    title: 'Xóa danh mục?',
                    content: `Danh mục “${r.tenDanhMuc}” chỉ nên xóa khi không còn món đang sử dụng.`,
                    okText: 'Xóa',
                    cancelText: 'Đóng',
                    okButtonProps: { danger: true },
                    onOk: () => xoaMutation.mutateAsync(r.id),
                  })}
                />
              </Space>
            ) : '—',
          },
        ]}
      />
    </Card>

    <Modal
      className="admin-form-modal admin-category-modal"
      open={moForm}
      title={dangSua ? 'Sửa danh mục' : 'Thêm danh mục'}
      okText="Lưu"
      cancelText="Đóng"
      confirmLoading={luuMutation.isPending}
      onCancel={() => setMoForm(false)}
      onOk={() => form.submit()}
      destroyOnHidden
    >
      <Form
        size="middle"
        form={form}
        layout="vertical"
        onValuesChange={(changed) => {
          if (!dangSua && typeof changed.tenDanhMuc === 'string') {
            const ten = changed.tenDanhMuc;
            form.setFieldsValue({
              maDanhMuc: taoMaDanhMuc(ten),
              duongDan: taoSlug(ten),
            });
          }
        }}
        onFinish={(v) => luuMutation.mutate({ id: dangSua?.id, duLieu: v })}
      >
        <Form.Item
          name="tenDanhMuc"
          label="Tên danh mục"
          rules={[{ required: true, message: 'Nhập tên danh mục' }]}
        >
          <Input maxLength={150} placeholder="Ví dụ: Món nướng" />
        </Form.Item>

        <Form.Item
          name="maDanhMuc"
          label="Mã danh mục"
          rules={[{ required: true, message: 'Mã danh mục chưa được tạo' }]}
          extra={dangSua
            ? 'Mã được giữ cố định sau khi tạo để tránh thay đổi định danh.'
            : 'Mã được tạo tự động từ tên danh mục, không cần nhập thủ công.'}
        >
          <Input maxLength={30} readOnly />
        </Form.Item>

        <Form.Item
          name="duongDan"
          label="Đường dẫn"
          extra={dangSua
            ? 'Đường dẫn được giữ ổn định để không làm hỏng liên kết trên website.'
            : 'Được tạo tự động từ tên danh mục.'}
        >
          <Input maxLength={200} readOnly />
        </Form.Item>

        <Form.Item name="moTa" label="Mô tả">
          <Input.TextArea
            rows={3}
            maxLength={2000}
            showCount
            placeholder="Mô tả ngắn để nhân viên dễ nhận biết nhóm món."
          />
        </Form.Item>

        <Space className="form-row" align="start" wrap>
          <Form.Item
            name="thuTu"
            label="Thứ tự hiển thị"
            extra="Số nhỏ hiển thị trước."
          >
            <InputNumber min={0} style={{ width: 150 }} />
          </Form.Item>

          <Form.Item name="trangThai" label="Trạng thái">
            <Select
              style={{ width: 190 }}
              options={[
                { value: 'HOAT_DONG', label: 'Hoạt động' },
                { value: 'NGUNG_HOAT_DONG', label: 'Ngừng hoạt động' },
              ]}
            />
          </Form.Item>
        </Space>
      </Form>
    </Modal>
  </>;
}
