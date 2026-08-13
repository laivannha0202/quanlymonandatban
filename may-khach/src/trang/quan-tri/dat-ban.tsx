import {
  CalendarOutlined,
  CreditCardOutlined,
  EyeOutlined,
  GiftOutlined,
  PlusOutlined,
  ShoppingOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Divider,
  Drawer,
  Flex,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { useState } from 'react';
import {
  quanTriApi,
  type HuyDatBanQuanTriPayload,
  type TaoDatBanQuanTriPayload,
} from '@/dich-vu/quan-tri.api';
import { datBanApi } from '@/dich-vu/dat-ban.api';
import { LoiApi } from '@/dich-vu/http';
import type { BanAnPhuongAn, DatBan } from '@/kieu/nghiep-vu';
import { useXacThuc } from '@/ngu-canh/xac-thuc.context';
import { dinhDangTien } from '@/cau-hinh/dinh-dang';
import { dinhDangGio, dinhDangNgay, dinhDangNgayGio } from '@/cau-hinh/ngay-gio';
import { CanhBaoLoi } from '@/thanh-phan/canh-bao-loi';
import { TieuDeTrang } from '@/thanh-phan/tieu-de-trang';
import { TrangThai } from '@/thanh-phan/trang-thai';
import './dat-ban-finance-detail.css';

type HanhDong = 'xac-nhan' | 'check-in' | 'hoan-thanh' | 'khong-den' | 'huy';

type DatBanChiTietQuanTri = DatBan & {
  ghiChuNoiBo?: string | null;
};

type TaoDatBanForm = {
  hoTen: string;
  soDienThoai: string;
  email?: string;
  ngay: Dayjs;
  gioBatDau: string;
  soNguoi: number;
  nguonDat: 'DIEN_THOAI' | 'FACEBOOK' | 'TRUC_TIEP' | 'KHAC';
  xacNhanNgay: boolean;
  ghiChu?: string;
  ghiChuNoiBo?: string;
};

const tenNguonDat: Record<string, string> = {
  WEBSITE: 'Website',
  DIEN_THOAI: 'Điện thoại',
  FACEBOOK: 'Facebook',
  TRUC_TIEP: 'Trực tiếp',
  KHAC: 'Khác',
};


const tenTrangThaiThanhToan: Record<string, string> = {
  CHO_THANH_TOAN: 'Chờ thanh toán',
  DA_THANH_TOAN: 'Đã thanh toán',
  THAT_BAI: 'Thất bại',
  DA_HUY: 'Đã hủy',
  DA_HOAN_TIEN: 'Đã hoàn tiền',
  HOAN_MOT_PHAN: 'Hoàn một phần',
};

const mauTrangThaiThanhToan: Record<string, string> = {
  CHO_THANH_TOAN: 'gold',
  DA_THANH_TOAN: 'green',
  THAT_BAI: 'red',
  DA_HUY: 'default',
  DA_HOAN_TIEN: 'cyan',
  HOAN_MOT_PHAN: 'blue',
};

const tenTrangThaiHoanTien: Record<string, string> = {
  CHO_HOAN: 'Chờ hoàn',
  DANG_XU_LY: 'Đang xử lý',
  DA_HOAN: 'Đã hoàn',
  THAT_BAI: 'Thất bại',
};

const mauTrangThaiHoanTien: Record<string, string> = {
  CHO_HOAN: 'gold',
  DANG_XU_LY: 'blue',
  DA_HOAN: 'green',
  THAT_BAI: 'red',
};

const tenPhuongThucThanhToan: Record<string, string> = {
  MO_PHONG: 'Mô phỏng',
  VNPAY: 'VNPay',
  MOMO: 'MoMo',
  CHUYEN_KHOAN: 'Chuyển khoản',
  TIEN_MAT: 'Tiền mặt',
};

const tenHanhDong: Record<string, string> = {
  TAO_DAT_BAN: 'Tạo đặt bàn',
  TAO_VA_XAC_NHAN: 'Tạo và xác nhận',
  XAC_NHAN: 'Xác nhận đặt bàn',
  SAP_BAN: 'Sắp bàn',
  DOI_BAN: 'Đổi bàn',
  CHECK_IN: 'Khách đã đến',
  HOAN_THANH: 'Hoàn thành',
  HUY: 'Hủy đặt bàn',
  KHONG_DEN: 'Khách không đến',
  CAP_NHAT_THONG_TIN: 'Cập nhật thông tin',
};

function tenBan(r?: DatBan | null) {
  if (!r?.banAns?.length) return 'Chưa sắp bàn';
  return r.banAns
    .map((ban) => ban.tenBan || ban.maBan)
    .filter(Boolean)
    .join(' + ');
}

function ghiChuNoiBo(r?: DatBanChiTietQuanTri | null) {
  return r?.ghiChuNoiBo ?? null;
}

function tenPhuongAn(p: BanAnPhuongAn) {
  return p.banAns
    .map((ban) => ban.tenBan || ban.maBan)
    .join(' + ');
}

function idsPhuongAn(p: BanAnPhuongAn) {
  return p.banAns.map((ban) => ban.id);
}

function keyPhuongAn(p: BanAnPhuongAn) {
  return idsPhuongAn(p).join(',');
}

function mocGioDatBan(r: DatBan, field: 'gioBatDau' | 'gioKetThuc') {
  const raw = r[field];
  if (!raw) return null;

  if (raw.includes('T') || raw.includes(' ')) {
    const parsed = dayjs(raw);
    return parsed.isValid() ? parsed : null;
  }

  const ngayIso = dayjs(r.ngayDat).format('YYYY-MM-DD');
  const parsed = dayjs(`${ngayIso}T${raw}`);
  return parsed.isValid() ? parsed : null;
}

function laQuaGio(r: DatBan) {
  if (!['CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DA_CHECK_IN'].includes(r.trangThai)) return false;
  const ketThuc = mocGioDatBan(r, 'gioKetThuc');
  return Boolean(ketThuc && dayjs().isAfter(ketThuc));
}

function coTheCheckInTheoGio(r: DatBan, checkInSomToiDaPhut: number) {
  if (r.trangThai !== 'DA_XAC_NHAN') return false;

  const batDau = mocGioDatBan(r, 'gioBatDau');
  const ketThuc = mocGioDatBan(r, 'gioKetThuc');

  if (!batDau || !ketThuc) return false;

  const somNhat = batDau.subtract(checkInSomToiDaPhut, 'minute');
  const hienTai = dayjs();

  return !hienTai.isBefore(somNhat) && hienTai.isBefore(ketThuc);
}

function gioMoCheckIn(r: DatBan, checkInSomToiDaPhut: number) {
  const batDau = mocGioDatBan(r, 'gioBatDau');
  if (!batDau) return null;
  return batDau.subtract(checkInSomToiDaPhut, 'minute');
}

function chuaToiGioCheckIn(r: DatBan, checkInSomToiDaPhut: number) {
  if (r.trangThai !== 'DA_XAC_NHAN' || laQuaGio(r)) return false;

  const somNhat = gioMoCheckIn(r, checkInSomToiDaPhut);
  return Boolean(somNhat && dayjs().isBefore(somNhat));
}

function gioChoPhepKhongDen(r: DatBan, thoiGianChoKhachPhut: number) {
  const batDau = mocGioDatBan(r, 'gioBatDau');
  if (!batDau) return null;
  return batDau.add(thoiGianChoKhachPhut, 'minute');
}

function coTheDanhDauKhongDenTheoGio(r: DatBan, thoiGianChoKhachPhut: number) {
  if (r.trangThai !== 'DA_XAC_NHAN') return false;

  const moc = gioChoPhepKhongDen(r, thoiGianChoKhachPhut);
  return Boolean(moc && !dayjs().isBefore(moc));
}

function canhBaoQuaGio(r: DatBan) {
  if (!laQuaGio(r)) return null;

  if (r.trangThai === 'CHO_XAC_NHAN') {
    return 'Lượt đặt đã qua khung phục vụ nhưng vẫn chưa được xác nhận. Hãy kiểm tra lại với khách và hủy nếu khách không còn đến.';
  }

  if (r.trangThai === 'DA_XAC_NHAN') {
    return 'Lượt đặt đã qua khung phục vụ và chưa được check-in. Hãy xác minh tình trạng thực tế trước khi xử lý.';
  }

  return 'Lượt phục vụ đã qua giờ kết thúc dự kiến. Hãy hoàn thành khi khách đã dùng bữa xong.';
}

export function QuanTriDatBan() {
  const { message, modal } = App.useApp();
  const { coQuyen, nguoiDung } = useXacThuc();
  const qc = useQueryClient();

  const [trangThai, setTrangThai] = useState<string>();
  const [nguonDat, setNguonDat] = useState<string>();
  const [ngay, setNgay] = useState(dayjs().format('YYYY-MM-DD'));
  const [tuKhoa, setTuKhoa] = useState('');
  const [chiTietId, setChiTietId] = useState<string | null>(null);

  const [moTao, setMoTao] = useState(false);
  const [formTao] = Form.useForm<TaoDatBanForm>();
  const [phuongAn, setPhuongAn] = useState<BanAnPhuongAn[]>([]);
  const [chonBan, setChonBan] = useState('');
  const ngayTao = Form.useWatch('ngay', formTao);

  const query = useQuery({
    queryKey: ['quan-tri', 'dat-ban', trangThai, nguonDat, ngay, tuKhoa],
    queryFn: () =>
      quanTriApi.datBan({
        trangThai,
        nguonDat,
        ngay: ngay || undefined,
        tuKhoa: tuKhoa || undefined,
      }),
  });

  const chiTietQuery = useQuery({
    queryKey: ['quan-tri', 'dat-ban', 'chi-tiet', chiTietId],
    queryFn: () => quanTriApi.datBanChiTiet(chiTietId as string),
    enabled: Boolean(chiTietId),
  });

  const thongSoCheckInQuery = useQuery({
    queryKey: ['quan-tri', 'dat-ban', 'thong-so-check-in'],
    queryFn: quanTriApi.thongSoCheckIn,
    staleTime: 5 * 60_000,
  });

  const checkInSomToiDaPhut =
    thongSoCheckInQuery.data?.checkInSomToiDaPhut ?? 30;
  const thoiGianChoKhachPhut =
    thongSoCheckInQuery.data?.thoiGianChoKhachPhut ?? 15;

  const khungGioQuery = useQuery({
    queryKey: ['dat-ban', 'khung-gio', ngayTao?.format('YYYY-MM-DD')],
    queryFn: () => datBanApi.khungGio(ngayTao.format('YYYY-MM-DD')),
    enabled: moTao && Boolean(ngayTao),
  });

  const timBanMutation = useMutation({
    mutationFn: (v: Pick<TaoDatBanForm, 'ngay' | 'gioBatDau' | 'soNguoi'>) =>
      datBanApi.timBan({
        ngay: v.ngay.format('YYYY-MM-DD'),
        gioBatDau: v.gioBatDau,
        soNguoi: v.soNguoi,
      }),
    onSuccess: (kq) => {
      setPhuongAn(kq.phuongAn);
      setChonBan('');
      if (!kq.phuongAn.length) {
        message.warning('Không còn bàn phù hợp trong khung giờ này.');
      }
    },
    onError: (e) =>
      message.error(e instanceof LoiApi ? e.message : 'Không tìm được bàn phù hợp.'),
  });

  const mutation = useMutation({
    mutationFn: ({
      id,
      hanhDong,
      huyPayload,
    }: {
      id: string;
      hanhDong: HanhDong;
      huyPayload?: HuyDatBanQuanTriPayload;
    }) =>
      quanTriApi.chuyenTrangThaiDatBan(
        id,
        hanhDong,
        huyPayload,
      ),
    onSuccess: async () => {
      message.success('Đã cập nhật đặt bàn');
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['quan-tri', 'dat-ban'] }),
        qc.invalidateQueries({ queryKey: ['quan-tri', 'dashboard'] }),
        qc.invalidateQueries({ queryKey: ['quan-tri', 'ban-an'] }),
      ]);
    },
    onError: (e) =>
      message.error(e instanceof LoiApi ? e.message : 'Cập nhật đặt bàn thất bại.'),
  });

  const taoMutation = useMutation({
    mutationFn: (payload: TaoDatBanQuanTriPayload) => quanTriApi.taoDatBan(payload),
    onSuccess: async (kq, payload) => {
      message.success(`Đã tạo đặt bàn ${kq.maDatBan}`);
      setMoTao(false);
      formTao.resetFields();
      setPhuongAn([]);
      setChonBan('');
      setNgay(payload.ngay);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['quan-tri', 'dat-ban'] }),
        qc.invalidateQueries({ queryKey: ['quan-tri', 'dashboard'] }),
        qc.invalidateQueries({ queryKey: ['quan-tri', 'ban-an'] }),
      ]);
    },
    onError: (e) =>
      message.error(e instanceof LoiApi ? e.message : 'Không tạo được đặt bàn.'),
  });

  const hanhDong = (r: DatBan, hd: HanhDong) => {
    if (hd === 'huy') {
      let nguonHuy: HuyDatBanQuanTriPayload['nguonHuy'] =
        'KHACH_YEU_CAU';
      let lyDo = '';

      modal.confirm({
        title: 'Hủy đặt bàn này?',
        width: 560,
        content: (
          <div>
            <strong>{r.maDatBan}</strong>
            <div>{r.hoTen} · {r.soNguoi} khách</div>
            <div>
              {dinhDangNgay(r.ngayDat)} · {dinhDangGio(r.gioBatDau)}
            </div>

            <Divider />

            <Typography.Text strong>
              Ai là bên yêu cầu hủy?
            </Typography.Text>
            <Radio.Group
              defaultValue="KHACH_YEU_CAU"
              className="mt-8"
              onChange={(event) => {
                nguonHuy = event.target.value;
              }}
            >
              <Space direction="vertical">
                <Radio value="KHACH_YEU_CAU">
                  Khách yêu cầu hủy
                </Radio>
                {nguoiDung?.vaiTro.maVaiTro === 'QUAN_TRI_VIEN' ? (
                  <Radio value="NHA_HANG_CHU_DONG">
                    Nhà hàng chủ động hủy
                  </Radio>
                ) : null}
              </Space>
            </Radio.Group>

            <Alert
              className="mt-12"
              type="info"
              showIcon
              message="Chính sách hoàn tiền"
              description={
                <>
                  Khách yêu cầu hủy: áp dụng thời hạn và tỷ lệ hoàn
                  theo cấu hình. Nhà hàng chủ động hủy: hoàn 100%
                  số tiền đã thu và chỉ Admin được ghi nhận nguồn hủy này.
                  Nhân viên chỉ tiếp nhận yêu cầu hủy từ khách và tạo yêu cầu
                  hoàn; người có quyền hoàn tiền sẽ xác nhận ở màn
                  Thanh toán & hoàn tiền.
                </>
              }
            />

            <Input.TextArea
              className="mt-12"
              rows={3}
              maxLength={2000}
              showCount
              placeholder="Lý do hủy (không bắt buộc)"
              onChange={(event) => {
                lyDo = event.target.value;
              }}
            />
          </div>
        ),
        okText: 'Hủy đặt bàn',
        cancelText: 'Giữ nguyên',
        okButtonProps: { danger: true },
        onOk: () =>
          mutation.mutateAsync({
            id: r.id,
            hanhDong: 'huy',
            huyPayload: {
              nguonHuy,
              lyDo: lyDo.trim() || undefined,
            },
          }),
      });
      return;
    }

    const lam = () =>
      mutation.mutateAsync({
        id: r.id,
        hanhDong: hd,
      });

    const cauHoi: Record<
      Exclude<HanhDong, 'huy'>,
      { title: string; ok: string; danger?: boolean }
    > = {
      'xac-nhan': {
        title: 'Xác nhận đặt bàn này?',
        ok: 'Xác nhận',
      },
      'check-in': {
        title: 'Xác nhận khách đã đến?',
        ok: 'Check-in',
      },
      'hoan-thanh': {
        title: 'Hoàn thành lượt phục vụ này?',
        ok: 'Hoàn thành',
      },
      'khong-den': {
        title: 'Đánh dấu khách không đến?',
        ok: 'Không đến',
      },
    };

    const cauHinh = cauHoi[hd];

    modal.confirm({
      title: cauHinh.title,
      content: (
        <div>
          <strong>{r.maDatBan}</strong>
          <div>{r.hoTen} · {r.soNguoi} khách</div>
          <div>
            {dinhDangNgay(r.ngayDat)} · {dinhDangGio(r.gioBatDau)}
          </div>
        </div>
      ),
      okText: cauHinh.ok,
      cancelText: 'Giữ nguyên',
      okButtonProps:
        cauHinh.danger
          ? { danger: true }
          : undefined,
      onOk: lam,
    });
  };

  const resetBoLoc = () => {
    setTrangThai(undefined);
    setNguonDat(undefined);
    setNgay(dayjs().format('YYYY-MM-DD'));
    setTuKhoa('');
  };

  const moFormTao = () => {
    setMoTao(true);
    setPhuongAn([]);
    setChonBan('');
    formTao.setFieldsValue({
      ngay: dayjs(),
      soNguoi: 2,
      nguonDat: 'TRUC_TIEP',
      xacNhanNgay: true,
    });
  };

  const timBan = async () => {
    try {
      await formTao.validateFields(['ngay', 'gioBatDau', 'soNguoi']);
      const values = formTao.getFieldsValue();
      await timBanMutation.mutateAsync({
        ngay: values.ngay,
        gioBatDau: values.gioBatDau,
        soNguoi: values.soNguoi,
      });
    } catch {
      // Validation và API đã tự hiển thị lỗi.
    }
  };

  const taoDatBan = async () => {
    try {
      const values = await formTao.validateFields();
      const p = phuongAn.find((item) => keyPhuongAn(item) === chonBan);

      if (!p) {
        message.warning('Hãy tìm và chọn một bàn phù hợp trước khi tạo.');
        return;
      }

      await taoMutation.mutateAsync({
        hoTen: values.hoTen.trim(),
        soDienThoai: values.soDienThoai.trim(),
        email: values.email?.trim() || undefined,
        ngay: values.ngay.format('YYYY-MM-DD'),
        gioBatDau: values.gioBatDau,
        soNguoi: values.soNguoi,
        banAnIds: idsPhuongAn(p),
        nguonDat: values.nguonDat,
        xacNhanNgay: values.xacNhanNgay,
        ghiChu: values.ghiChu?.trim() || undefined,
        ghiChuNoiBo: values.ghiChuNoiBo?.trim() || undefined,
      });
    } catch {
      // Validation và API đã tự hiển thị lỗi.
    }
  };

  const danhSach = query.data?.danhSach ?? [];
  const chiTiet = chiTietQuery.data as DatBanChiTietQuanTri | undefined;
  const canhBaoChiTiet = chiTiet ? canhBaoQuaGio(chiTiet) : null;

  return (
    <>
      <Flex justify="space-between" align="flex-start" gap={16} wrap>
        <TieuDeTrang
          tieuDe="Quản lý đặt bàn"
          moTa="Theo dõi lịch đến, xác nhận khách, check-in và xử lý từng lượt đặt bàn trong ngày."
        />
        {coQuyen('DAT_BAN_TAO') ? (
          <Button type="primary" icon={<PlusOutlined />} onClick={moFormTao}>
            Tạo đặt bàn
          </Button>
        ) : null}
      </Flex>

      <Card className="filter-card admin-filter-card admin-booking-filter-card">
        <Flex gap={10} wrap align="center">
          <Input.Search
            allowClear
            placeholder="Tìm mã, tên hoặc số điện thoại"
            value={tuKhoa}
            onChange={(e) => {
              const value = e.target.value;
              setTuKhoa(value);
              if (!value) setTuKhoa('');
            }}
            onSearch={setTuKhoa}
            className="admin-booking-search"
          />

          <DatePicker
            allowClear
            value={ngay ? dayjs(ngay) : null}
            format="DD/MM/YYYY"
            placeholder="Chọn ngày"
            onChange={(value) => setNgay(value ? value.format('YYYY-MM-DD') : '')}
            className="admin-booking-date"
          />

          <Select
            allowClear
            placeholder="Trạng thái"
            value={trangThai}
            onChange={setTrangThai}
            className="admin-booking-select"
            options={[
              { value: 'CHO_XAC_NHAN', label: 'Chờ xác nhận' },
              { value: 'DA_XAC_NHAN', label: 'Đã xác nhận' },
              { value: 'DA_CHECK_IN', label: 'Đang phục vụ' },
              { value: 'DA_HOAN_THANH', label: 'Hoàn thành' },
              { value: 'DA_HUY', label: 'Đã hủy' },
              { value: 'KHONG_DEN', label: 'Không đến' },
            ]}
          />

          <Select
            allowClear
            placeholder="Nguồn đặt"
            value={nguonDat}
            onChange={setNguonDat}
            className="admin-booking-select"
            options={[
              { value: 'WEBSITE', label: 'Website' },
              { value: 'DIEN_THOAI', label: 'Điện thoại' },
              { value: 'FACEBOOK', label: 'Facebook' },
              { value: 'TRUC_TIEP', label: 'Trực tiếp' },
              { value: 'KHAC', label: 'Khác' },
            ]}
          />

          <Button
            icon={<CalendarOutlined />}
            onClick={() => setNgay(dayjs().format('YYYY-MM-DD'))}
          >
            Hôm nay
          </Button>

          <Button icon={<ReloadOutlined />} onClick={resetBoLoc}>
            Đặt lại
          </Button>
        </Flex>

        <Flex justify="space-between" align="center" wrap gap={8} className="admin-booking-filter-meta">
          <Typography.Text type="secondary">
            {ngay
              ? `Lịch ngày ${dayjs(ngay).format('DD/MM/YYYY')}`
              : 'Đang xem tất cả ngày'}
          </Typography.Text>
          <Typography.Text type="secondary">
            {query.data?.phanTrang?.tong ?? danhSach.length} lượt phù hợp
          </Typography.Text>
        </Flex>
      </Card>

      <CanhBaoLoi loi={query.error} macDinh="Không tải được danh sách đặt bàn." />

      <Card className="admin-table-card admin-booking-table-card">
        <Table
          rowKey="id"
          loading={query.isPending || query.isFetching}
          dataSource={danhSach}
          scroll={{ x: 1080 }}
          pagination={{ pageSize: 20, showSizeChanger: false }}
          rowClassName={(r) => (laQuaGio(r) ? 'admin-booking-overdue-row' : '')}
          columns={[
            {
              title: 'Giờ',
              dataIndex: 'gioBatDau',
              fixed: 'left',
              width: 90,
              render: (v: string) => <strong className="admin-booking-time">{dinhDangGio(v)}</strong>,
            },
            {
              title: 'Khách',
              dataIndex: 'hoTen',
              width: 220,
              render: (v: string, r: DatBan) => (
                <div className="admin-booking-guest">
                  <strong>{v}</strong>
                  <span>{r.maDatBan}</span>
                </div>
              ),
            },
            {
              title: 'Liên hệ',
              dataIndex: 'soDienThoai',
              width: 145,
            },
            {
              title: 'Số khách',
              dataIndex: 'soNguoi',
              width: 90,
              render: (v: number) => `${v} người`,
            },
            {
              title: 'Nguồn',
              dataIndex: 'nguonDat',
              width: 105,
              render: (v: string) => tenNguonDat[v] || '—',
            },
            {
              title: 'Trạng thái',
              dataIndex: 'trangThai',
              width: 180,
              render: (v: string, r: DatBan) => (
                <Space size={5} wrap>
                  <TrangThai value={v} />
                  {laQuaGio(r) ? <Tag color="red">Quá giờ</Tag> : null}
                  {chuaToiGioCheckIn(r, checkInSomToiDaPhut) ? (
                    <Tag>Chưa tới giờ</Tag>
                  ) : null}
                </Space>
              ),
            },
            {
              title: 'Thao tác',
              fixed: 'right',
              width: 330,
              render: (_: unknown, r: DatBan) => (
                <Space size={6} wrap>
                  <Button
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => setChiTietId(r.id)}
                  >
                    Chi tiết
                  </Button>

                  {r.trangThai === 'CHO_XAC_NHAN' && !laQuaGio(r) && coQuyen('DAT_BAN_XAC_NHAN') ? (
                    <Button size="small" type="primary" onClick={() => hanhDong(r, 'xac-nhan')}>
                      Xác nhận
                    </Button>
                  ) : null}

                  {r.trangThai === 'DA_XAC_NHAN' && coTheCheckInTheoGio(r, checkInSomToiDaPhut) && coQuyen('DAT_BAN_CHECK_IN') ? (
                    <Button size="small" onClick={() => hanhDong(r, 'check-in')}>
                      Check-in
                    </Button>
                  ) : null}

                  {r.trangThai === 'DA_CHECK_IN' && coQuyen('DAT_BAN_HOAN_THANH') ? (
                    <Button size="small" type="primary" onClick={() => hanhDong(r, 'hoan-thanh')}>
                      Hoàn thành
                    </Button>
                  ) : null}

                  {r.trangThai === 'DA_XAC_NHAN' && coTheDanhDauKhongDenTheoGio(r, thoiGianChoKhachPhut) && coQuyen('DAT_BAN_KHONG_DEN') ? (
                    <Button size="small" onClick={() => hanhDong(r, 'khong-den')}>
                      Không đến
                    </Button>
                  ) : null}

                  {['CHO_XAC_NHAN', 'DA_XAC_NHAN'].includes(r.trangThai) && coQuyen('DAT_BAN_HUY') ? (
                    <Button size="small" danger onClick={() => hanhDong(r, 'huy')}>
                      Hủy
                    </Button>
                  ) : null}
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Drawer
        width={680}
        open={Boolean(chiTietId)}
        onClose={() => setChiTietId(null)}
        title={chiTiet ? `Đặt bàn ${chiTiet.maDatBan}` : 'Chi tiết đặt bàn'}
        className="admin-detail-drawer admin-booking-detail-drawer"
      >
        {chiTietQuery.isPending ? (
          <Typography.Text type="secondary">Đang tải chi tiết...</Typography.Text>
        ) : chiTietQuery.error ? (
          <CanhBaoLoi loi={chiTietQuery.error} macDinh="Không tải được chi tiết đặt bàn." />
        ) : chiTiet ? (
          <div className="admin-booking-detail-content">
            <Flex justify="space-between" align="center" gap={10} wrap>
              <Space size={6} wrap>
                <TrangThai value={chiTiet.trangThai} />
                {laQuaGio(chiTiet) ? <Tag color="red">Quá giờ</Tag> : null}
                {chuaToiGioCheckIn(chiTiet, checkInSomToiDaPhut) ? (
                  <Tag>Chưa tới giờ</Tag>
                ) : null}
              </Space>
              <Tag>{tenNguonDat[chiTiet.nguonDat || ''] || 'Không rõ nguồn'}</Tag>
            </Flex>

            {chuaToiGioCheckIn(chiTiet, checkInSomToiDaPhut) ? (
              <Alert
                type="info"
                showIcon
                message="Chưa tới giờ check-in"
                description={
                  <>
                    Có thể check-in từ {gioMoCheckIn(chiTiet, checkInSomToiDaPhut)?.format('HH:mm DD/MM/YYYY')}
                    {' '} (sớm tối đa {checkInSomToiDaPhut} phút).
                    <br />
                    Chỉ có thể đánh dấu “Không đến” từ {gioChoPhepKhongDen(chiTiet, thoiGianChoKhachPhut)?.format('HH:mm DD/MM/YYYY')}
                    {' '} nếu khách vẫn chưa tới.
                  </>
                }
              />
            ) : null}

            {canhBaoChiTiet ? (
              <Alert
                type="warning"
                showIcon
                message="Lượt đặt cần xử lý"
                description={canhBaoChiTiet}
              />
            ) : null}

            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Khách hàng">{chiTiet.hoTen}</Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">{chiTiet.soDienThoai}</Descriptions.Item>
              <Descriptions.Item label="Email">{chiTiet.email || '—'}</Descriptions.Item>
              <Descriptions.Item label="Ngày">{dinhDangNgay(chiTiet.ngayDat)}</Descriptions.Item>
              <Descriptions.Item label="Thời gian">
                {dinhDangGio(chiTiet.gioBatDau)} – {dinhDangGio(chiTiet.gioKetThuc)}
              </Descriptions.Item>
              <Descriptions.Item label="Số khách">{chiTiet.soNguoi} khách</Descriptions.Item>
              <Descriptions.Item label="Bàn">{tenBan(chiTiet)}</Descriptions.Item>
              <Descriptions.Item label="Ghi chú khách">{chiTiet.ghiChuKhach || '—'}</Descriptions.Item>
              <Descriptions.Item label="Ghi chú nội bộ">{ghiChuNoiBo(chiTiet) || '—'}</Descriptions.Item>
            </Descriptions>


            <Divider titlePlacement="start">
              <Space>
                <ShoppingOutlined />
                Món đặt trước
              </Space>
            </Divider>

            {chiTiet.monAn?.length ? (
              <div className="admin-booking-preorder-list">
                {chiTiet.monAn.map((item) => (
                  <div
                    key={`${item.monAnId}-${item.id ?? ''}`}
                    className="admin-booking-finance-row admin-booking-preorder-row"
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
                          className="admin-booking-preorder-note"
                        >
                          Ghi chú: {item.ghiChu}
                        </Typography.Text>
                      ) : null}
                    </div>
                    <strong>{dinhDangTien(item.thanhTien)}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <Alert
                type="info"
                showIcon
                message="Đặt bàn này không có món đặt trước."
              />
            )}

            <Divider titlePlacement="start">
              <Space>
                <GiftOutlined />
                Ưu đãi & số tiền
              </Space>
            </Divider>

            <div className="admin-booking-finance-box">
              <div className="admin-booking-finance-row">
                <span>Tiền món</span>
                <strong>
                  {dinhDangTien(chiTiet.tamTinhMon ?? 0)}
                </strong>
              </div>
              <div className="admin-booking-finance-row">
                <span>Giảm giá</span>
                <strong>
                  -{dinhDangTien(chiTiet.tienGiam ?? 0)}
                </strong>
              </div>
              {chiTiet.maKhuyenMaiApDung ? (
                <div className="admin-booking-finance-row">
                  <span>Mã ưu đãi</span>
                  <Space wrap>
                    <Tag color="green">
                      {chiTiet.maKhuyenMaiApDung}
                    </Tag>
                    {chiTiet.khuyenMai?.tenKhuyenMai ? (
                      <Typography.Text type="secondary">
                        {chiTiet.khuyenMai.tenKhuyenMai}
                      </Typography.Text>
                    ) : null}
                  </Space>
                </div>
              ) : null}
              <div className="admin-booking-finance-row">
                <span>Cọc giữ bàn</span>
                <strong>
                  {dinhDangTien(chiTiet.tienCoc ?? 0)}
                </strong>
              </div>
              <Divider />
              <div className="admin-booking-finance-row total">
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
                  <Card
                    key={payment.id}
                    size="small"
                    className="admin-booking-payment-card"
                    title={
                      <Space wrap>
                        <Typography.Text strong>
                          {payment.maThanhToan}
                        </Typography.Text>
                        <Tag
                          color={
                            mauTrangThaiThanhToan[
                              payment.trangThai
                            ] || 'default'
                          }
                        >
                          {tenTrangThaiThanhToan[
                            payment.trangThai
                          ] || payment.trangThai}
                        </Tag>
                      </Space>
                    }
                  >
                    <div className="admin-booking-finance-row">
                      <span>Số tiền</span>
                      <strong>
                        {dinhDangTien(payment.soTien)}
                      </strong>
                    </div>
                    <div className="admin-booking-finance-row">
                      <span>Phương thức</span>
                      <span>
                        {tenPhuongThucThanhToan[
                          payment.phuongThuc
                        ] || payment.phuongThuc}
                      </span>
                    </div>
                    {payment.thoiGianThanhToan ? (
                      <div className="admin-booking-finance-row">
                        <span>Thanh toán lúc</span>
                        <span>
                          {dinhDangNgayGio(
                            payment.thoiGianThanhToan,
                          )}
                        </span>
                      </div>
                    ) : null}
                    {payment.maGiaoDichCong ? (
                      <div className="admin-booking-finance-row">
                        <span>Mã giao dịch</span>
                        <Typography.Text copyable>
                          {payment.maGiaoDichCong}
                        </Typography.Text>
                      </div>
                    ) : null}

                    {payment.hoanTien?.length ? (
                      <div className="admin-booking-refund-list">
                        {payment.hoanTien.map((refund) => (
                          <div
                            key={refund.id}
                            className="admin-booking-refund-item"
                          >
                            <Flex
                              justify="space-between"
                              align="center"
                              gap={8}
                              wrap
                            >
                              <Typography.Text strong>
                                {refund.maHoanTien}
                              </Typography.Text>
                              <Tag
                                color={
                                  mauTrangThaiHoanTien[
                                    refund.trangThai
                                  ] || 'default'
                                }
                              >
                                {tenTrangThaiHoanTien[
                                  refund.trangThai
                                ] || refund.trangThai}
                              </Tag>
                            </Flex>
                            <div className="admin-booking-finance-row">
                              <span>Số tiền hoàn</span>
                              <strong>
                                {dinhDangTien(refund.soTien)}
                              </strong>
                            </div>
                            <div className="admin-booking-finance-row">
                              <span>Lý do</span>
                              <span>{refund.lyDo || '—'}</span>
                            </div>
                            {refund.thoiGianHoan ? (
                              <div className="admin-booking-finance-row">
                                <span>Hoàn lúc</span>
                                <span>
                                  {dinhDangNgayGio(
                                    refund.thoiGianHoan,
                                  )}
                                </span>
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </Card>
                ))}
              </Space>
            ) : (
              <Alert
                type="info"
                showIcon
                message="Đặt bàn này chưa có giao dịch thanh toán."
              />
            )}

            {coQuyen('THANH_TOAN_XEM') ? (
              <Button
                href="/quan-tri/thanh-toan"
                icon={<CreditCardOutlined />}
              >
                Mở quản lý thanh toán
              </Button>
            ) : null}

            {chiTiet.lichSu?.length ? (
              <div>
                <Typography.Title level={5}>Lịch sử xử lý</Typography.Title>
                <Timeline
                  items={chiTiet.lichSu.map((item) => ({
                    children: (
                      <div>
                        <strong>{tenHanhDong[item.hanhDong] || item.hanhDong}</strong>
                        <div className="admin-booking-history-time">
                          {dinhDangNgayGio(item.thoiGian)}
                        </div>
                      </div>
                    ),
                  }))}
                />
              </div>
            ) : null}

            <div className="admin-booking-detail-actions">
              {chiTiet.trangThai === 'CHO_XAC_NHAN' && !laQuaGio(chiTiet) && coQuyen('DAT_BAN_XAC_NHAN') ? (
                <Button type="primary" onClick={() => hanhDong(chiTiet, 'xac-nhan')}>
                  Xác nhận đặt bàn
                </Button>
              ) : null}

              {chiTiet.trangThai === 'DA_XAC_NHAN' && coTheCheckInTheoGio(chiTiet, checkInSomToiDaPhut) && coQuyen('DAT_BAN_CHECK_IN') ? (
                <Button type="primary" onClick={() => hanhDong(chiTiet, 'check-in')}>
                  Check-in
                </Button>
              ) : null}

              {chiTiet.trangThai === 'DA_CHECK_IN' && coQuyen('DAT_BAN_HOAN_THANH') ? (
                <Button type="primary" onClick={() => hanhDong(chiTiet, 'hoan-thanh')}>
                  Hoàn thành
                </Button>
              ) : null}

              {chiTiet.trangThai === 'DA_XAC_NHAN' && coTheDanhDauKhongDenTheoGio(chiTiet, thoiGianChoKhachPhut) && coQuyen('DAT_BAN_KHONG_DEN') ? (
                <Button onClick={() => hanhDong(chiTiet, 'khong-den')}>Không đến</Button>
              ) : null}

              {['CHO_XAC_NHAN', 'DA_XAC_NHAN'].includes(chiTiet.trangThai) && coQuyen('DAT_BAN_HUY') ? (
                <Button danger onClick={() => hanhDong(chiTiet, 'huy')}>Hủy đặt bàn</Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </Drawer>

      <Drawer
        width={620}
        open={moTao}
        onClose={() => setMoTao(false)}
        title="Tạo đặt bàn tại quầy"
        className="admin-detail-drawer admin-create-booking-drawer"
        extra={
          <Button type="primary" loading={taoMutation.isPending} onClick={() => void taoDatBan()}>
            Tạo đặt bàn
          </Button>
        }
      >
        <Form<TaoDatBanForm>
          form={formTao}
          layout="vertical"
          initialValues={{
            ngay: dayjs(),
            soNguoi: 2,
            nguonDat: 'TRUC_TIEP',
            xacNhanNgay: true,
          }}
          onValuesChange={(changed) => {
            if ('ngay' in changed || 'gioBatDau' in changed || 'soNguoi' in changed) {
              setPhuongAn([]);
              setChonBan('');
            }
          }}
        >
          <Typography.Title level={5}>Thông tin khách</Typography.Title>

          <Flex gap={12} wrap>
            <Form.Item
              name="hoTen"
              label="Họ tên"
              rules={[{ required: true, message: 'Nhập họ tên khách' }]}
              className="admin-create-booking-half"
            >
              <Input placeholder="Nguyễn Văn A" />
            </Form.Item>

            <Form.Item
              name="soDienThoai"
              label="Số điện thoại"
              rules={[{ required: true, message: 'Nhập số điện thoại' }]}
              className="admin-create-booking-half"
            >
              <Input placeholder="09xx xxx xxx" />
            </Form.Item>
          </Flex>

          <Form.Item
            name="email"
            label="Email"
            rules={[{ type: 'email', message: 'Email chưa đúng định dạng' }]}
          >
            <Input placeholder="email@example.com" />
          </Form.Item>

          <Typography.Title level={5}>Thời gian & số khách</Typography.Title>

          <Flex gap={12} wrap>
            <Form.Item
              name="ngay"
              label="Ngày"
              rules={[{ required: true, message: 'Chọn ngày' }]}
              className="admin-create-booking-third"
            >
              <DatePicker
                format="DD/MM/YYYY"
                disabledDate={(d) => d && d.startOf('day').isBefore(dayjs().startOf('day'))}
              />
            </Form.Item>

            <Form.Item
              name="gioBatDau"
              label="Giờ"
              rules={[{ required: true, message: 'Chọn giờ' }]}
              className="admin-create-booking-third"
            >
              <Select
                loading={khungGioQuery.isFetching}
                placeholder="Chọn giờ"
                options={(khungGioQuery.data?.danhSach ?? []).map((gio) => ({
                  value: gio,
                  label: gio,
                }))}
                notFoundContent={ngayTao ? 'Không có khung giờ khả dụng' : 'Chọn ngày trước'}
              />
            </Form.Item>

            <Form.Item
              name="soNguoi"
              label="Số khách"
              rules={[{ required: true, message: 'Nhập số khách' }]}
              className="admin-create-booking-third"
            >
              <InputNumber min={1} max={50} addonAfter="khách" />
            </Form.Item>
          </Flex>

          <Form.Item
            name="nguonDat"
            label="Nguồn đặt"
            rules={[{ required: true, message: 'Chọn nguồn đặt' }]}
          >
            <Select
              options={[
                { value: 'TRUC_TIEP', label: 'Trực tiếp' },
                { value: 'DIEN_THOAI', label: 'Điện thoại' },
                { value: 'FACEBOOK', label: 'Facebook' },
                { value: 'KHAC', label: 'Khác' },
              ]}
            />
          </Form.Item>

          <Card size="small" className="admin-create-booking-table-picker">
            <Flex justify="space-between" align="center" gap={10} wrap>
              <div>
                <strong>Chọn bàn</strong>
                <div className="admin-create-booking-helper">
                  Hệ thống chỉ gợi ý bàn còn phù hợp với thời gian và số khách.
                </div>
              </div>
              <Button
                icon={<SearchOutlined />}
                loading={timBanMutation.isPending}
                onClick={() => void timBan()}
              >
                Tìm bàn phù hợp
              </Button>
            </Flex>

            {phuongAn.length ? (
              <Radio.Group
                value={chonBan}
                onChange={(e) => setChonBan(e.target.value)}
                className="admin-create-booking-options"
              >
                {phuongAn.map((p) => (
                  <Radio key={keyPhuongAn(p)} value={keyPhuongAn(p)}>
                    <div>
                      <strong>{tenPhuongAn(p)}</strong>
                      <span>
                        {p.banAns[0]?.tenKhuVuc ? `${p.banAns[0].tenKhuVuc} · ` : ''}
                        phù hợp tối đa {p.tongSucChuaToiDa} khách
                      </span>
                    </div>
                    <Tag color={p.kieu === 'GHEP_BAN' ? 'blue' : 'green'}>
                      {p.kieu === 'GHEP_BAN' ? 'Ghép bàn' : 'Bàn đơn'}
                    </Tag>
                  </Radio>
                ))}
              </Radio.Group>
            ) : (
              <div className="admin-create-booking-empty">
                Chọn ngày, giờ, số khách rồi bấm “Tìm bàn phù hợp”.
              </div>
            )}
          </Card>

          <Typography.Title level={5}>Ghi chú & xác nhận</Typography.Title>

          <Form.Item name="ghiChu" label="Ghi chú của khách">
            <Input.TextArea
              rows={2}
              maxLength={2000}
              showCount
              placeholder="Ví dụ: cần ghế trẻ em, ưu tiên yên tĩnh..."
            />
          </Form.Item>

          <Form.Item name="ghiChuNoiBo" label="Ghi chú nội bộ">
            <Input.TextArea
              rows={2}
              maxLength={2000}
              showCount
              placeholder="Chỉ nhân viên nhìn thấy"
            />
          </Form.Item>

          <Form.Item name="xacNhanNgay" valuePropName="checked" label="Xác nhận ngay">
            <Switch checkedChildren="Đã xác nhận" unCheckedChildren="Chờ xác nhận" />
          </Form.Item>

          <Alert
            type="info"
            showIcon
            message="Đặt bàn tại quầy cần chọn bàn trước khi lưu."
            description="Nếu bật Xác nhận ngay, lượt đặt sẽ ở trạng thái Đã xác nhận ngay sau khi tạo."
          />
        </Form>
      </Drawer>
    </>
  );
}
