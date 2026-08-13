import {
  CheckCircleOutlined,
  CreditCardOutlined,
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Drawer,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useState } from 'react';
import { dinhDangTien } from '@/cau-hinh/dinh-dang';
import {
  dinhDangNgay,
  dinhDangNgayGio,
} from '@/cau-hinh/ngay-gio';
import { LoiApi } from '@/dich-vu/http';
import {
  thanhToanQuanTriApi,
  type HoanTienQuanTri,
  type ThanhToanQuanTri,
  type XacNhanHoanTienPayload,
  type XacNhanThanhToanThuCongPayload,
} from '@/dich-vu/thanh-toan-quan-tri.api';
import type {
  PhuongThucThanhToan,
  TrangThaiHoanTien,
  TrangThaiThanhToan,
} from '@/kieu/trang-thai';
import { useXacThuc } from '@/ngu-canh/xac-thuc.context';
import { CanhBaoLoi } from '@/thanh-phan/canh-bao-loi';
import { TieuDeTrang } from '@/thanh-phan/tieu-de-trang';
import { TrangThai } from '@/thanh-phan/trang-thai';
import './tai-chinh-admin.css';

const NHAN_THANH_TOAN: Record<TrangThaiThanhToan, string> = {
  CHO_THANH_TOAN: 'Chờ thanh toán',
  DA_THANH_TOAN: 'Đã thanh toán',
  THAT_BAI: 'Thất bại',
  DA_HUY: 'Đã hủy',
  DA_HOAN_TIEN: 'Đã hoàn tiền',
  HOAN_MOT_PHAN: 'Hoàn một phần',
};

const MAU_THANH_TOAN: Record<
  TrangThaiThanhToan,
  'default' | 'blue' | 'cyan' | 'gold' | 'green' | 'red'
> = {
  CHO_THANH_TOAN: 'gold',
  DA_THANH_TOAN: 'green',
  THAT_BAI: 'red',
  DA_HUY: 'default',
  DA_HOAN_TIEN: 'cyan',
  HOAN_MOT_PHAN: 'blue',
};

const NHAN_HOAN_TIEN: Record<TrangThaiHoanTien, string> = {
  CHO_HOAN: 'Chờ hoàn',
  DANG_XU_LY: 'Đang xử lý',
  DA_HOAN: 'Đã hoàn',
  THAT_BAI: 'Thất bại',
};

const MAU_HOAN_TIEN: Record<
  TrangThaiHoanTien,
  'blue' | 'gold' | 'green' | 'red'
> = {
  CHO_HOAN: 'gold',
  DANG_XU_LY: 'blue',
  DA_HOAN: 'green',
  THAT_BAI: 'red',
};

const NHAN_PHUONG_THUC: Record<PhuongThucThanhToan, string> = {
  MO_PHONG: 'Mô phỏng',
  VNPAY: 'VNPay',
  MOMO: 'MoMo',
  CHUYEN_KHOAN: 'Chuyển khoản',
  TIEN_MAT: 'Tiền mặt',
};

type FormThanhToan = XacNhanThanhToanThuCongPayload;
type FormHoanTien = XacNhanHoanTienPayload;

function hienThiPhuongThuc(
  phuongThuc: PhuongThucThanhToan,
  trangThai: TrangThaiThanhToan,
) {
  return trangThai === 'CHO_THANH_TOAN'
    ? 'Chưa ghi nhận'
    : NHAN_PHUONG_THUC[phuongThuc];
}

function TheHoanTien({
  item,
  coQuyenHoan,
  dangXuLy,
  onXacNhan,
}: {
  item: HoanTienQuanTri;
  coQuyenHoan: boolean;
  dangXuLy: boolean;
  onXacNhan: (item: HoanTienQuanTri) => void;
}) {
  const choXacNhan =
    item.trangThai === 'CHO_HOAN' ||
    item.trangThai === 'DANG_XU_LY';

  return (
    <Card
      size="small"
      className="admin-refund-card"
      title={
        <Space wrap>
          <UndoOutlined />
          <Typography.Text strong>
            {item.maHoanTien}
          </Typography.Text>
        </Space>
      }
      extra={
        <Tag color={MAU_HOAN_TIEN[item.trangThai]}>
          {NHAN_HOAN_TIEN[item.trangThai]}
        </Tag>
      }
    >
      <div className="admin-finance-row">
        <span>Số tiền</span>
        <strong>{dinhDangTien(item.soTien)}</strong>
      </div>
      <div className="admin-finance-row">
        <span>Lý do</span>
        <span>{item.lyDo || '—'}</span>
      </div>
      {item.maGiaoDichCong ? (
        <div className="admin-finance-row">
          <span>Mã giao dịch hoàn</span>
          <Typography.Text copyable>
            {item.maGiaoDichCong}
          </Typography.Text>
        </div>
      ) : null}
      {item.thoiGianHoan ? (
        <div className="admin-finance-row">
          <span>Hoàn lúc</span>
          <span>{dinhDangNgayGio(item.thoiGianHoan)}</span>
        </div>
      ) : null}

      {coQuyenHoan && choXacNhan ? (
        <Button
          type="primary"
          icon={<CheckCircleOutlined />}
          loading={dangXuLy}
          onClick={() => onXacNhan(item)}
          className="mt-16"
        >
          Xác nhận đã hoàn
        </Button>
      ) : null}
    </Card>
  );
}

export function QuanTriThanhToan() {
  const { message } = App.useApp();
  const { coQuyen } = useXacThuc();
  const queryClient = useQueryClient();

  const [tuKhoa, setTuKhoa] = useState('');
  const [trangThai, setTrangThai] =
    useState<TrangThaiThanhToan>();
  const [phuongThuc, setPhuongThuc] =
    useState<PhuongThucThanhToan>();
  const [chiTietId, setChiTietId] =
    useState<string | null>(null);
  const [trang, setTrang] = useState(1);

  const [paymentCanXacNhan, setPaymentCanXacNhan] =
    useState<ThanhToanQuanTri | null>(null);
  const [refundCanXacNhan, setRefundCanXacNhan] =
    useState<HoanTienQuanTri | null>(null);

  const [formThanhToan] = Form.useForm<FormThanhToan>();
  const [formHoanTien] = Form.useForm<FormHoanTien>();

  const query = useQuery({
    queryKey: [
      'quan-tri',
      'thanh-toan',
      trang,
      tuKhoa,
      trangThai,
      phuongThuc,
    ],
    queryFn: () =>
      thanhToanQuanTriApi.danhSach({
        trang,
        kichThuoc: 20,
        tuKhoa: tuKhoa || undefined,
        trangThai,
        phuongThuc,
      }),
  });

  const chiTietQuery = useQuery({
    queryKey: [
      'quan-tri',
      'thanh-toan',
      'chi-tiet',
      chiTietId,
    ],
    queryFn: () =>
      thanhToanQuanTriApi.chiTiet(chiTietId!),
    enabled: Boolean(chiTietId),
  });

  const xacNhanMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: FormThanhToan;
    }) =>
      thanhToanQuanTriApi.xacNhanThuCong(id, payload),
    onSuccess: async (data) => {
      message.success('Đã ghi nhận thanh toán.');
      setPaymentCanXacNhan(null);
      formThanhToan.resetFields();
      setChiTietId(data.id);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['quan-tri', 'thanh-toan'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['quan-tri', 'dat-ban'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['quan-tri', 'dashboard'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['quan-tri', 'bao-cao'],
        }),
      ]);
      await chiTietQuery.refetch();
    },
    onError: (error) =>
      message.error(
        error instanceof LoiApi
          ? error.message
          : 'Không xác nhận được thanh toán.',
      ),
  });

  const hoanTienMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: FormHoanTien;
    }) =>
      thanhToanQuanTriApi.xacNhanHoanTien(id, payload),
    onSuccess: async (data) => {
      message.success('Đã xác nhận hoàn tiền.');
      setRefundCanXacNhan(null);
      formHoanTien.resetFields();
      setChiTietId(data.id);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['quan-tri', 'thanh-toan'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['quan-tri', 'dat-ban'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['quan-tri', 'dashboard'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['quan-tri', 'bao-cao'],
        }),
      ]);
      await chiTietQuery.refetch();
    },
    onError: (error) =>
      message.error(
        error instanceof LoiApi
          ? error.message
          : 'Không xác nhận được hoàn tiền.',
      ),
  });

  const ds = query.data?.danhSach ?? [];
  const tong = query.data?.phanTrang.tong ?? 0;
  const tongHop = query.data?.tongHop ?? {
    tongGiaoDich: 0,
    tongDaThu: 0,
    tongDaHoan: 0,
    thucThu: 0,
    choThanhToan: 0,
    choHoanTien: 0,
  };

  const chiTiet = chiTietQuery.data;

  return (
    <>
      <TieuDeTrang
        tieuDe="Thanh toán & hoàn tiền"
        moTa="Theo dõi tiền khách đã thanh toán, giao dịch chờ xử lý và các yêu cầu hoàn tiền."
        hanhDong={
          <Button
            icon={<ReloadOutlined />}
            onClick={() => query.refetch()}
          >
            Làm mới
          </Button>
        }
      />

      <CanhBaoLoi
        loi={query.error}
        macDinh="Không tải được danh sách thanh toán."
      />

      <Row gutter={[16, 16]} className="mb-16">
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic
              title="Giao dịch theo bộ lọc"
              value={tongHop.tongGiaoDich}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic
              title="Đã thu theo bộ lọc"
              value={tongHop.tongDaThu}
              formatter={(value) =>
                dinhDangTien(Number(value))
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic
              title="Đã hoàn theo bộ lọc"
              value={tongHop.tongDaHoan}
              formatter={(value) =>
                dinhDangTien(Number(value))
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic
              title="Thực thu theo bộ lọc"
              value={tongHop.thucThu}
              formatter={(value) =>
                dinhDangTien(Number(value))
              }
            />
          </Card>
        </Col>
      </Row>

      {tongHop.choThanhToan > 0 ||
      tongHop.choHoanTien > 0 ? (
        <Alert
          className="mb-16"
          type={
            tongHop.choHoanTien > 0
              ? 'warning'
              : 'info'
          }
          showIcon
          message="Có giao dịch cần xử lý"
          description={
            <>
              {tongHop.choThanhToan} giao dịch chờ thanh toán ·{' '}
              {tongHop.choHoanTien} yêu cầu hoàn tiền chờ xử lý.
              Yêu cầu hoàn tiền chỉ được đánh dấu hoàn tất bởi tài
              khoản có quyền thực hiện hoàn tiền.
            </>
          }
        />
      ) : null}

      <Card className="admin-table-card">
        <div className="admin-finance-filters">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            value={tuKhoa}
            onChange={(event) => {
              setTuKhoa(event.target.value);
              setTrang(1);
            }}
            placeholder="Mã thanh toán / đặt bàn / giao dịch"
          />
          <Select
            allowClear
            value={trangThai}
            onChange={(value) => {
              setTrangThai(value);
              setTrang(1);
            }}
            placeholder="Trạng thái"
            options={Object.entries(NHAN_THANH_TOAN).map(
              ([value, label]) => ({ value, label }),
            )}
          />
          <Select
            allowClear
            value={phuongThuc}
            onChange={(value) => {
              setPhuongThuc(value);
              setTrang(1);
            }}
            placeholder="Phương thức"
            options={Object.entries(NHAN_PHUONG_THUC).map(
              ([value, label]) => ({ value, label }),
            )}
          />
        </div>

        <Table
          rowKey="id"
          loading={query.isPending || query.isFetching}
          dataSource={ds}
          scroll={{ x: 1120 }}
          pagination={{
            current: query.data?.phanTrang.trang ?? trang,
            pageSize: query.data?.phanTrang.kichThuoc ?? 20,
            total: tong,
            showSizeChanger: false,
            onChange: setTrang,
          }}
          columns={[
            {
              title: 'Mã thanh toán',
              dataIndex: 'maThanhToan',
              width: 185,
              render: (value: string) => (
                <Typography.Text copyable>
                  {value}
                </Typography.Text>
              ),
            },
            {
              title: 'Đặt bàn',
              width: 190,
              render: (_: unknown, row: ThanhToanQuanTri) => (
                <div>
                  <strong>{row.datBan.maDatBan}</strong>
                  <div>
                    <Typography.Text type="secondary">
                      {row.datBan.hoTen}
                    </Typography.Text>
                  </div>
                </div>
              ),
            },
            {
              title: 'Số tiền',
              dataIndex: 'soTien',
              width: 135,
              align: 'right',
              render: (value: number) => (
                <strong>{dinhDangTien(value)}</strong>
              ),
            },
            {
              title: 'Phương thức',
              dataIndex: 'phuongThuc',
              width: 135,
              render: (
                value: PhuongThucThanhToan,
                row: ThanhToanQuanTri,
              ) => hienThiPhuongThuc(value, row.trangThai),
            },
            {
              title: 'Trạng thái',
              dataIndex: 'trangThai',
              width: 145,
              render: (value: TrangThaiThanhToan) => (
                <Tag color={MAU_THANH_TOAN[value]}>
                  {NHAN_THANH_TOAN[value]}
                </Tag>
              ),
            },
            {
              title: 'Đã hoàn',
              dataIndex: 'tongHoan',
              width: 125,
              align: 'right',
              render: (value?: number) =>
                dinhDangTien(value ?? 0),
            },
            {
              title: 'Hoàn tiền',
              width: 150,
              render: (
                _: unknown,
                row: ThanhToanQuanTri,
              ) =>
                row.coHoanTienDangCho ? (
                  <Tag color="gold">Chờ xử lý</Tag>
                ) : (row.tongHoan ?? 0) > 0 ? (
                  <Tag color="cyan">
                    Đã hoàn {dinhDangTien(row.tongHoan ?? 0)}
                  </Tag>
                ) : (
                  <Typography.Text type="secondary">
                    —
                  </Typography.Text>
                ),
            },
            {
              title: 'Ngày tạo',
              dataIndex: 'ngayTao',
              width: 170,
              render: (value: string) =>
                dinhDangNgayGio(value),
            },
            {
              title: 'Thao tác',
              width: 115,
              fixed: 'right',
              render: (_: unknown, row: ThanhToanQuanTri) => (
                <Button
                  size="small"
                  type={
                    row.coHoanTienDangCho &&
                    coQuyen('HOAN_TIEN_THUC_HIEN')
                      ? 'primary'
                      : 'default'
                  }
                  icon={
                    row.coHoanTienDangCho
                      ? <UndoOutlined />
                      : <EyeOutlined />
                  }
                  onClick={() => setChiTietId(row.id)}
                >
                  {row.coHoanTienDangCho
                    ? 'Xử lý hoàn'
                    : 'Chi tiết'}
                </Button>
              ),
            },
          ]}
        />
      </Card>

      <Drawer
        width={660}
        open={Boolean(chiTietId)}
        onClose={() => setChiTietId(null)}
        title={
          chiTiet
            ? `Thanh toán ${chiTiet.maThanhToan}`
            : 'Chi tiết thanh toán'
        }
      >
        {chiTietQuery.isPending ? (
          <Card loading bordered={false} />
        ) : chiTietQuery.error ? (
          <Alert
            type="error"
            showIcon
            message={
              chiTietQuery.error instanceof LoiApi
                ? chiTietQuery.error.message
                : 'Không tải được chi tiết.'
            }
          />
        ) : chiTiet ? (
          <>
            <Space wrap className="mb-16">
              <Tag color={MAU_THANH_TOAN[chiTiet.trangThai]}>
                {NHAN_THANH_TOAN[chiTiet.trangThai]}
              </Tag>
              <TrangThai value={chiTiet.datBan.trangThai} />
            </Space>

            <Descriptions
              bordered
              column={1}
              items={[
                {
                  key: 'ma',
                  label: 'Mã thanh toán',
                  children: (
                    <Typography.Text copyable>
                      {chiTiet.maThanhToan}
                    </Typography.Text>
                  ),
                },
                {
                  key: 'soTien',
                  label: 'Số tiền',
                  children: (
                    <strong>{dinhDangTien(chiTiet.soTien)}</strong>
                  ),
                },
                {
                  key: 'pt',
                  label: 'Phương thức',
                  children: hienThiPhuongThuc(
                    chiTiet.phuongThuc,
                    chiTiet.trangThai,
                  ),
                },
                {
                  key: 'giaoDich',
                  label: 'Mã giao dịch',
                  children:
                    chiTiet.maGiaoDichCong ? (
                      <Typography.Text copyable>
                        {chiTiet.maGiaoDichCong}
                      </Typography.Text>
                    ) : (
                      '—'
                    ),
                },
                {
                  key: 'thoiGian',
                  label: 'Thanh toán lúc',
                  children: chiTiet.thoiGianThanhToan
                    ? dinhDangNgayGio(
                        chiTiet.thoiGianThanhToan,
                      )
                    : '—',
                },
                {
                  key: 'ghiChu',
                  label: 'Ghi chú',
                  children: chiTiet.ghiChu || '—',
                },
              ]}
            />

            {chiTiet.trangThai === 'CHO_THANH_TOAN' &&
            coQuyen('THANH_TOAN_QUAN_LY') ? (
              <Button
                type="primary"
                icon={<CreditCardOutlined />}
                className="mt-16"
                onClick={() => {
                  formThanhToan.setFieldsValue({
                    phuongThuc: 'CHUYEN_KHOAN',
                    maGiaoDichCong: undefined,
                    ghiChu: undefined,
                  });
                  setPaymentCanXacNhan(chiTiet);
                }}
              >
                Xác nhận thanh toán thủ công
              </Button>
            ) : null}

            <Divider titlePlacement="start">
              Đặt bàn
            </Divider>

            <Descriptions
              bordered
              column={1}
              items={[
                {
                  key: 'booking',
                  label: 'Mã đặt bàn',
                  children: (
                    <Typography.Text copyable>
                      {chiTiet.datBan.maDatBan}
                    </Typography.Text>
                  ),
                },
                {
                  key: 'khach',
                  label: 'Khách hàng',
                  children:
                    `${chiTiet.datBan.hoTen} · ` +
                    chiTiet.datBan.soDienThoai,
                },
                {
                  key: 'ngay',
                  label: 'Ngày',
                  children: dinhDangNgay(
                    chiTiet.datBan.ngayDat,
                  ),
                },
                {
                  key: 'tamTinh',
                  label: 'Tiền món',
                  children: dinhDangTien(
                    chiTiet.datBan.tamTinhMon ?? 0,
                  ),
                },
                {
                  key: 'giam',
                  label: 'Giảm giá',
                  children:
                    `-${dinhDangTien(
                      chiTiet.datBan.tienGiam ?? 0,
                    )}`,
                },
                {
                  key: 'coc',
                  label: 'Cọc giữ bàn',
                  children: dinhDangTien(
                    chiTiet.datBan.tienCoc ?? 0,
                  ),
                },
                {
                  key: 'tong',
                  label: 'Thanh toán trước',
                  children: (
                    <strong>
                      {dinhDangTien(
                        chiTiet.datBan
                          .tongThanhToanTruoc ?? 0,
                      )}
                    </strong>
                  ),
                },
              ]}
            />

            <Divider titlePlacement="start">
              Hoàn tiền
            </Divider>

            {chiTiet.hoanTien?.length ? (
              <Space
                direction="vertical"
                size={12}
                style={{ width: '100%' }}
              >
                {chiTiet.hoanTien.map((item) => (
                  <TheHoanTien
                    key={item.id}
                    item={item}
                    coQuyenHoan={coQuyen(
                      'HOAN_TIEN_THUC_HIEN',
                    )}
                    dangXuLy={
                      hoanTienMutation.isPending &&
                      refundCanXacNhan?.id === item.id
                    }
                    onXacNhan={(refund) => {
                      formHoanTien.resetFields();
                      setRefundCanXacNhan(refund);
                    }}
                  />
                ))}
              </Space>
            ) : (
              <Alert
                type="info"
                showIcon
                message="Giao dịch chưa có yêu cầu hoàn tiền."
              />
            )}
          </>
        ) : null}
      </Drawer>

      <Modal
        open={Boolean(paymentCanXacNhan)}
        title="Xác nhận thanh toán thủ công"
        okText="Ghi nhận đã thanh toán"
        cancelText="Đóng"
        confirmLoading={xacNhanMutation.isPending}
        onCancel={() => setPaymentCanXacNhan(null)}
        onOk={() => formThanhToan.submit()}
        destroyOnHidden
      >
        <Form
          form={formThanhToan}
          layout="vertical"
          onFinish={(values) => {
            if (!paymentCanXacNhan) return;
            xacNhanMutation.mutate({
              id: paymentCanXacNhan.id,
              payload: values,
            });
          }}
        >
          <Alert
            type="warning"
            showIcon
            message="Chỉ xác nhận sau khi đã kiểm tra tiền thực tế."
            className="mb-16"
          />
          <Form.Item
            name="phuongThuc"
            label="Phương thức"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                {
                  value: 'CHUYEN_KHOAN',
                  label: 'Chuyển khoản',
                },
                {
                  value: 'TIEN_MAT',
                  label: 'Tiền mặt',
                },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="maGiaoDichCong"
            label="Mã giao dịch / tham chiếu"
          >
            <Input maxLength={120} />
          </Form.Item>
          <Form.Item name="ghiChu" label="Ghi chú">
            <Input.TextArea rows={3} maxLength={500} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={Boolean(refundCanXacNhan)}
        title="Xác nhận đã hoàn tiền"
        okText="Xác nhận hoàn"
        cancelText="Đóng"
        confirmLoading={hoanTienMutation.isPending}
        onCancel={() => setRefundCanXacNhan(null)}
        onOk={() => formHoanTien.submit()}
        destroyOnHidden
      >
        <Alert
          type="warning"
          showIcon
          message={
            refundCanXacNhan
              ? `Xác nhận đã hoàn ${dinhDangTien(
                  refundCanXacNhan.soTien,
                )}.`
              : ''
          }
          description="Thao tác này đánh dấu yêu cầu hoàn là đã hoàn thành."
          className="mb-16"
        />
        <Form
          form={formHoanTien}
          layout="vertical"
          onFinish={(values) => {
            if (!refundCanXacNhan) return;
            hoanTienMutation.mutate({
              id: refundCanXacNhan.id,
              payload: values,
            });
          }}
        >
          <Form.Item
            name="maGiaoDichCong"
            label="Mã giao dịch hoàn"
          >
            <Input maxLength={120} />
          </Form.Item>
          <Form.Item name="ghiChu" label="Ghi chú">
            <Input.TextArea rows={3} maxLength={500} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
