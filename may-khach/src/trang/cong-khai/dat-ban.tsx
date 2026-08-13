import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CreditCardOutlined,
  EnvironmentOutlined,
  GiftOutlined,
  MinusOutlined,
  PlusOutlined,
  SearchOutlined,
  ShoppingOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Form,
  Input,
  InputNumber,
  Radio,
  Result,
  Row,
  Select,
  Space,
  Spin,
  Steps,
  Tag,
  Typography,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { dinhDangTien } from '@/cau-hinh/dinh-dang';
import { dinhDangNgay } from '@/cau-hinh/ngay-gio';
import {
  datBanApi,
  type BaoGiaDatBan,
  type KetQuaTaoDatBan,
  type MonDatTruocPayload,
  type TaoDatBanPayload,
} from '@/dich-vu/dat-ban.api';
import { khachHangApi, type HoSoKhachHang } from '@/dich-vu/khach-hang.api';
import { LoiApi } from '@/dich-vu/http';
import {
  thanhToanApi,
  type KetQuaThanhToan,
} from '@/dich-vu/thanh-toan.api';
import { heThongApi, type KhuyenMai } from '@/dich-vu/he-thong.api';
import { thucDonApi } from '@/dich-vu/thuc-don.api';
import { useXacThuc } from '@/ngu-canh/xac-thuc.context';
import type { BanAnPhuongAn, MonAn } from '@/kieu/nghiep-vu';
import './dat-ban-finance.css';

type GiaTriForm = Pick<
  TaoDatBanPayload,
  | 'hoTen'
  | 'soDienThoai'
  | 'email'
  | 'ngay'
  | 'gioBatDau'
  | 'soNguoi'
  | 'ghiChu'
>;

function tenBan(p: BanAnPhuongAn): string {
  return p.banAns
    .map((b) => b.tenBan || b.maBan)
    .join(' + ');
}

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

function monThanhPayload(
  soLuongMon: Record<string, number>,
  ghiChuMon: Record<string, string>,
): MonDatTruocPayload[] {
  return Object.entries(soLuongMon)
    .filter(([, soLuong]) => soLuong > 0)
    .map(([monAnId, soLuong]) => ({
      monAnId,
      soLuong,
      ghiChu: ghiChuMon[monAnId]?.trim() || undefined,
    }));
}

export function DatBanPage() {
  const { message } = App.useApp();
  const { nguoiDung } = useXacThuc();
  const [form] = Form.useForm<GiaTriForm>();

  const ngay = Form.useWatch('ngay', { form, preserve: true });
  const gioBatDau = Form.useWatch('gioBatDau', { form, preserve: true });
  const soNguoi = Form.useWatch('soNguoi', { form, preserve: true });

  const [buoc, setBuoc] = useState(0);
  const [khungGio, setKhungGio] = useState<string[]>([]);
  const [phuongAn, setPhuongAn] = useState<BanAnPhuongAn[]>([]);
  const [chon, setChon] = useState('');
  const [dangTim, setDangTim] = useState(false);
  const [loi, setLoi] = useState('');
  const [hoSoKhach, setHoSoKhach] = useState<HoSoKhachHang | null>(null);

  const [monAn, setMonAn] = useState<MonAn[]>([]);
  const [dangTaiMon, setDangTaiMon] = useState(false);
  const [soLuongMon, setSoLuongMon] = useState<Record<string, number>>({});
  const [ghiChuMon, setGhiChuMon] = useState<Record<string, string>>({});

  const [khuyenMaiCongKhai, setKhuyenMaiCongKhai] =
    useState<KhuyenMai[]>([]);
  const [dangTaiKhuyenMai, setDangTaiKhuyenMai] =
    useState(false);
  const [maKhuyenMaiNhap, setMaKhuyenMaiNhap] = useState('');
  const [maKhuyenMaiDaApDung, setMaKhuyenMaiDaApDung] = useState('');
  const [baoGia, setBaoGia] = useState<BaoGiaDatBan | null>(null);
  const [dangTinhTien, setDangTinhTien] = useState(false);

  const [ketQua, setKetQua] = useState<KetQuaTaoDatBan | null>(null);
  const [dangTaoDatBan, setDangTaoDatBan] = useState(false);
  const [dangThanhToan, setDangThanhToan] = useState(false);
  const [thanhToanKetQua, setThanhToanKetQua] =
    useState<KetQuaThanhToan | null>(null);

  const ngayChuoi = ngay || '';

  useEffect(() => {
    if (!nguoiDung || nguoiDung.vaiTro.maVaiTro !== 'KHACH_HANG') {
      setHoSoKhach(null);
      return;
    }

    let conHieuLuc = true;
    khachHangApi
      .hoSo()
      .then((hoSo) => {
        if (!conHieuLuc) return;
        setHoSoKhach(hoSo);
        const hienTai = form.getFieldsValue([
          'hoTen',
          'soDienThoai',
          'email',
        ]);
        form.setFieldsValue({
          ...(!hienTai.hoTen?.trim() && hoSo.hoTen
            ? { hoTen: hoSo.hoTen }
            : {}),
          ...(!hienTai.soDienThoai?.trim() && hoSo.soDienThoai
            ? { soDienThoai: hoSo.soDienThoai }
            : {}),
          ...(!hienTai.email?.trim() && hoSo.email
            ? { email: hoSo.email }
            : {}),
        });
      })
      .catch(() => {
        if (conHieuLuc) setHoSoKhach(null);
      });

    return () => {
      conHieuLuc = false;
    };
  }, [form, nguoiDung]);

  useEffect(() => {
    setKhungGio([]);
    setPhuongAn([]);
    setChon('');
    form.setFieldValue('gioBatDau', undefined);

    if (!ngayChuoi) return;

    datBanApi
      .khungGio(ngayChuoi)
      .then((x) => setKhungGio(x.danhSach))
      .catch(() => setKhungGio([]));
  }, [form, ngayChuoi]);

  useEffect(() => {
    if (buoc !== 2) return;

    let conHieuLuc = true;
    setDangTaiMon(true);

    thucDonApi
      .monAn({ trang: 1, kichThuoc: 100 })
      .then((data) => {
        if (!conHieuLuc) return;
        setMonAn(
          data.danhSach.filter(
            (item) => item.conMon !== false && item.trangThai !== 'NGUNG_HOAT_DONG',
          ),
        );
      })
      .catch((error: unknown) => {
        if (!conHieuLuc) return;
        setLoi(
          error instanceof LoiApi
            ? error.message
            : 'Không tải được thực đơn.',
        );
      })
      .finally(() => {
        if (conHieuLuc) setDangTaiMon(false);
      });

    return () => {
      conHieuLuc = false;
    };
  }, [buoc]);

  const phuongAnDaChon = useMemo(() => {
    if (!chon) return null;
    return (
      phuongAn.find(
        (p) => p.banAns.map((b) => b.id).join(',') === chon,
      ) ?? null
    );
  }, [chon, phuongAn]);

  const monDaChon = useMemo(
    () =>
      monAn
        .filter((item) => (soLuongMon[item.id] ?? 0) > 0)
        .map((item) => ({
          ...item,
          soLuong: soLuongMon[item.id] ?? 0,
        })),
    [monAn, soLuongMon],
  );

  const tongMonUocTinh = useMemo(
    () =>
      monDaChon.reduce(
        (tong, item) =>
          tong +
          (item.giaKhuyenMai ?? item.gia) * item.soLuong,
        0,
      ),
    [monDaChon],
  );

  // PHASE10P_V3_BOOKING_UX
  useEffect(() => {
    let conHieuLuc = true;
    setDangTaiKhuyenMai(true);

    heThongApi
      .khuyenMaiCongKhai()
      .then((danhSach) => {
        if (conHieuLuc) {
          setKhuyenMaiCongKhai(danhSach);
        }
      })
      .catch(() => {
        if (conHieuLuc) {
          setKhuyenMaiCongKhai([]);
        }
      })
      .finally(() => {
        if (conHieuLuc) {
          setDangTaiKhuyenMai(false);
        }
      });

    return () => {
      conHieuLuc = false;
    };
  }, []);

  function dinhDangUuDai(item: KhuyenMai): string {
    if (item.loaiGiam === 'PHAN_TRAM') {
      return `Giảm ${Number(item.giaTri).toLocaleString('vi-VN')}%`;
    }

    return `Giảm ${Number(item.giaTri).toLocaleString('vi-VN')} ₫`;
  }

  async function timBan() {
    try {
      const v = await form.validateFields([
        'hoTen',
        'soDienThoai',
        'ngay',
        'gioBatDau',
        'soNguoi',
      ]);
      if (!v.ngay || !v.gioBatDau || !v.soNguoi) return;

      setDangTim(true);
      setLoi('');
      const kq = await datBanApi.timBan({
        ngay: v.ngay,
        gioBatDau: v.gioBatDau,
        soNguoi: v.soNguoi,
      });

      setPhuongAn(kq.phuongAn);
      setChon('');

      if (!kq.coBan || kq.phuongAn.length === 0) {
        message.warning(
          'Khung giờ này chưa có phương án bàn phù hợp.',
        );
        return;
      }

      setBuoc(1);
    } catch (error) {
      if (error instanceof LoiApi) setLoi(error.message);
    } finally {
      setDangTim(false);
    }
  }

  function capNhatSoLuong(monAnId: string, giaTri: number) {
    const soLuong = Math.max(0, Math.min(99, Math.round(giaTri)));
    setSoLuongMon((hienTai) => {
      const moi = { ...hienTai };
      if (soLuong <= 0) delete moi[monAnId];
      else moi[monAnId] = soLuong;
      return moi;
    });

    if (soLuong <= 0) {
      setGhiChuMon((hienTai) => {
        if (!(monAnId in hienTai)) return hienTai;
        const moi = { ...hienTai };
        delete moi[monAnId];
        return moi;
      });
    }
  }

  function capNhatGhiChuMon(monAnId: string, giaTri: string) {
    setGhiChuMon((hienTai) => {
      const moi = { ...hienTai };
      if (!giaTri) delete moi[monAnId];
      else moi[monAnId] = giaTri;
      return moi;
    });
  }

  async function tinhBaoGia(maKhuyenMai?: string) {
    try {
      setDangTinhTien(true);
      setLoi('');
      const code = maKhuyenMai?.trim() || undefined;
      const kq = await datBanApi.tinhTien({
        monAn: monThanhPayload(soLuongMon, ghiChuMon),
        soDienThoai: form.getFieldValue('soDienThoai')?.trim() || undefined,
        maKhuyenMai: code,
      });
      setBaoGia(kq);
      setMaKhuyenMaiDaApDung(
        kq.khuyenMai?.maKhuyenMai ?? '',
      );
      return kq;
    } catch (error) {
      setBaoGia(null);
      setMaKhuyenMaiDaApDung('');
      setLoi(
        error instanceof LoiApi
          ? error.message
          : 'Không tính được số tiền cần thanh toán.',
      );
      return null;
    } finally {
      setDangTinhTien(false);
    }
  }

  async function sangBuocThanhToan() {
    const kq = await tinhBaoGia();
    if (!kq) return;
    setMaKhuyenMaiNhap('');
    setBuoc(3);
  }

  async function apDungKhuyenMai(maGoiY?: string) {
    if (monDaChon.length === 0) {
      message.info(
        'Mã ưu đãi chỉ áp dụng cho món đặt trước. Hãy chọn ít nhất một món.',
      );
      return;
    }

    const code = (maGoiY ?? maKhuyenMaiNhap).trim();
    if (!code) {
      await tinhBaoGia();
      return;
    }

    const kq = await tinhBaoGia(code);
    if (kq?.khuyenMai) {
      message.success(
        `Đã áp dụng ${kq.khuyenMai.maKhuyenMai}.`,
      );
    }
  }

  async function boKhuyenMai() {
    setMaKhuyenMaiNhap('');
    await tinhBaoGia();
  }

  async function taoDatBan() {
    try {
      const v = await form.validateFields();
      if (!v.ngay || !v.gioBatDau || !v.soNguoi) return;
      if (!baoGia) {
        setLoi('Vui lòng tính lại tổng thanh toán trước.');
        return;
      }

      setDangTaoDatBan(true);
      setLoi('');

      const payload: TaoDatBanPayload = {
        hoTen: v.hoTen,
        soDienThoai: v.soDienThoai,
        email: v.email,
        ngay: v.ngay,
        gioBatDau: v.gioBatDau,
        soNguoi: v.soNguoi,
        ghiChu: v.ghiChu,
        banAnIds: chon ? chon.split(',') : undefined,
        monAn: monThanhPayload(soLuongMon, ghiChuMon),
        maKhuyenMai:
          maKhuyenMaiDaApDung || undefined,
      };

      const kq = await datBanApi.tao(payload);
      setKetQua(kq);

      if (!kq.thanhToan) {
        setBuoc(4);
      }
    } catch (error) {
      setLoi(
        error instanceof LoiApi
          ? error.message
          : 'Không thể tạo đặt bàn.',
      );
    } finally {
      setDangTaoDatBan(false);
    }
  }

  async function thanhToanMoPhong() {
    if (!ketQua?.thanhToan) return;

    try {
      setDangThanhToan(true);
      setLoi('');

      const kq = await thanhToanApi.xacNhanMoPhong({
        maDatBan: ketQua.maDatBan,
        soDienThoai: ketQua.soDienThoai,
        maThanhToan: ketQua.thanhToan.maThanhToan,
        khoaIdempotency: taoKhoaIdempotency(
          ketQua.thanhToan.maThanhToan,
        ),
      });

      setThanhToanKetQua(kq);
      setKetQua((hienTai) =>
        hienTai
          ? {
              ...hienTai,
              trangThai: kq.trangThaiDatBan,
              thanhToan: {
                ...hienTai.thanhToan!,
                trangThai: kq.trangThai,
              },
            }
          : hienTai,
      );
      setBuoc(4);
    } catch (error) {
      setLoi(
        error instanceof LoiApi
          ? error.message
          : 'Không thể xác nhận thanh toán.',
      );
    } finally {
      setDangThanhToan(false);
    }
  }

  function datLai() {
    setKetQua(null);
    setThanhToanKetQua(null);
    setBaoGia(null);
    setMaKhuyenMaiNhap('');
    setMaKhuyenMaiDaApDung('');
    setSoLuongMon({});
    setGhiChuMon({});
    setPhuongAn([]);
    setChon('');
    setBuoc(0);
    form.resetFields();

    if (hoSoKhach) {
      form.setFieldsValue({
        hoTen: hoSoKhach.hoTen,
        soDienThoai: hoSoKhach.soDienThoai,
        email: hoSoKhach.email || undefined,
        soNguoi: 2,
      });
    }
  }

  return (
    <>
      <section className="booking-page-hero">
        <div className="page-container">
          <Typography.Text className="eyebrow">
            ĐẶT BÀN TRỰC TUYẾN
          </Typography.Text>
          <Typography.Title level={1}>
            Chọn bàn, chọn món và thanh toán trong một luồng.
          </Typography.Title>
          <Typography.Paragraph>
            Có thể bỏ qua bước chọn món nếu bạn chỉ muốn giữ bàn.
          </Typography.Paragraph>
        </div>
      </section>

      <div className="page-container section booking-page booking-finance-page">
        <Steps
          current={buoc}
          responsive
          className="booking-steps"
          items={[
            { title: 'Thông tin', icon: <CalendarOutlined /> },
            { title: 'Chọn bàn', icon: <EnvironmentOutlined /> },
            { title: 'Chọn món', icon: <ShoppingOutlined /> },
            { title: 'Thanh toán', icon: <CreditCardOutlined /> },
            { title: 'Hoàn tất', icon: <CheckCircleOutlined /> },
          ]}
        />

        {loi ? (
          <Alert
            type="error"
            showIcon
            closable
            onClose={() => setLoi('')}
            message={loi}
            className="mb-16"
          />
        ) : null}

        {buoc === 4 && ketQua ? (
          <Card className="booking-success-card">
            <Result
              status="success"
              title="Đặt bàn đã hoàn tất"
              subTitle={`Mã đặt bàn: ${ketQua.maDatBan}`}
            />
            <Descriptions
              bordered
              column={{ xs: 1, sm: 2 }}
              items={[
                {
                  key: 'ma',
                  label: 'Mã đặt bàn',
                  children: (
                    <Typography.Text copyable strong>
                      {ketQua.maDatBan}
                    </Typography.Text>
                  ),
                },
                {
                  key: 'trang-thai',
                  label: 'Trạng thái',
                  children: (
                    <Tag color="green">
                      {ketQua.trangThai === 'DA_XAC_NHAN'
                        ? 'Đã xác nhận'
                        : ketQua.trangThai}
                    </Tag>
                  ),
                },
                {
                  key: 'ngay',
                  label: 'Ngày',
                  children: dinhDangNgay(ketQua.ngayDat),
                },
                {
                  key: 'gio',
                  label: 'Giờ',
                  children: `${ketQua.gioBatDau} – ${ketQua.gioKetThuc}`,
                },
                {
                  key: 'nguoi',
                  label: 'Số người',
                  children: `${ketQua.soNguoi} khách`,
                },
                {
                  key: 'tien',
                  label: 'Đã thanh toán',
                  children: dinhDangTien(
                    thanhToanKetQua?.soTien ??
                      ketQua.thanhToan?.soTien ??
                      ketQua.tongThanhToanTruoc ??
                      0,
                  ),
                },
              ]}
            />

            {ketQua.monAn?.length ? (
              <div className="booking-success-items">
                <Typography.Title level={5}>
                  Món đã đặt trước
                </Typography.Title>
                {ketQua.monAn.map((item) => (
                  <div key={item.monAnId} className="booking-money-row">
                    <span>
                      {item.tenMon} × {item.soLuong}
                    </span>
                    <strong>{dinhDangTien(item.thanhTien)}</strong>
                  </div>
                ))}
              </div>
            ) : null}

            <Space wrap className="booking-success-actions">
              <Button type="primary" href="/tra-cuu">
                Tra cứu đặt bàn
              </Button>
              <Button href="/thuc-don">Xem thực đơn</Button>
              <Button onClick={datLai}>Đặt thêm bàn</Button>
            </Space>
          </Card>
        ) : (
          <Row gutter={[24, 24]} align="top">
            <Col xs={24} lg={16}>
              <Card className="booking-form-card">
                {buoc === 0 ? (
                  <Form
                    form={form}
                    layout="vertical"
                    initialValues={{ soNguoi: 2 }}
                    requiredMark="optional"
                  >
                    <div className="booking-section-title">
                      <span className="booking-section-icon">
                        <TeamOutlined />
                      </span>
                      <div>
                        <Typography.Title level={4}>
                          Thông tin liên hệ
                        </Typography.Title>
                        <Typography.Text type="secondary">
                          Dùng để xác nhận và tra cứu đặt bàn.
                        </Typography.Text>
                      </div>
                    </div>

                    <Row gutter={16}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="hoTen"
                          label="Họ tên"
                          rules={[{ required: true, message: 'Nhập họ tên' }]}
                        >
                          <Input size="large" maxLength={150} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="soDienThoai"
                          label="Số điện thoại"
                          rules={[
                            {
                              required: true,
                              message: 'Nhập số điện thoại',
                            },
                          ]}
                        >
                          <Input size="large" maxLength={30} />
                        </Form.Item>
                      </Col>
                      <Col xs={24}>
                        <Form.Item name="email" label="Email">
                          <Input size="large" type="email" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Divider />

                    <div className="booking-section-title">
                      <span className="booking-section-icon">
                        <ClockCircleOutlined />
                      </span>
                      <div>
                        <Typography.Title level={4}>
                          Thời gian & số khách
                        </Typography.Title>
                        <Typography.Text type="secondary">
                          Chọn ngày để xem khung giờ đang nhận đặt.
                        </Typography.Text>
                      </div>
                    </div>

                    <Row gutter={16}>
                      <Col xs={24} md={8}>
                        <Form.Item
                          name="ngay"
                          label="Ngày"
                          rules={[{ required: true, message: 'Chọn ngày' }]}
                        >
                          <Input
                            size="large"
                            type="date"
                            min={new Date().toISOString().slice(0, 10)}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item
                          name="gioBatDau"
                          label="Giờ"
                          rules={[{ required: true, message: 'Chọn giờ' }]}
                        >
                          <Select
                            size="large"
                            disabled={!ngay}
                            options={khungGio.map((x) => ({
                              value: x,
                              label: x,
                            }))}
                            placeholder={
                              ngay ? 'Chọn giờ' : 'Chọn ngày trước'
                            }
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item
                          name="soNguoi"
                          label="Số người"
                          rules={[
                            {
                              required: true,
                              message: 'Nhập số người',
                            },
                          ]}
                        >
                          <InputNumber
                            size="large"
                            min={1}
                            max={20}
                            style={{ width: '100%' }}
                            addonAfter="khách"
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item name="ghiChu" label="Ghi chú">
                      <Input.TextArea
                        rows={3}
                        maxLength={1000}
                        placeholder="Ví dụ: có trẻ nhỏ, cần ghế em bé..."
                      />
                    </Form.Item>

                    <Button
                      block
                      type="primary"
                      size="large"
                      icon={<SearchOutlined />}
                      loading={dangTim}
                      onClick={timBan}
                      disabled={!ngay || !gioBatDau || !soNguoi}
                    >
                      Tìm bàn phù hợp
                    </Button>
                  </Form>
                ) : null}

                {buoc === 1 ? (
                  <>
                    <div className="booking-section-title">
                      <span className="booking-section-icon">
                        <EnvironmentOutlined />
                      </span>
                      <div>
                        <Typography.Title level={4}>
                          Chọn phương án bàn
                        </Typography.Title>
                        <Typography.Text type="secondary">
                          Chọn bàn cụ thể hoặc để hệ thống tự sắp.
                        </Typography.Text>
                      </div>
                    </div>

                    <Radio.Group
                      value={chon}
                      onChange={(e) => setChon(e.target.value)}
                      className="booking-table-options"
                    >
                      <label
                        className={`booking-table-option ${
                          chon === '' ? 'selected' : ''
                        }`}
                      >
                        <Radio value="" />
                        <div>
                          <strong>Để hệ thống tự xếp bàn</strong>
                          <span>
                            Hệ thống chọn phương án còn trống phù hợp nhất.
                          </span>
                        </div>
                        <Tag color="blue">Khuyên dùng</Tag>
                      </label>

                      {phuongAn.map((p) => {
                        const ids = p.banAns
                          .map((b) => b.id)
                          .join(',');
                        return (
                          <label
                            key={ids}
                            className={`booking-table-option ${
                              chon === ids ? 'selected' : ''
                            }`}
                          >
                            <Radio value={ids} />
                            <div>
                              <strong>
                                {p.kieu === 'GHEP_BAN'
                                  ? `Ghép bàn: ${tenBan(p)}`
                                  : tenBan(p)}
                              </strong>
                              <span>
                                {p.banAns[0]?.tenKhuVuc || 'Khu vực phù hợp'} ·
                                {' '}
                                sức chứa {p.tongSucChua} khách
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </Radio.Group>

                    <div className="booking-step-actions">
                      <Button onClick={() => setBuoc(0)}>Quay lại</Button>
                      <Button type="primary" onClick={() => setBuoc(2)}>
                        Tiếp tục chọn món
                      </Button>
                    </div>
                  </>
                ) : null}

                {buoc === 2 ? (
                  <>
                    <div className="booking-section-title">
                      <span className="booking-section-icon">
                        <ShoppingOutlined />
                      </span>
                      <div>
                        <Typography.Title level={4}>
                          Chọn món trước
                        </Typography.Title>
                        <Typography.Text type="secondary">
                          Hoàn toàn tùy chọn. Bạn có thể bỏ qua và chỉ giữ bàn.
                        </Typography.Text>
                      </div>
                    </div>

                    {dangTaiMon ? (
                      <div className="booking-centered-loading">
                        <Spin />
                      </div>
                    ) : (
                      <div className="booking-dish-grid">
                        {monAn.map((item) => {
                          const qty = soLuongMon[item.id] ?? 0;
                          return (
                            <Card
                              key={item.id}
                              size="small"
                              className={`booking-dish-card ${
                                qty > 0 ? 'selected' : ''
                              }`}
                            >
                              <div className="booking-dish-main">
                                <div>
                                  <Typography.Text strong>
                                    {item.tenMon}
                                  </Typography.Text>
                                  <div className="booking-dish-price">
                                    {item.giaKhuyenMai != null ? (
                                      <Typography.Text delete type="secondary">
                                        {dinhDangTien(item.gia)}
                                      </Typography.Text>
                                    ) : null}
                                    <Typography.Text strong>
                                      {dinhDangTien(
                                        item.giaKhuyenMai ?? item.gia,
                                      )}
                                    </Typography.Text>
                                  </div>
                                </div>

                                <Space.Compact>
                                  <Button
                                    icon={<MinusOutlined />}
                                    disabled={qty <= 0}
                                    onClick={() =>
                                      capNhatSoLuong(item.id, qty - 1)
                                    }
                                  />
                                  <InputNumber
                                    min={0}
                                    max={99}
                                    controls={false}
                                    value={qty}
                                    onChange={(value) =>
                                      capNhatSoLuong(
                                        item.id,
                                        Number(value ?? 0),
                                      )
                                    }
                                    className="booking-dish-qty"
                                  />
                                  <Button
                                    icon={<PlusOutlined />}
                                    onClick={() =>
                                      capNhatSoLuong(item.id, qty + 1)
                                    }
                                  />
                                </Space.Compact>
                              </div>

                              {qty > 0 ? (
                                <Input.TextArea
                                  className="booking-dish-note"
                                  value={ghiChuMon[item.id] ?? ''}
                                  maxLength={500}
                                  autoSize={{ minRows: 2, maxRows: 3 }}
                                  placeholder="Ghi chú món, ví dụ: ít cay, không hành..."
                                  onChange={(event) =>
                                    capNhatGhiChuMon(
                                      item.id,
                                      event.target.value,
                                    )
                                  }
                                />
                              ) : null}
                            </Card>
                          );
                        })}
                      </div>
                    )}

                    <div className="booking-dish-total">
                      <span>
                        {monDaChon.length
                          ? `${monDaChon.length} món đã chọn`
                          : 'Chưa chọn món'}
                      </span>
                      <strong>{dinhDangTien(tongMonUocTinh)}</strong>
                    </div>

                    <div className="booking-step-actions">
                      <Button onClick={() => setBuoc(1)}>Quay lại</Button>
                      <Button
                        type="primary"
                        loading={dangTinhTien}
                        onClick={sangBuocThanhToan}
                      >
                        {monDaChon.length
                          ? 'Tiếp tục'
                          : 'Bỏ qua chọn món'}
                      </Button>
                    </div>
                  </>
                ) : null}

                {buoc === 3 ? (
                  <>
                    {!ketQua ? (
                      <>
                        <div className="booking-section-title">
                          <span className="booking-section-icon">
                            <GiftOutlined />
                          </span>
                          <div>
                            <Typography.Title level={4}>
                              Ưu đãi & thanh toán
                            </Typography.Title>
                            <Typography.Text type="secondary">
                              Số tiền cuối cùng luôn được backend tính lại.
                            </Typography.Text>
                          </div>
                        </div>

                                                <div className="booking-promo-discovery">
                          <Typography.Text strong>
                            Ưu đãi đang có
                          </Typography.Text>
                          <Typography.Paragraph type="secondary">
                            Chọn mã phù hợp hoặc nhập một mã khác bên dưới.
                          </Typography.Paragraph>

                          {dangTaiKhuyenMai ? (
                            <Typography.Text type="secondary">
                              Đang tải ưu đãi...
                            </Typography.Text>
                          ) : khuyenMaiCongKhai.length > 0 ? (
                            <div className="booking-promo-grid">
                              {khuyenMaiCongKhai.map((item) => (
                                <div
                                  className="booking-promo-card"
                                  key={item.id}
                                >
                                  <div className="booking-promo-card-main">
                                    <div className="booking-promo-title-row">
                                      <Typography.Text strong>
                                        {item.maKhuyenMai}
                                      </Typography.Text>
                                      <Tag color="red">
                                        {dinhDangUuDai(item)}
                                      </Tag>
                                    </div>

                                    <Typography.Text>
                                      {item.tenKhuyenMai}
                                    </Typography.Text>

                                    {item.moTa ? (
                                      <Typography.Text type="secondary">
                                        {item.moTa}
                                      </Typography.Text>
                                    ) : null}

                                    <div className="booking-promo-conditions">
                                      {item.giaTriDonToiThieu ? (
                                        <span>
                                          Món tối thiểu{' '}
                                          {Number(
                                            item.giaTriDonToiThieu,
                                          ).toLocaleString('vi-VN')}{' '}
                                          ₫
                                        </span>
                                      ) : (
                                        <span>
                                          Không yêu cầu giá trị tối thiểu
                                        </span>
                                      )}

                                      {item.giamToiDa ? (
                                        <span>
                                          Giảm tối đa{' '}
                                          {Number(
                                            item.giamToiDa,
                                          ).toLocaleString('vi-VN')}{' '}
                                          ₫
                                        </span>
                                      ) : null}

                                      {item.soLuotConLai != null ? (
                                        <span>
                                          Còn {item.soLuotConLai} lượt
                                        </span>
                                      ) : null}

                                      {item.soLuotMoiKhach != null ? (
                                        <span>
                                          Mỗi khách tối đa{' '}
                                          {item.soLuotMoiKhach} lượt
                                        </span>
                                      ) : null}
                                    </div>
                                  </div>

                                  <Button
                                    disabled={
                                      monDaChon.length === 0 ||
                                      dangTinhTien
                                    }
                                    onClick={() => {
                                      setMaKhuyenMaiNhap(
                                        item.maKhuyenMai,
                                      );
                                      void apDungKhuyenMai(
                                        item.maKhuyenMai,
                                      );
                                    }}
                                  >
                                    {maKhuyenMaiDaApDung ===
                                    item.maKhuyenMai
                                      ? 'Đã áp dụng'
                                      : 'Áp dụng'}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <Typography.Text type="secondary">
                              Hiện chưa có mã ưu đãi công khai.
                            </Typography.Text>
                          )}

                          {monDaChon.length === 0 &&
                          khuyenMaiCongKhai.length > 0 ? (
                            <Typography.Text
                              type="secondary"
                              className="booking-promo-note"
                            >
                              Chọn ít nhất một món để sử dụng ưu đãi.
                            </Typography.Text>
                          ) : null}
                        </div>

                        <Typography.Text
                          strong
                          className="booking-manual-coupon-label"
                        >
                          Hoặc nhập mã khác
                        </Typography.Text>

                        <div className="booking-coupon-row">
                          <Input
                            size="large"
                            value={maKhuyenMaiNhap}
                            onChange={(e) =>
                              setMaKhuyenMaiNhap(
                                e.target.value.toUpperCase(),
                              )
                            }
                            placeholder={
                              monDaChon.length
                                ? 'Nhập mã khác'
                                : 'Chọn món trước để nhập mã'
                            }
                            disabled={
                              dangTinhTien ||
                              monDaChon.length === 0
                            }
                          />
                          <Button
                            size="large"
                            loading={dangTinhTien}
                            disabled={monDaChon.length === 0}
                            onClick={() => apDungKhuyenMai()}
                          >
                            Áp dụng
                          </Button>
                        </div>

                        {monDaChon.length === 0 ? (
                          <Alert
                            type="info"
                            showIcon
                            className="booking-coupon-helper"
                            message="Mã ưu đãi áp dụng trên giá trị món đặt trước."
                            description="Bạn đang chỉ giữ bàn nên không cần nhập mã ưu đãi."
                          />
                        ) : null}

                        {maKhuyenMaiDaApDung && baoGia?.khuyenMai ? (
                          <Alert
                            type="success"
                            showIcon
                            message={`Đã áp dụng ${baoGia.khuyenMai.maKhuyenMai} — ${baoGia.khuyenMai.tenKhuyenMai}`}
                            action={
                              <Button size="small" onClick={boKhuyenMai}>
                                Bỏ mã
                              </Button>
                            }
                          />
                        ) : null}

                        <Divider />

                        {baoGia ? (
                          <div className="booking-money-box">
                            <div className="booking-money-row">
                              <span>Tiền món</span>
                              <strong>
                                {dinhDangTien(baoGia.tamTinhMon)}
                              </strong>
                            </div>
                            <div className="booking-money-row">
                              <span>Giảm giá</span>
                              <strong>
                                -{dinhDangTien(baoGia.tienGiam)}
                              </strong>
                            </div>
                            <div className="booking-money-row">
                              <span>Tiền món sau giảm</span>
                              <strong>
                                {dinhDangTien(baoGia.tienMonSauGiam)}
                              </strong>
                            </div>
                            <div className="booking-money-row">
                              <span>Cọc giữ bàn</span>
                              <strong>
                                {dinhDangTien(baoGia.tienCoc)}
                              </strong>
                            </div>
                            <Divider />
                            <div className="booking-money-row total">
                              <span>Thanh toán trước</span>
                              <strong>
                                {dinhDangTien(
                                  baoGia.tongThanhToanTruoc,
                                )}
                              </strong>
                            </div>
                          </div>
                        ) : null}

                        <Alert
                          type="info"
                          showIcon
                          message="Thanh toán demo"
                          description="Đây là luồng mô phỏng cho đồ án. Không phát sinh giao dịch tiền thật."
                        />

                        <div className="booking-step-actions">
                          <Button onClick={() => setBuoc(2)}>
                            Quay lại
                          </Button>
                          <Button
                            type="primary"
                            size="large"
                            loading={dangTaoDatBan}
                            disabled={!baoGia}
                            onClick={taoDatBan}
                          >
                            Xác nhận đặt bàn
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="booking-payment-intent">
                        <Result
                          status="info"
                          icon={<CreditCardOutlined />}
                          title="Đặt bàn đã được giữ, còn bước thanh toán"
                          subTitle={`Mã đặt bàn ${ketQua.maDatBan}`}
                        />

                        <div className="booking-money-box">
                          <div className="booking-money-row">
                            <span>Mã thanh toán</span>
                            <Typography.Text copyable strong>
                              {ketQua.thanhToan?.maThanhToan}
                            </Typography.Text>
                          </div>
                          <div className="booking-money-row total">
                            <span>Số tiền</span>
                            <strong>
                              {dinhDangTien(
                                ketQua.thanhToan?.soTien ??
                                  ketQua.tongThanhToanTruoc ??
                                  0,
                              )}
                            </strong>
                          </div>
                        </div>

                        <Button
                          type="primary"
                          size="large"
                          block
                          icon={<CreditCardOutlined />}
                          loading={dangThanhToan}
                          onClick={thanhToanMoPhong}
                        >
                          Thanh toán mô phỏng
                        </Button>
                      </div>
                    )}
                  </>
                ) : null}
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card
                title="Tóm tắt đặt bàn"
                className="booking-summary-card"
              >
                <Space direction="vertical" size={14} style={{ width: '100%' }}>
                  <div className="booking-summary-line">
                    <CalendarOutlined />
                    <span>
                      {ngay ? dinhDangNgay(ngay) : 'Chưa chọn ngày'}
                    </span>
                  </div>
                  <div className="booking-summary-line">
                    <ClockCircleOutlined />
                    <span>{gioBatDau || 'Chưa chọn giờ'}</span>
                  </div>
                  <div className="booking-summary-line">
                    <TeamOutlined />
                    <span>
                      {soNguoi ? `${soNguoi} khách` : 'Chưa chọn số khách'}
                    </span>
                  </div>
                  <div className="booking-summary-line">
                    <EnvironmentOutlined />
                    <span>
                      {phuongAnDaChon
                        ? tenBan(phuongAnDaChon)
                        : buoc >= 1
                          ? 'Hệ thống tự xếp bàn'
                          : 'Chưa chọn bàn'}
                    </span>
                  </div>
                  <div className="booking-summary-line">
                    <ShoppingOutlined />
                    <span>
                      {monDaChon.length
                        ? `${monDaChon.reduce(
                            (tong, item) => tong + item.soLuong,
                            0,
                          )} phần món`
                        : 'Không đặt món trước'}
                    </span>
                  </div>

                  {baoGia ? (
                    <>
                      <Divider />
                      <div className="booking-money-row total">
                        <span>Thanh toán trước</span>
                        <strong>
                          {dinhDangTien(baoGia.tongThanhToanTruoc)}
                        </strong>
                      </div>
                    </>
                  ) : null}
                </Space>
              </Card>
            </Col>
          </Row>
        )}
      </div>
    </>
  );
}
