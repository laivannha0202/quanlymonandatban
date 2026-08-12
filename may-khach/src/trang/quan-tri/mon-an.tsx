import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PictureOutlined,
  PlusOutlined,
  ReloadOutlined,
  StarFilled,
  UploadOutlined,
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
  Typography,
  Upload,
} from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { heThongApi } from '@/dich-vu/he-thong.api';
import { LoiApi } from '@/dich-vu/http';
import { quanTriApi, type HinhAnhMonPayload, type MonAnPayload } from '@/dich-vu/quan-tri.api';
import type { HinhAnhMon, MonAn } from '@/kieu/nghiep-vu';
import { dinhDangTien } from '@/cau-hinh/dinh-dang';
import { useXacThuc } from '@/ngu-canh/xac-thuc.context';
import { CanhBaoLoi } from '@/thanh-phan/canh-bao-loi';
import { TieuDeTrang } from '@/thanh-phan/tieu-de-trang';
import { TrangThai } from '@/thanh-phan/trang-thai';

type FormMon = MonAnPayload;
type FormHinh = Omit<HinhAnhMonPayload, 'duongDanAnh'>;

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
    .slice(0, 200);
}

function taoMaMon(value: string) {
  const than = boDau(value)
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 23);

  return than ? `HV_MON_${than}`.slice(0, 30) : '';
}

function fileHopLe(file: File, message: ReturnType<typeof App.useApp>['message']) {
  const hopLe = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
  if (!hopLe) {
    message.error('Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP.');
    return false;
  }

  if (file.size > 5 * 1024 * 1024) {
    message.error('Ảnh tối đa 5 MB.');
    return false;
  }

  return true;
}

export function QuanTriMonAn() {
  const { message, modal } = App.useApp();
  const { coQuyen } = useXacThuc();
  const coQuanLy = coQuyen('MON_AN_QUAN_LY');
  const qc = useQueryClient();

  const [form] = Form.useForm<FormMon>();
  const [formHinh] = Form.useForm<FormHinh>();

  const [dangSua, setDangSua] = useState<MonAn | null>(null);
  const [moForm, setMoForm] = useState(false);
  const [monAnhId, setMonAnhId] = useState<string | null>(null);
  const [moThemHinh, setMoThemHinh] = useState(false);

  const [anhChinhFile, setAnhChinhFile] = useState<File | null>(null);
  const [anhPhuFile, setAnhPhuFile] = useState<File | null>(null);

  const [tuKhoa, setTuKhoa] = useState('');
  const [danhMucId, setDanhMucId] = useState<string>();
  const [trangThai, setTrangThai] = useState<string>();
  const [conMon, setConMon] = useState<string>();

  const danhMucQuery = useQuery({
    queryKey: ['quan-tri', 'danh-muc-mon', 'cho-mon-an'],
    queryFn: heThongApi.danhMucQuanTri,
  });

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
    mutationFn: async ({
      id,
      duLieu,
      file,
    }: {
      id?: string;
      duLieu: FormMon;
      file: File | null;
    }) => {
      let duongDanAnh: string | undefined;

      if (file) {
        const uploaded = await quanTriApi.taiAnhMonAn(file);
        duongDanAnh = uploaded.urlCongKhai || uploaded.duongDan;
      }

      const payload: FormMon = {
        ...duLieu,
        ...(duongDanAnh ? { hinhAnhChinh: duongDanAnh } : {}),
      };

      const monAn = id
        ? await quanTriApi.capNhatMonAn(id, payload)
        : await quanTriApi.taoMonAn(payload);

      if (duongDanAnh) {
        await quanTriApi.themHinhMon(monAn.id, {
          duongDanAnh,
          altText: duLieu.tenMon,
          thuTu: 0,
          laAnhChinh: true,
        });
      }

      return monAn;
    },
    onSuccess: async (_r, bien) => {
      message.success(bien.id ? 'Đã cập nhật món ăn' : 'Đã tạo món ăn');
      setAnhChinhFile(null);
      setMoForm(false);
      await lamMoi();
    },
    onError: (e) => {
      message.error(e instanceof LoiApi ? e.message : 'Không lưu được món ăn.');
    },
  });

  const xoaMutation = useMutation({
    mutationFn: quanTriApi.xoaMonAn,
    onSuccess: async () => {
      message.success('Đã xóa món ăn');
      await lamMoi();
    },
    onError: (e) => message.error(e instanceof LoiApi ? e.message : 'Không xóa được món ăn.'),
  });

  const themHinhMutation = useMutation({
    mutationFn: async ({
      id,
      duLieu,
      file,
    }: {
      id: string;
      duLieu: FormHinh;
      file: File;
    }) => {
      const uploaded = await quanTriApi.taiAnhMonAn(file);
      const duongDanAnh = uploaded.urlCongKhai || uploaded.duongDan;

      return quanTriApi.themHinhMon(id, {
        ...duLieu,
        duongDanAnh,
      });
    },
    onSuccess: async () => {
      message.success('Đã thêm hình ảnh');
      setAnhPhuFile(null);
      setMoThemHinh(false);
      await lamMoi();
      await qc.invalidateQueries({
        queryKey: ['quan-tri', 'mon-an', 'chi-tiet', monAnhId],
      });
    },
    onError: (e) => {
      message.error(e instanceof LoiApi ? e.message : 'Không thêm được hình ảnh.');
    },
  });

  const chinhHinhMutation = useMutation({
    mutationFn: ({ monId, hinhId }: { monId: string; hinhId: string }) =>
      quanTriApi.capNhatHinhMon(monId, hinhId, { laAnhChinh: true }),
    onSuccess: async () => {
      message.success('Đã đặt làm ảnh chính');
      await lamMoi();
      await qc.invalidateQueries({
        queryKey: ['quan-tri', 'mon-an', 'chi-tiet', monAnhId],
      });
    },
    onError: (e) => message.error(e instanceof LoiApi ? e.message : 'Không cập nhật được ảnh chính.'),
  });

  const xoaHinhMutation = useMutation({
    mutationFn: ({ monId, hinhId }: { monId: string; hinhId: string }) =>
      quanTriApi.xoaHinhMon(monId, hinhId),
    onSuccess: async () => {
      message.success('Đã xóa hình ảnh');
      await lamMoi();
      await qc.invalidateQueries({
        queryKey: ['quan-tri', 'mon-an', 'chi-tiet', monAnhId],
      });
    },
    onError: (e) => message.error(e instanceof LoiApi ? e.message : 'Không xóa được hình ảnh.'),
  });

  const moTao = () => {
    setDangSua(null);
    setAnhChinhFile(null);
    form.resetFields();
    form.setFieldsValue({
      maMon: '',
      tenMon: '',
      duongDan: '',
      gia: 0,
      conMon: true,
      laMonNoiBat: false,
      trangThai: 'HOAT_DONG',
    });
    setMoForm(true);
  };

  const moSua = (r: MonAn) => {
    setDangSua(r);
    setAnhChinhFile(null);
    form.setFieldsValue({
      maMon: r.maMon,
      danhMucId: r.danhMucId,
      tenMon: r.tenMon,
      duongDan: r.duongDan,
      moTa: r.moTa ?? undefined,
      gia: r.gia,
      giaKhuyenMai: r.giaKhuyenMai ?? undefined,
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
      moTa="Quản lý món bán trên thực đơn, giá, tình trạng phục vụ và hình ảnh món."
      hanhDong={coQuanLy
        ? <Button type="primary" icon={<PlusOutlined />} onClick={moTao}>Thêm món ăn</Button>
        : undefined}
    />

    <Card className="filter-card admin-filter-card mb-16">
      <Space wrap>
        <Input.Search
          allowClear
          placeholder="Mã / tên món"
          onSearch={setTuKhoa}
          style={{ width: 240 }}
        />
        <Select
          allowClear
          placeholder="Danh mục"
          value={danhMucId}
          onChange={setDanhMucId}
          style={{ width: 200 }}
          options={(danhMucQuery.data ?? [])
            .filter((x) => x.trangThai === 'HOAT_DONG')
            .map((x) => ({ value: x.id, label: x.tenDanhMuc }))}
        />
        <Select
          allowClear
          placeholder="Trạng thái"
          value={trangThai}
          onChange={setTrangThai}
          style={{ width: 180 }}
          options={[
            { value: 'HOAT_DONG', label: 'Hoạt động' },
            { value: 'NGUNG_HOAT_DONG', label: 'Ngừng hoạt động' },
          ]}
        />
        <Select
          allowClear
          placeholder="Tình trạng món"
          value={conMon}
          onChange={setConMon}
          style={{ width: 170 }}
          options={[
            { value: 'true', label: 'Còn món' },
            { value: 'false', label: 'Hết món' },
          ]}
        />
        <Button icon={<ReloadOutlined />} onClick={() => monQuery.refetch()}>
          Làm mới
        </Button>
      </Space>
    </Card>

    <CanhBaoLoi
      loi={monQuery.error ?? danhMucQuery.error}
      macDinh="Không tải được món ăn."
    />

    <Card className="admin-table-card">
      <Table
        rowKey="id"
        loading={monQuery.isPending || monQuery.isFetching}
        dataSource={monQuery.data?.danhSach ?? []}
        scroll={{ x: 1120 }}
        pagination={{ pageSize: 20, showSizeChanger: false }}
        columns={[
          {
            title: 'Ảnh',
            width: 76,
            render: (_: unknown, r: MonAn) => (
              <Avatar
                shape="square"
                size={50}
                src={r.hinhAnhChinh || undefined}
                icon={<PictureOutlined />}
              />
            ),
          },
          {
            title: 'Món ăn',
            dataIndex: 'tenMon',
            fixed: 'left',
            width: 230,
            render: (v: string, r: MonAn) => (
              <div>
                <Space size={6}>
                  {r.laMonNoiBat
                    ? <Tooltip title="Món nổi bật"><StarFilled className="featured-star" /></Tooltip>
                    : null}
                  <strong>{v}</strong>
                </Space>
                <div className="admin-muted-code">{r.maMon}</div>
              </div>
            ),
          },
          { title: 'Danh mục', dataIndex: 'tenDanhMuc', width: 150 },
          {
            title: 'Giá',
            dataIndex: 'gia',
            width: 150,
            render: (v: number, r: MonAn) => r.giaKhuyenMai != null
              ? (
                <Space direction="vertical" size={0}>
                  <span className="price-old">{dinhDangTien(v)}</span>
                  <strong>{dinhDangTien(r.giaKhuyenMai)}</strong>
                </Space>
              )
              : <strong>{dinhDangTien(v)}</strong>,
          },
          {
            title: 'Tình trạng',
            dataIndex: 'conMon',
            width: 110,
            render: (v: boolean) => (
              <Tag color={v ? 'green' : 'default'}>{v ? 'Còn món' : 'Hết món'}</Tag>
            ),
          },
          {
            title: 'Trạng thái',
            dataIndex: 'trangThai',
            width: 140,
            render: (v: string) => <TrangThai value={v} />,
          },
          {
            title: 'Thao tác',
            fixed: 'right',
            width: 170,
            render: (_: unknown, r: MonAn) => (
              <Space>
                <Button
                  size="small"
                  aria-label={`Hình ảnh món ${r.tenMon}`}
                  icon={<EyeOutlined />}
                  onClick={() => moAnh(r)}
                />
                {coQuanLy ? (
                  <Button
                    size="small"
                    aria-label={`Sửa món ${r.tenMon}`}
                    icon={<EditOutlined />}
                    onClick={() => moSua(r)}
                  />
                ) : null}
                {coQuanLy ? (
                  <Button
                    size="small"
                    aria-label={`Xóa món ${r.tenMon}`}
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => modal.confirm({
                      title: 'Xóa món ăn?',
                      content: r.tenMon,
                      okText: 'Xóa',
                      cancelText: 'Đóng',
                      okButtonProps: { danger: true },
                      onOk: () => xoaMutation.mutateAsync(r.id),
                    })}
                  />
                ) : null}
              </Space>
            ),
          },
        ]}
      />
    </Card>

    <Modal
      className="admin-form-modal admin-dish-modal"
      width={760}
      open={moForm}
      title={dangSua ? 'Sửa món ăn' : 'Thêm món ăn'}
      okText="Lưu"
      cancelText="Đóng"
      confirmLoading={luuMutation.isPending}
      onCancel={() => {
        setAnhChinhFile(null);
        setMoForm(false);
      }}
      onOk={() => form.submit()}
      destroyOnHidden
    >
      <Form
        size="middle"
        form={form}
        layout="vertical"
        onValuesChange={(changed) => {
          if (!dangSua && typeof changed.tenMon === 'string') {
            form.setFieldsValue({
              maMon: taoMaMon(changed.tenMon),
              duongDan: taoSlug(changed.tenMon),
            });
          }
        }}
        onFinish={(v) => luuMutation.mutate({
          id: dangSua?.id,
          duLieu: v,
          file: anhChinhFile,
        })}
      >
        <Form.Item
          name="tenMon"
          label="Tên món"
          rules={[{ required: true, message: 'Nhập tên món' }]}
        >
          <Input maxLength={200} placeholder="Ví dụ: Bún bò Huế đặc biệt" />
        </Form.Item>

        <Form.Item
          name="danhMucId"
          label="Danh mục"
          rules={[{ required: true, message: 'Chọn danh mục' }]}
        >
          <Select
            placeholder="Chọn nhóm món"
            options={(danhMucQuery.data ?? [])
              .filter((x) => x.trangThai === 'HOAT_DONG' || x.id === dangSua?.danhMucId)
              .map((x) => ({ value: x.id, label: x.tenDanhMuc }))}
          />
        </Form.Item>

        <Space className="form-row" align="start" wrap>
          <Form.Item
            name="maMon"
            label="Mã món"
            rules={[{ required: true, message: 'Mã món chưa được tạo' }]}
            extra={dangSua
              ? 'Mã được giữ cố định sau khi tạo.'
              : 'Tự động tạo từ tên món, không cần nhập.'}
          >
            <Input readOnly maxLength={30} />
          </Form.Item>

          <Form.Item
            name="duongDan"
            label="Đường dẫn"
            extra={dangSua
              ? 'Giữ ổn định để không làm hỏng liên kết món.'
              : 'Tự động tạo từ tên món.'}
          >
            <Input readOnly maxLength={220} />
          </Form.Item>
        </Space>

        <Form.Item name="moTa" label="Mô tả món">
          <Input.TextArea
            rows={3}
            maxLength={5000}
            showCount
            placeholder="Thành phần chính, hương vị hoặc điểm nổi bật của món."
          />
        </Form.Item>

        <Space className="form-row" align="start" wrap>
          <Form.Item
            name="gia"
            label="Giá bán"
            rules={[
              { required: true, message: 'Nhập giá bán' },
              {
                validator: (_, value) =>
                  Number(value) > 0
                    ? Promise.resolve()
                    : Promise.reject(new Error('Giá bán phải lớn hơn 0')),
              },
            ]}
          >
            <InputNumber min={0} step={1000} style={{ width: 210 }} addonAfter="₫" />
          </Form.Item>

          <Form.Item
            name="giaKhuyenMai"
            label="Giá khuyến mãi"
            extra="Bỏ trống nếu món không giảm giá."
          >
            <InputNumber min={0} step={1000} style={{ width: 210 }} addonAfter="₫" />
          </Form.Item>
        </Space>

        <div className="admin-image-upload-card">
          <div className="admin-image-upload-copy">
            <div>
              <strong>Ảnh chính của món</strong>
              <Typography.Paragraph type="secondary">
                Chọn JPG, PNG hoặc WEBP từ máy. Tối đa 5 MB; hệ thống tự tối ưu thành WEBP.
              </Typography.Paragraph>
            </div>
          </div>

          {dangSua?.hinhAnhChinh && !anhChinhFile ? (
            <div className="admin-current-image">
              <Typography.Text type="secondary">Ảnh hiện tại</Typography.Text>
              <Image
                src={dangSua.hinhAnhChinh}
                width={180}
                height={120}
                className="admin-dish-image"
              />
            </div>
          ) : null}

          <Upload
            accept="image/jpeg,image/png,image/webp"
            maxCount={1}
            listType="picture"
            beforeUpload={(file) => {
              if (!fileHopLe(file, message)) return Upload.LIST_IGNORE;
              setAnhChinhFile(file);
              return false;
            }}
            onRemove={() => {
              setAnhChinhFile(null);
              return true;
            }}
          >
            <Button icon={<UploadOutlined />}>
              {dangSua?.hinhAnhChinh ? 'Thay ảnh chính' : 'Chọn ảnh từ máy'}
            </Button>
          </Upload>
        </div>

        <div className="admin-form-section">
          <strong>Hiển thị & phục vụ</strong>
          <Space size="large" wrap className="admin-switch-row">
            <Form.Item
              name="conMon"
              label="Còn món"
              valuePropName="checked"
              extra="Tắt khi bếp tạm hết món."
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="laMonNoiBat"
              label="Món nổi bật"
              valuePropName="checked"
              extra="Ưu tiên hiển thị trên trang chủ/thực đơn."
            >
              <Switch />
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
        </div>
      </Form>
    </Modal>

    <Drawer
      className="admin-detail-drawer"
      width={660}
      open={Boolean(monAnhId)}
      onClose={() => setMonAnhId(null)}
      title={`Hình ảnh · ${chiTietQuery.data?.tenMon ?? ''}`}
      extra={coQuanLy ? (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            formHinh.resetFields();
            formHinh.setFieldsValue({ thuTu: 0, laAnhChinh: false });
            setAnhPhuFile(null);
            setMoThemHinh(true);
          }}
        >
          Thêm ảnh
        </Button>
      ) : null}
    >
      <CanhBaoLoi loi={chiTietQuery.error} macDinh="Không tải được hình ảnh món." />

      <List
        loading={chiTietQuery.isPending || chiTietQuery.isFetching}
        dataSource={chiTietQuery.data?.hinhAnh ?? []}
        locale={{ emptyText: 'Món này chưa có hình ảnh bổ sung.' }}
        renderItem={(h: HinhAnhMon) => (
          <List.Item
            actions={coQuanLy
              ? [
                h.laAnhChinh
                  ? <Tag color="gold" key="main"><StarFilled /> Ảnh chính</Tag>
                  : (
                    <Button
                      key="main"
                      size="small"
                      onClick={() => monAnhId && chinhHinhMutation.mutate({
                        monId: monAnhId,
                        hinhId: h.id,
                      })}
                    >
                      Đặt ảnh chính
                    </Button>
                  ),
                <Button
                  key="delete"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => monAnhId && modal.confirm({
                    title: 'Xóa hình ảnh?',
                    okText: 'Xóa',
                    cancelText: 'Đóng',
                    okButtonProps: { danger: true },
                    onOk: () => xoaHinhMutation.mutateAsync({
                      monId: monAnhId,
                      hinhId: h.id,
                    }),
                  })}
                />,
              ]
              : h.laAnhChinh
                ? [<Tag color="gold" key="main"><StarFilled /> Ảnh chính</Tag>]
                : []}
          >
            <List.Item.Meta
              avatar={(
                <Image
                  width={104}
                  height={76}
                  className="admin-dish-image"
                  src={h.duongDanAnh}
                  fallback="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
                />
              )}
              title={h.altText || 'Hình món ăn'}
              description={`Thứ tự hiển thị: ${h.thuTu}`}
            />
          </List.Item>
        )}
      />

      <div className="image-manager-note">
        Ảnh được tải trực tiếp từ máy và tối ưu tự động. Có thể thêm nhiều ảnh và chọn một ảnh làm ảnh chính.
      </div>
    </Drawer>

    <Modal
      className="admin-form-modal"
      open={moThemHinh}
      title="Thêm hình ảnh món"
      okText="Thêm ảnh"
      cancelText="Đóng"
      confirmLoading={themHinhMutation.isPending}
      onCancel={() => {
        setAnhPhuFile(null);
        setMoThemHinh(false);
      }}
      onOk={() => {
        if (!anhPhuFile) {
          message.warning('Chọn một ảnh từ máy trước khi thêm.');
          return;
        }
        formHinh.submit();
      }}
      destroyOnHidden
    >
      <Form
        size="middle"
        form={formHinh}
        layout="vertical"
        onFinish={(v) => {
          if (monAnhId && anhPhuFile) {
            themHinhMutation.mutate({
              id: monAnhId,
              duLieu: v,
              file: anhPhuFile,
            });
          }
        }}
      >
        <Form.Item label="Tệp hình ảnh" required>
          <Upload
            accept="image/jpeg,image/png,image/webp"
            maxCount={1}
            listType="picture"
            beforeUpload={(file) => {
              if (!fileHopLe(file, message)) return Upload.LIST_IGNORE;
              setAnhPhuFile(file);
              return false;
            }}
            onRemove={() => {
              setAnhPhuFile(null);
              return true;
            }}
          >
            <Button icon={<UploadOutlined />}>Chọn ảnh từ máy</Button>
          </Upload>
          <Typography.Text type="secondary">
            JPG, PNG hoặc WEBP · tối đa 5 MB.
          </Typography.Text>
        </Form.Item>

        <Form.Item name="altText" label="Mô tả ảnh">
          <Input maxLength={255} placeholder="Ví dụ: Bún bò Huế đặc biệt - góc chụp chính" />
        </Form.Item>

        <Space className="form-row" align="start" wrap>
          <Form.Item name="thuTu" label="Thứ tự">
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item
            name="laAnhChinh"
            label="Đặt làm ảnh chính"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Space>
      </Form>
    </Modal>
  </>;
}
