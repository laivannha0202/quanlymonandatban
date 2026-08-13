import {
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CreditCardOutlined,
  EyeOutlined,
  GiftOutlined,
  ShoppingOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App,
  Button,
  Card,
  Descriptions,
  Divider,
  Drawer,
  Empty,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { dinhDangTien } from '@/cau-hinh/dinh-dang';
import { khoaTruyVan } from '@/cau-hinh/khoa-truy-van';
import {
  dinhDangGio,
  dinhDangNgay,
  dinhDangNgayGio,
} from '@/cau-hinh/ngay-gio';
import { datBanApi } from '@/dich-vu/dat-ban.api';
import { LoiApi } from '@/dich-vu/http';
import { thanhToanApi } from '@/dich-vu/thanh-toan.api';
import type {
  DatBan,
  HoanTienDatBan,
  ThanhToanDatBan,
} from '@/kieu/nghiep-vu';
import type {
  PhuongThucThanhToan,
  TrangThaiHoanTien,
  TrangThaiThanhToan,
} from '@/kieu/trang-thai';
import { KhungTaiKhoan } from '@/thanh-phan/khung-tai-khoan';
import { TrangThai } from '@/thanh-phan/trang-thai';
import './lich-su-dat-ban-finance.css';

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

function taoKhoaIdempotency(maThanhToan: string): string {
  const storageKey =
    `nha-hang:payment-idempotency:${maThanhToan}`;

  const daCo =
    typeof window !== 'undefined'
      ? window.sessionStorage.getItem(storageKey)
      : null;

  if (daCo) {
    return daCo;
  }

  const moi =
    typeof crypto !== 'undefined' &&
    'randomUUID' in crypto
      ? `checkout-${crypto.randomUUID()}`
      : `checkout-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 12)}`;

  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(storageKey, moi);
  }

  return moi;
}

function tongDaHoan(payment: ThanhToanDatBan): number {
  return (payment.hoanTien ?? [])
    .filter((item) => item.trangThai === 'DA_HOAN')
    .reduce((tong, item) => tong + item.soTien, 0);
}

function TheThanhToan({ payment }: { payment: ThanhToanDatBan }) {
  return (
    <Card
      size="small"
      className="customer-payment-card"
      title={
        <Space wrap>
          <CreditCardOutlined />
          <Typography.Text strong>
            {payment.maThanhToan}
          </Typography.Text>
        </Space>
      }
      extra={
        <Tag color={MAU_THANH_TOAN[payment.trangThai]}>
          {NHAN_THANH_TOAN[payment.trangThai]}
        </Tag>
      }
    >
      <div className="customer-finance-row">
        <span>Số tiền</span>
        <strong>{dinhDangTien(payment.soTien)}</strong>
      </div>
      <div className="customer-finance-row">
        <span>Phương thức</span>
        <span>{NHAN_PHUONG_THUC[payment.phuongThuc]}</span>
      </div>
      {payment.thoiGianThanhToan ? (
        <div className="customer-finance-row">
          <span>Thanh toán lúc</span>
          <span>{dinhDangNgayGio(payment.thoiGianThanhToan)}</span>
        </div>
      ) : null}
      {payment.maGiaoDichCong ? (
        <div className="customer-finance-row">
          <span>Mã giao dịch</span>
          <Typography.Text copyable>
            {payment.maGiaoDichCong}
          </Typography.Text>
        </div>
      ) : null}

      {(payment.hoanTien?.length ?? 0) > 0 ? (
        <>
          <Divider titlePlacement="start" plain>
            Hoàn tiền
          </Divider>
          <Space
            direction="vertical"
            size={10}
            style={{ width: '100%' }}
          >
            {payment.hoanTien!.map((refund) => (
              <TheHoanTien key={refund.id} refund={refund} />
            ))}
          </Space>
          <div className="customer-refund-total">
            <span>Đã hoàn thành công</span>
            <strong>{dinhDangTien(tongDaHoan(payment))}</strong>
          </div>
        </>
      ) : null}
    </Card>
  );
}

function TheHoanTien({ refund }: { refund: HoanTienDatBan }) {
  return (
    <div className="customer-refund-item">
      <div className="customer-refund-heading">
        <Space wrap>
          <UndoOutlined />
          <Typography.Text strong>
            {refund.maHoanTien}
          </Typography.Text>
        </Space>
        <Tag color={MAU_HOAN_TIEN[refund.trangThai]}>
          {NHAN_HOAN_TIEN[refund.trangThai]}
        </Tag>
      </div>
      <div className="customer-finance-row">
        <span>Số tiền</span>
        <strong>{dinhDangTien(refund.soTien)}</strong>
      </div>
      <div className="customer-finance-row">
        <span>Lý do</span>
        <span>{refund.lyDo || '—'}</span>
      </div>
      {refund.thoiGianHoan ? (
        <div className="customer-finance-row">
          <span>Hoàn lúc</span>
          <span>{dinhDangNgayGio(refund.thoiGianHoan)}</span>
        </div>
      ) : null}
    </div>
  );
}

export function LichSuDatBan() {
  const { modal, message } = App.useApp();
  const queryClient = useQueryClient();
  const [chiTietId, setChiTietId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: khoaTruyVan.datBanCuaToi,
    queryFn: () => datBanApi.cuaToi(),
  });

  const chiTietQuery = useQuery({
    queryKey: [
      ...khoaTruyVan.datBanCuaToi,
      'chi-tiet',
      chiTietId,
    ],
    queryFn: () => datBanApi.chiTietCuaToi(chiTietId!),
    enabled: Boolean(chiTietId),
  });

  const ds = query.data?.danhSach ?? [];
  const loi =
    query.error instanceof LoiApi
      ? query.error.message
      : query.error
        ? 'Không tải được lịch đặt.'
        : '';

  const huyMutation = useMutation({
    mutationFn: (id: string) => datBanApi.huyCuaToi(id),
    onSuccess: async (_, id) => {
      message.success(
        'Đã hủy đặt bàn. Nếu đã thanh toán, trạng thái hoàn tiền được cập nhật trong chi tiết.',
      );
      await queryClient.invalidateQueries({
        queryKey: khoaTruyVan.datBanCuaToi,
      });
      if (chiTietId === id) {
        await chiTietQuery.refetch();
      }
    },
    onError: (error) =>
      message.error(
        error instanceof LoiApi
          ? error.message
          : 'Không hủy được đặt bàn.',
      ),
  });

  const thanhToanMutation = useMutation({
    mutationFn: async (data: {
      datBan: DatBan;
      payment: ThanhToanDatBan;
    }) =>
      thanhToanApi.xacNhanMoPhong({
        maDatBan: data.datBan.maDatBan,
        soDienThoai: data.datBan.soDienThoai,
        maThanhToan: data.payment.maThanhToan,
        khoaIdempotency: taoKhoaIdempotency(
          data.payment.maThanhToan,
        ),
      }),
    onSuccess: async () => {
      message.success('Thanh toán thành công.');
      await queryClient.invalidateQueries({
        queryKey: khoaTruyVan.datBanCuaToi,
      });
      await chiTietQuery.refetch();
    },
    onError: (error) =>
      message.error(
        error instanceof LoiApi
          ? error.message
          : 'Không thể thanh toán.',
      ),
  });

  const huy = (row: DatBan) =>
    modal.confirm({
      title: 'Hủy đặt bàn này?',
      content:
        `${row.maDatBan} · ${dinhDangNgay(row.ngayDat)}. ` +
        'Nếu booking đã thanh toán và còn trong thời hạn hủy, hệ thống sẽ xử lý hoàn tiền theo chính sách.',
      okText: 'Hủy đặt bàn',
      okButtonProps: { danger: true },
      cancelText: 'Giữ lại',
      onOk: () => huyMutation.mutateAsync(row.id),
    });

  const chiTiet = chiTietQuery.data;

  const tongSoLuongMon = useMemo(
    () =>
      (chiTiet?.monAn ?? []).reduce(
        (tong, item) => tong + item.soLuong,
        0,
      ),
    [chiTiet?.monAn],
  );

  const paymentChoThanhToan = useMemo(
    () =>
      (chiTiet?.thanhToan ?? []).find(
        (item) => item.trangThai === 'CHO_THANH_TOAN',
      ) ?? null,
    [chiTiet?.thanhToan],
  );

  return (
    <KhungTaiKhoan
      tieuDe="Lịch đặt bàn"
      moTa="Theo dõi đặt bàn, món đặt trước, thanh toán và hoàn tiền."
    >
      {loi ? (
        <Alert
          type="error"
          message={loi}
          showIcon
          className="mb-16"
        />
      ) : null}

      <Card className="account-data-card">
        {!query.isPending && ds.length === 0 ? (
          <Empty description="Bạn chưa có lịch đặt bàn">
            <Button
              type="primary"
              href="/dat-ban"
              icon={<CalendarOutlined />}
            >
              Đặt bàn ngay
            </Button>
          </Empty>
        ) : (
          <Table
            rowKey="id"
            loading={query.isPending}
            dataSource={ds}
            pagination={false}
            scroll={{ x: 900 }}
            columns={[
              {
                title: 'Mã',
                dataIndex: 'maDatBan',
                width: 170,
              },
              {
                title: 'Ngày',
                dataIndex: 'ngayDat',
                width: 120,
                render: (value: string) => dinhDangNgay(value),
              },
              {
                title: 'Giờ',
                dataIndex: 'gioBatDau',
                width: 160,
                render: (value: string) => dinhDangNgayGio(value),
              },
              {
                title: 'Khách',
                dataIndex: 'soNguoi',
                width: 80,
                render: (value: number) => `${value} người`,
              },
              {
                title: 'Trạng thái',
                dataIndex: 'trangThai',
                width: 140,
                render: (value: string) => <TrangThai value={value} />,
              },
              {
                title: 'Thao tác',
                width: 180,
                render: (_: unknown, row: DatBan) => (
                  <Space>
                    <Button
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => setChiTietId(row.id)}
                    >
                      Chi tiết
                    </Button>
                    {['CHO_XAC_NHAN', 'DA_XAC_NHAN'].includes(
                      row.trangThai,
                    ) ? (
                      <Button
                        danger
                        size="small"
                        icon={<CloseCircleOutlined />}
                        loading={
                          huyMutation.isPending &&
                          huyMutation.variables === row.id
                        }
                        onClick={() => huy(row)}
                      >
                        Hủy
                      </Button>
                    ) : null}
                  </Space>
                ),
              },
            ]}
          />
        )}
      </Card>

      <Drawer
        width={620}
        open={Boolean(chiTietId)}
        onClose={() => setChiTietId(null)}
        title={
          chiTiet
            ? `Đặt bàn ${chiTiet.maDatBan}`
            : 'Chi tiết đặt bàn'
        }
      >
        {chiTietQuery.isPending && chiTietId ? (
          <Card loading bordered={false} />
        ) : chiTietQuery.error ? (
          <Alert
            type="error"
            showIcon
            message={
              chiTietQuery.error instanceof LoiApi
                ? chiTietQuery.error.message
                : 'Không tải được chi tiết đặt bàn.'
            }
          />
        ) : chiTiet ? (
          <>
            <Space className="mb-24" wrap>
              <TrangThai value={chiTiet.trangThai} />
              {paymentChoThanhToan ? (
                <Tag color="gold">Còn thanh toán</Tag>
              ) : null}
            </Space>

            <Descriptions
              bordered
              column={1}
              items={[
                {
                  key: 'ten',
                  label: 'Khách hàng',
                  children: chiTiet.hoTen || '—',
                },
                {
                  key: 'sdt',
                  label: 'Số điện thoại',
                  children: chiTiet.soDienThoai || '—',
                },
                {
                  key: 'email',
                  label: 'Email',
                  children: chiTiet.email || '—',
                },
                {
                  key: 'ngay',
                  label: 'Ngày',
                  children: dinhDangNgay(chiTiet.ngayDat),
                },
                {
                  key: 'gio',
                  label: 'Giờ',
                  children:
                    `${dinhDangGio(chiTiet.gioBatDau)} – ` +
                    dinhDangGio(chiTiet.gioKetThuc),
                },
                {
                  key: 'nguoi',
                  label: 'Số người',
                  children: `${chiTiet.soNguoi} khách`,
                },
                {
                  key: 'ban',
                  label: 'Bàn',
                  children:
                    chiTiet.banAns
                      ?.map((b) => b.tenBan || b.maBan)
                      .join(', ') || 'Hệ thống sẽ sắp',
                },
                {
                  key: 'ghiChu',
                  label: 'Ghi chú',
                  children: chiTiet.ghiChuKhach || '—',
                },
              ]}
            />

            <Divider titlePlacement="start">
              <Space>
                <ShoppingOutlined />
                Món đặt trước
              </Space>
            </Divider>

            {chiTiet.monAn?.length ? (
              <>
                <div className="customer-preorder-list">
                  {chiTiet.monAn.map((item) => (
                    <div
                      key={`${item.monAnId}-${item.id ?? ''}`}
                      className="customer-preorder-row"
                    >
                      <div>
                        <Typography.Text strong>
                          {item.tenMon}
                        </Typography.Text>
                        <div>
                          <Typography.Text type="secondary">
                            {dinhDangTien(item.donGia)} × {item.soLuong}
                          </Typography.Text>
                        </div>
                        {item.ghiChu ? (
                          <Typography.Text
                            type="secondary"
                            className="customer-preorder-note"
                          >
                            Ghi chú: {item.ghiChu}
                          </Typography.Text>
                        ) : null}
                      </div>
                      <strong>{dinhDangTien(item.thanhTien)}</strong>
                    </div>
                  ))}
                </div>
                <Typography.Text type="secondary">
                  Tổng {tongSoLuongMon} phần món
                </Typography.Text>
              </>
            ) : (
              <Alert
                type="info"
                showIcon
                message="Booking này không đặt món trước."
              />
            )}

            <Divider titlePlacement="start">
              <Space>
                <GiftOutlined />
                Ưu đãi & số tiền
              </Space>
            </Divider>

            <div className="customer-finance-box">
              <div className="customer-finance-row">
                <span>Tiền món</span>
                <strong>
                  {dinhDangTien(chiTiet.tamTinhMon ?? 0)}
                </strong>
              </div>
              <div className="customer-finance-row">
                <span>Giảm giá</span>
                <strong>
                  -{dinhDangTien(chiTiet.tienGiam ?? 0)}
                </strong>
              </div>
              {chiTiet.maKhuyenMaiApDung ? (
                <div className="customer-finance-row">
                  <span>Mã ưu đãi</span>
                  <Tag color="green">
                    {chiTiet.maKhuyenMaiApDung}
                  </Tag>
                </div>
              ) : null}
              <div className="customer-finance-row">
                <span>Cọc giữ bàn</span>
                <strong>
                  {dinhDangTien(chiTiet.tienCoc ?? 0)}
                </strong>
              </div>
              <Divider />
              <div className="customer-finance-row total">
                <span>Thanh toán trước</span>
                <strong>
                  {dinhDangTien(
                    chiTiet.tongThanhToanTruoc ?? 0,
                  )}
                </strong>
              </div>
            </div>

            <Divider titlePlacement="start">
              <Space>
                <CreditCardOutlined />
                Thanh toán & hoàn tiền
              </Space>
            </Divider>

            {chiTiet.thanhToan?.length ? (
              <Space
                direction="vertical"
                size={12}
                style={{ width: '100%' }}
              >
                {chiTiet.thanhToan.map((payment) => (
                  <TheThanhToan
                    key={payment.id}
                    payment={payment}
                  />
                ))}
              </Space>
            ) : (
              <Alert
                type="info"
                showIcon
                message="Booking này chưa có giao dịch thanh toán."
              />
            )}

            {paymentChoThanhToan &&
            ['CHO_XAC_NHAN', 'DA_XAC_NHAN'].includes(
              chiTiet.trangThai,
            ) ? (
              <Button
                type="primary"
                block
                size="large"
                icon={<CreditCardOutlined />}
                loading={thanhToanMutation.isPending}
                onClick={() =>
                  thanhToanMutation.mutate({
                    datBan: chiTiet,
                    payment: paymentChoThanhToan,
                  })
                }
                className="mt-16"
              >
                Thanh toán mô phỏng
              </Button>
            ) : null}

            {chiTiet.trangThai === 'DA_XAC_NHAN' &&
            chiTiet.thanhToan?.some(
              (item) => item.trangThai === 'DA_THANH_TOAN',
            ) ? (
              <Alert
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
                message="Đặt bàn đã thanh toán và xác nhận."
                className="mt-16"
              />
            ) : null}

            {['CHO_XAC_NHAN', 'DA_XAC_NHAN'].includes(
              chiTiet.trangThai,
            ) ? (
              <Button
                danger
                block
                className="mt-16"
                loading={
                  huyMutation.isPending &&
                  huyMutation.variables === chiTiet.id
                }
                onClick={() => huy(chiTiet)}
              >
                Hủy đặt bàn
              </Button>
            ) : null}
          </>
        ) : null}
      </Drawer>
    </KhungTaiKhoan>
  );
}
