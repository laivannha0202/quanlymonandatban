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
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { dinhDangTien } from '@/cau-hinh/dinh-dang';
import { heThongApi, type KhuyenMai } from '@/dich-vu/he-thong.api';
import { LoiApi } from '@/dich-vu/http';
import { useXacThuc } from '@/ngu-canh/xac-thuc.context';
import { TieuDeTrang } from '@/thanh-phan/tieu-de-trang';

type LoaiGiam = 'PHAN_TRAM' | 'SO_TIEN';
type HieuLuc =
  | 'DANG_AP_DUNG'
  | 'SAP_DIEN_RA'
  | 'DA_HET_HAN'
  | 'NGUNG_HOAT_DONG';

type FormData = {
  maKhuyenMai: string;
  tenKhuyenMai: string;
  moTa?: string;
  loaiGiam: LoaiGiam;
  giaTri: number;
  giaTriDonToiThieu?: number;
  giamToiDa?: number;
  ngayBatDau: Dayjs;
  ngayKetThuc: Dayjs;
  trangThai?: string;
};

function boDau(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

function taoMaKhuyenMai(value: string) {
  const than = boDau(value)
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 47);

  return than ? `HV_${than}`.slice(0, 50) : '';
}

function dinhDangNgayGio(value: string) {
  const d = dayjs(value);
  return d.isValid() ? d.format('DD/MM/YYYY HH:mm') : '—';
}

function tinhHieuLuc(r: KhuyenMai): HieuLuc {
  if (r.trangThai !== 'HOAT_DONG') return 'NGUNG_HOAT_DONG';

  const batDau = dayjs(r.ngayBatDau);
  const ketThuc = dayjs(r.ngayKetThuc);
  const hienTai = dayjs();

  if (batDau.isValid() && hienTai.isBefore(batDau)) return 'SAP_DIEN_RA';
  if (ketThuc.isValid() && hienTai.isAfter(ketThuc)) return 'DA_HET_HAN';

  return 'DANG_AP_DUNG';
}

const hieuLucMeta: Record<HieuLuc, { nhan: string; mau?: string }> = {
  DANG_AP_DUNG: { nhan: 'Đang áp dụng', mau: 'green' },
  SAP_DIEN_RA: { nhan: 'Sắp diễn ra', mau: 'blue' },
  DA_HET_HAN: { nhan: 'Đã hết hạn' },
  NGUNG_HOAT_DONG: { nhan: 'Ngừng hoạt động', mau: 'red' },
};

function HieuLucTag({ row }: { row: KhuyenMai }) {
  const meta = hieuLucMeta[tinhHieuLuc(row)];
  return <Tag color={meta.mau}>{meta.nhan}</Tag>;
}

function hienMucGiam(r: KhuyenMai) {
  return r.loaiGiam === 'PHAN_TRAM'
    ? `-${r.giaTri}%`
    : `-${dinhDangTien(r.giaTri)}`;
}

export function QuanTriKhuyenMai() {
  const { message, modal } = App.useApp();
  const { coQuyen } = useXacThuc();
  const coQuanLy = coQuyen('KHUYEN_MAI_QUAN_LY');

  const [form] = Form.useForm<FormData>();
  const loaiGiam = Form.useWatch('loaiGiam', form) ?? 'PHAN_TRAM';

  const [ds, setDs] = useState<KhuyenMai[]>([]);
  const [tai, setTai] = useState(true);
  const [dangLuu, setDangLuu] = useState(false);
  const [loi, setLoi] = useState('');
  const [dangSua, setDangSua] = useState<KhuyenMai | null>(null);
  const [moForm, setMoForm] = useState(false);
  const [maDaSuaTay, setMaDaSuaTay] = useState(false);

  const [tuKhoa, setTuKhoa] = useState('');
  const [trangThaiLoc, setTrangThaiLoc] = useState<string>();
  const [hieuLucLoc, setHieuLucLoc] = useState<HieuLuc>();

  const taiLai = async () => {
    setTai(true);
    setLoi('');

    try {
      const kq = await heThongApi.khuyenMaiQuanTri({ kichThuoc: 100 });
      setDs(kq.danhSach);
    } catch (e) {
      setLoi(e instanceof LoiApi ? e.message : 'Không tải được khuyến mãi.');
    } finally {
      setTai(false);
    }
  };

  useEffect(() => {
    void taiLai();
  }, []);

  const danhSach = useMemo(() => {
    const q = boDau(tuKhoa).toLowerCase().trim();

    return ds.filter((r) => {
      if (trangThaiLoc && r.trangThai !== trangThaiLoc) return false;
      if (hieuLucLoc && tinhHieuLuc(r) !== hieuLucLoc) return false;

      if (!q) return true;

      return boDau(`${r.maKhuyenMai} ${r.tenKhuyenMai}`)
        .toLowerCase()
        .includes(q);
    });
  }, [ds, tuKhoa, trangThaiLoc, hieuLucLoc]);

  const moTao = () => {
    setDangSua(null);
    setMaDaSuaTay(false);
    form.resetFields();
    form.setFieldsValue({
      maKhuyenMai: '',
      tenKhuyenMai: '',
      loaiGiam: 'PHAN_TRAM',
      giaTri: 10,
      trangThai: 'HOAT_DONG',
    });
    setMoForm(true);
  };

  const moSua = (r: KhuyenMai) => {
    setDangSua(r);
    setMaDaSuaTay(true);
    form.resetFields();
    form.setFieldsValue({
      maKhuyenMai: r.maKhuyenMai,
      tenKhuyenMai: r.tenKhuyenMai,
      moTa: r.moTa ?? undefined,
      loaiGiam: r.loaiGiam,
      giaTri: r.giaTri,
      giaTriDonToiThieu: r.giaTriDonToiThieu ?? undefined,
      giamToiDa: r.giamToiDa ?? undefined,
      ngayBatDau: dayjs(r.ngayBatDau),
      ngayKetThuc: dayjs(r.ngayKetThuc),
      trangThai: r.trangThai,
    });
    setMoForm(true);
  };

  const luu = async (v: FormData) => {
    if (!v.ngayBatDau?.isValid() || !v.ngayKetThuc?.isValid()) {
      message.error('Thời gian khuyến mãi không hợp lệ.');
      return;
    }

    if (!v.ngayKetThuc.isAfter(v.ngayBatDau)) {
      message.error('Thời gian kết thúc phải sau thời gian bắt đầu.');
      return;
    }

    const payload = {
      maKhuyenMai: v.maKhuyenMai.trim().toUpperCase(),
      tenKhuyenMai: v.tenKhuyenMai.trim(),
      moTa: v.moTa?.trim() || undefined,
      loaiGiam: v.loaiGiam,
      giaTri: Number(v.giaTri),
      giaTriDonToiThieu:
        v.giaTriDonToiThieu == null ? undefined : Number(v.giaTriDonToiThieu),
      giamToiDa:
        v.loaiGiam === 'PHAN_TRAM' && v.giamToiDa != null
          ? Number(v.giamToiDa)
          : undefined,
      ngayBatDau: v.ngayBatDau.toISOString(),
      ngayKetThuc: v.ngayKetThuc.toISOString(),
      trangThai: v.trangThai,
    };

    setDangLuu(true);
    try {
      if (dangSua) {
        await heThongApi.capNhatKhuyenMai(dangSua.id, payload);
        message.success('Đã cập nhật khuyến mãi');
      } else {
        await heThongApi.taoKhuyenMai(payload);
        message.success('Đã tạo khuyến mãi');
      }

      setMoForm(false);
      await taiLai();
    } catch (e) {
      message.error(
        e instanceof LoiApi ? e.message : 'Không lưu được khuyến mãi.',
      );
    } finally {
      setDangLuu(false);
    }
  };

  return (
    <>
      <TieuDeTrang
        tieuDe="Khuyến mãi"
        moTa="Theo dõi chương trình đang áp dụng, thời hạn, mức ưu đãi và điều kiện sử dụng."
        hanhDong={
          coQuanLy ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={moTao}>
              Thêm khuyến mãi
            </Button>
          ) : undefined
        }
      />

      <Card className="filter-card admin-filter-card admin-promo-filter mb-16">
        <Space wrap>
          <Input.Search
            allowClear
            placeholder="Tìm mã hoặc tên khuyến mãi"
            value={tuKhoa}
            onChange={(e) => setTuKhoa(e.target.value)}
            style={{ width: 280 }}
          />

          <Select
            allowClear
            placeholder="Trạng thái"
            value={trangThaiLoc}
            onChange={setTrangThaiLoc}
            style={{ width: 180 }}
            options={[
              { value: 'HOAT_DONG', label: 'Hoạt động' },
              { value: 'NGUNG_HOAT_DONG', label: 'Ngừng hoạt động' },
            ]}
          />

          <Select
            allowClear
            placeholder="Hiệu lực"
            value={hieuLucLoc}
            onChange={setHieuLucLoc}
            style={{ width: 190 }}
            options={[
              { value: 'DANG_AP_DUNG', label: 'Đang áp dụng' },
              { value: 'SAP_DIEN_RA', label: 'Sắp diễn ra' },
              { value: 'DA_HET_HAN', label: 'Đã hết hạn' },
              { value: 'NGUNG_HOAT_DONG', label: 'Ngừng hoạt động' },
            ]}
          />

          <Button icon={<ReloadOutlined />} onClick={() => void taiLai()}>
            Làm mới
          </Button>

          <Typography.Text type="secondary">
            {danhSach.length} chương trình
          </Typography.Text>
        </Space>
      </Card>

      {loi ? (
        <Alert type="error" showIcon message={loi} className="mb-16" />
      ) : null}

      <Card className="admin-table-card admin-promo-table-card">
        <Table
          rowKey="id"
          loading={tai}
          dataSource={danhSach}
          scroll={{ x: 1180 }}
          pagination={{ pageSize: 20, showSizeChanger: false }}
          columns={[
            {
              title: 'Chương trình',
              width: 260,
              render: (_: unknown, r: KhuyenMai) => (
                <div className="admin-promo-name">
                  <strong>{r.tenKhuyenMai}</strong>
                  <Typography.Text code>{r.maKhuyenMai}</Typography.Text>
                </div>
              ),
            },
            {
              title: 'Ưu đãi',
              width: 150,
              render: (_: unknown, r: KhuyenMai) => (
                <div className="admin-promo-discount">
                  <strong>{hienMucGiam(r)}</strong>
                  <Typography.Text type="secondary">
                    {r.loaiGiam === 'PHAN_TRAM'
                      ? r.giamToiDa != null
                        ? `Tối đa ${dinhDangTien(r.giamToiDa)}`
                        : 'Không giới hạn mức giảm'
                      : 'Giảm trực tiếp'}
                  </Typography.Text>
                </div>
              ),
            },
            {
              title: 'Điều kiện',
              width: 190,
              render: (_: unknown, r: KhuyenMai) => (
                <div className="admin-promo-condition">
                  <span>
                    Đơn tối thiểu:{' '}
                    <strong>
                      {r.giaTriDonToiThieu != null
                        ? dinhDangTien(r.giaTriDonToiThieu)
                        : 'Không yêu cầu'}
                    </strong>
                  </span>
                </div>
              ),
            },
            {
              title: 'Thời gian',
              width: 210,
              render: (_: unknown, r: KhuyenMai) => (
                <div className="admin-promo-time">
                  <span>Từ {dinhDangNgayGio(r.ngayBatDau)}</span>
                  <span>Đến {dinhDangNgayGio(r.ngayKetThuc)}</span>
                </div>
              ),
            },
            {
              title: 'Hiệu lực',
              width: 145,
              render: (_: unknown, r: KhuyenMai) => <HieuLucTag row={r} />,
            },
            {
              title: 'Thao tác',
              fixed: 'right',
              width: 110,
              render: (_: unknown, r: KhuyenMai) =>
                coQuanLy ? (
                  <Space>
                    <Button
                      size="small"
                      aria-label={`Sửa khuyến mãi ${r.tenKhuyenMai}`}
                      icon={<EditOutlined />}
                      onClick={() => moSua(r)}
                    />
                    <Button
                      size="small"
                      danger
                      aria-label={`Xóa khuyến mãi ${r.tenKhuyenMai}`}
                      icon={<DeleteOutlined />}
                      onClick={() =>
                        modal.confirm({
                          title: 'Xóa khuyến mãi?',
                          content: (
                            <>
                              Chương trình <strong>{r.tenKhuyenMai}</strong> sẽ
                              không còn xuất hiện với khách hàng.
                            </>
                          ),
                          okText: 'Xóa',
                          cancelText: 'Đóng',
                          okButtonProps: { danger: true },
                          onOk: async () => {
                            try {
                              await heThongApi.xoaKhuyenMai(r.id);
                              message.success('Đã xóa khuyến mãi');
                              await taiLai();
                            } catch (e) {
                              message.error(
                                e instanceof LoiApi
                                  ? e.message
                                  : 'Không xóa được khuyến mãi.',
                              );
                            }
                          },
                        })
                      }
                    />
                  </Space>
                ) : (
                  '—'
                ),
            },
          ]}
        />
      </Card>

      <Modal
        className="admin-form-modal admin-promo-modal"
        open={moForm}
        width={760}
        title={dangSua ? 'Sửa khuyến mãi' : 'Thêm khuyến mãi'}
        okText="Lưu"
        cancelText="Đóng"
        confirmLoading={dangLuu}
        onCancel={() => setMoForm(false)}
        onOk={() => form.submit()}
        destroyOnHidden
      >
        <Form
          size="middle"
          form={form}
          layout="vertical"
          onFinish={(v) => void luu(v)}
          onValuesChange={(changed) => {
            if (
              !dangSua &&
              typeof changed.tenKhuyenMai === 'string' &&
              !maDaSuaTay
            ) {
              form.setFieldValue(
                'maKhuyenMai',
                taoMaKhuyenMai(changed.tenKhuyenMai),
              );
            }

            if (changed.loaiGiam === 'SO_TIEN') {
              form.setFieldValue('giamToiDa', undefined);
            }
          }}
        >
          <div className="admin-promo-form-section">
            <div className="admin-promo-form-heading">
              <strong>Thông tin chương trình</strong>
              <span>Tên hiển thị và mã khách có thể nhận biết.</span>
            </div>

            <Form.Item
              name="tenKhuyenMai"
              label="Tên khuyến mãi"
              rules={[{ required: true, message: 'Nhập tên khuyến mãi' }]}
            >
              <Input
                maxLength={200}
                placeholder="Ví dụ: Khách mới giảm 15%"
              />
            </Form.Item>

            <Form.Item
              name="maKhuyenMai"
              label="Mã khuyến mãi"
              normalize={(value) =>
                typeof value === 'string'
                  ? boDau(value)
                      .toUpperCase()
                      .replace(/[^A-Z0-9_]/g, '')
                      .slice(0, 50)
                  : value
              }
              rules={[
                { required: true, message: 'Nhập mã khuyến mãi' },
                {
                  pattern: /^[A-Z0-9_]+$/,
                  message: 'Mã chỉ gồm chữ in hoa, số và dấu gạch dưới.',
                },
              ]}
              extra={
                dangSua
                  ? 'Mã được giữ cố định sau khi tạo để khách sử dụng ổn định.'
                  : 'Hệ thống gợi ý từ tên; bạn vẫn có thể sửa trước khi lưu.'
              }
            >
              <Input
                readOnly={Boolean(dangSua)}
                maxLength={50}
                placeholder="HV_KHACH_MOI"
                onChange={() => {
                  if (!dangSua) setMaDaSuaTay(true);
                }}
              />
            </Form.Item>

            <Form.Item name="moTa" label="Mô tả">
              <Input.TextArea
                rows={3}
                maxLength={5000}
                showCount
                placeholder="Mô tả ngắn điều khách nhận được từ chương trình."
              />
            </Form.Item>
          </div>

          <Divider />

          <div className="admin-promo-form-section">
            <div className="admin-promo-form-heading">
              <strong>Mức ưu đãi</strong>
              <span>Đơn vị và giới hạn thay đổi theo loại giảm.</span>
            </div>

            <Space className="form-row" align="start" wrap>
              <Form.Item
                name="loaiGiam"
                label="Loại giảm"
                rules={[{ required: true, message: 'Chọn loại giảm' }]}
              >
                <Select
                  style={{ width: 210 }}
                  options={[
                    { value: 'PHAN_TRAM', label: 'Phần trăm (%)' },
                    { value: 'SO_TIEN', label: 'Số tiền (₫)' },
                  ]}
                />
              </Form.Item>

              <Form.Item
                name="giaTri"
                label={loaiGiam === 'PHAN_TRAM' ? 'Phần trăm giảm' : 'Số tiền giảm'}
                rules={[
                  { required: true, message: 'Nhập giá trị giảm' },
                  {
                    validator: (_, value) => {
                      const n = Number(value);
                      if (!Number.isFinite(n) || n <= 0) {
                        return Promise.reject(
                          new Error('Giá trị giảm phải lớn hơn 0.'),
                        );
                      }
                      if (loaiGiam === 'PHAN_TRAM' && n > 100) {
                        return Promise.reject(
                          new Error('Phần trăm giảm không được vượt quá 100%.'),
                        );
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <InputNumber
                  min={0.01}
                  max={loaiGiam === 'PHAN_TRAM' ? 100 : undefined}
                  step={loaiGiam === 'PHAN_TRAM' ? 1 : 1000}
                  addonAfter={loaiGiam === 'PHAN_TRAM' ? '%' : '₫'}
                  style={{ width: 210 }}
                />
              </Form.Item>

              {loaiGiam === 'PHAN_TRAM' ? (
                <Form.Item
                  name="giamToiDa"
                  label="Giảm tối đa"
                  extra="Bỏ trống nếu không giới hạn."
                >
                  <InputNumber
                    min={0.01}
                    step={1000}
                    addonAfter="₫"
                    style={{ width: 210 }}
                  />
                </Form.Item>
              ) : null}
            </Space>
          </div>

          <Divider />

          <div className="admin-promo-form-section">
            <div className="admin-promo-form-heading">
              <strong>Điều kiện áp dụng</strong>
              <span>Điều kiện giá trị đơn để nhân viên áp dụng chương trình tại nhà hàng.</span>
            </div>

            <Space className="form-row" align="start" wrap>
              <Form.Item
                name="giaTriDonToiThieu"
                label="Đơn tối thiểu"
                extra="Bỏ trống nếu không yêu cầu."
              >
                <InputNumber
                  min={0}
                  step={10000}
                  addonAfter="₫"
                  style={{ width: 240 }}
                />
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

          <Divider />

          <div className="admin-promo-form-section">
            <div className="admin-promo-form-heading">
              <strong>Thời gian</strong>
              <span>Hiển thị theo định dạng ngày giờ Việt Nam.</span>
            </div>

            <Space className="form-row" align="start" wrap>
              <Form.Item
                name="ngayBatDau"
                label="Bắt đầu"
                rules={[{ required: true, message: 'Chọn thời gian bắt đầu' }]}
              >
                <DatePicker
                  showTime={{ format: 'HH:mm' }}
                  format="DD/MM/YYYY HH:mm"
                  placeholder="Chọn ngày giờ bắt đầu"
                  style={{ width: 250 }}
                />
              </Form.Item>

              <Form.Item
                name="ngayKetThuc"
                label="Kết thúc"
                dependencies={['ngayBatDau']}
                rules={[
                  { required: true, message: 'Chọn thời gian kết thúc' },
                  ({ getFieldValue }) => ({
                    validator(_, value: Dayjs | undefined) {
                      const batDau = getFieldValue('ngayBatDau') as
                        | Dayjs
                        | undefined;

                      if (
                        !value ||
                        !batDau ||
                        value.isAfter(batDau)
                      ) {
                        return Promise.resolve();
                      }

                      return Promise.reject(
                        new Error('Kết thúc phải sau thời gian bắt đầu.'),
                      );
                    },
                  }),
                ]}
              >
                <DatePicker
                  showTime={{ format: 'HH:mm' }}
                  format="DD/MM/YYYY HH:mm"
                  placeholder="Chọn ngày giờ kết thúc"
                  style={{ width: 250 }}
                />
              </Form.Item>
            </Space>
          </div>
        </Form>
      </Modal>
    </>
  );
}
