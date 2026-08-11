import { lazy, Suspense } from 'react';
import { Spin } from 'antd';
import { Route, Routes } from 'react-router';
import { BoCucCongKhai } from '@/bo-cuc/bo-cuc-cong-khai';
import { BoCucQuanTri } from '@/bo-cuc/bo-cuc-quan-tri';
import { BaoVeTuyen } from '@/thanh-phan/bao-ve-tuyen';

const TrangChu = lazy(() => import('@/trang/cong-khai/trang-chu').then((m) => ({ default: m.TrangChu })));
const ThucDon = lazy(() => import('@/trang/cong-khai/thuc-don').then((m) => ({ default: m.ThucDon })));
const ChiTietMon = lazy(() => import('@/trang/cong-khai/chi-tiet-mon').then((m) => ({ default: m.ChiTietMon })));
const DatBanPage = lazy(() => import('@/trang/cong-khai/dat-ban').then((m) => ({ default: m.DatBanPage })));
const TraCuu = lazy(() => import('@/trang/cong-khai/tra-cuu').then((m) => ({ default: m.TraCuu })));
const KhuyenMai = lazy(() => import('@/trang/cong-khai/khuyen-mai').then((m) => ({ default: m.KhuyenMai })));
const DangNhap = lazy(() => import('@/trang/cong-khai/dang-nhap').then((m) => ({ default: m.DangNhap })));
const DangKy = lazy(() => import('@/trang/cong-khai/dang-ky').then((m) => ({ default: m.DangKy })));
const QuenMatKhau = lazy(() => import('@/trang/cong-khai/quen-mat-khau').then((m) => ({ default: m.QuenMatKhau })));
const DatLaiMatKhau = lazy(() => import('@/trang/cong-khai/dat-lai-mat-khau').then((m) => ({ default: m.DatLaiMatKhau })));
const LichSuDatBan = lazy(() => import('@/trang/khach-hang/lich-su-dat-ban').then((m) => ({ default: m.LichSuDatBan })));
const HoSo = lazy(() => import('@/trang/khach-hang/ho-so').then((m) => ({ default: m.HoSo })));
const DoiMatKhau = lazy(() => import('@/trang/khach-hang/doi-mat-khau').then((m) => ({ default: m.DoiMatKhau })));
const ThongBao = lazy(() => import('@/trang/khach-hang/thong-bao').then((m) => ({ default: m.ThongBao })));
const DanhGiaCuaToi = lazy(() => import('@/trang/khach-hang/danh-gia').then((m) => ({ default: m.DanhGiaCuaToi })));
const Dashboard = lazy(() => import('@/trang/quan-tri/dashboard').then((m) => ({ default: m.Dashboard })));
const QuanTriDatBan = lazy(() => import('@/trang/quan-tri/dat-ban').then((m) => ({ default: m.QuanTriDatBan })));
const QuanTriKhuVuc = lazy(() => import('@/trang/quan-tri/khu-vuc').then((m) => ({ default: m.QuanTriKhuVuc })));
const QuanTriBanAn = lazy(() => import('@/trang/quan-tri/ban-an').then((m) => ({ default: m.QuanTriBanAn })));
const QuanTriMonAn = lazy(() => import('@/trang/quan-tri/mon-an').then((m) => ({ default: m.QuanTriMonAn })));
const QuanTriDanhMucMon = lazy(() => import('@/trang/quan-tri/danh-muc-mon').then((m) => ({ default: m.QuanTriDanhMucMon })));
const QuanTriKhachHang = lazy(() => import('@/trang/quan-tri/khach-hang').then((m) => ({ default: m.QuanTriKhachHang })));
const QuanTriNhanVien = lazy(() => import('@/trang/quan-tri/nhan-vien').then((m) => ({ default: m.QuanTriNhanVien })));
const QuanTriKhuyenMai = lazy(() => import('@/trang/quan-tri/khuyen-mai').then((m) => ({ default: m.QuanTriKhuyenMai })));
const QuanTriDanhGia = lazy(() => import('@/trang/quan-tri/danh-gia').then((m) => ({ default: m.QuanTriDanhGia })));
const QuanTriBaoCao = lazy(() => import('@/trang/quan-tri/bao-cao').then((m) => ({ default: m.QuanTriBaoCao })));
const QuanTriVaiTro = lazy(() => import('@/trang/quan-tri/vai-tro').then((m) => ({ default: m.QuanTriVaiTro })));
const QuanTriNhatKy = lazy(() => import('@/trang/quan-tri/nhat-ky').then((m) => ({ default: m.QuanTriNhatKy })));
const QuanTriCauHinh = lazy(() => import('@/trang/quan-tri/cau-hinh').then((m) => ({ default: m.QuanTriCauHinh })));
const QuanTriGioHoatDong = lazy(() => import('@/trang/quan-tri/gio-hoat-dong').then((m) => ({ default: m.QuanTriGioHoatDong })));
const QuanTriNgayDacBiet = lazy(() => import('@/trang/quan-tri/ngay-dac-biet').then((m) => ({ default: m.QuanTriNgayDacBiet })));
const KhongTimThay = lazy(() => import('@/trang/khong-tim-thay').then((m) => ({ default: m.KhongTimThay })));

function DangTaiTrang() {
  return <div className="route-loading"><Spin size="large" /></div>;
}

export function UngDung() {
  return <Suspense fallback={<DangTaiTrang />}><Routes>
    <Route element={<BoCucCongKhai />}>
      <Route index element={<TrangChu />} />
      <Route path="thuc-don" element={<ThucDon />} />
      <Route path="thuc-don/:duongDan" element={<ChiTietMon />} />
      <Route path="khuyen-mai" element={<KhuyenMai />} />
      <Route path="dat-ban" element={<DatBanPage />} />
      <Route path="tra-cuu" element={<TraCuu />} />
      <Route path="dang-nhap" element={<DangNhap />} />
      <Route path="dang-ky" element={<DangKy />} />
      <Route path="quen-mat-khau" element={<QuenMatKhau />} />
      <Route path="dat-lai-mat-khau" element={<DatLaiMatKhau />} />
      <Route element={<BaoVeTuyen />}>
        <Route path="tai-khoan/dat-ban" element={<LichSuDatBan />} />
        <Route path="tai-khoan/ho-so" element={<HoSo />} />
        <Route path="tai-khoan/danh-gia" element={<DanhGiaCuaToi />} />
        <Route path="tai-khoan/thong-bao" element={<ThongBao />} />
        <Route path="tai-khoan/doi-mat-khau" element={<DoiMatKhau />} />
      </Route>
    </Route>
    <Route element={<BaoVeTuyen quanTri />}>
      <Route path="quan-tri" element={<BoCucQuanTri />}>
        <Route index element={<Dashboard />} />
        <Route path="dat-ban" element={<QuanTriDatBan />} />
        <Route path="khu-vuc" element={<QuanTriKhuVuc />} />
        <Route path="ban-an" element={<QuanTriBanAn />} />
        <Route path="danh-muc-mon" element={<QuanTriDanhMucMon />} />
        <Route path="mon-an" element={<QuanTriMonAn />} />
        <Route path="khach-hang" element={<QuanTriKhachHang />} />
        <Route path="nhan-vien" element={<QuanTriNhanVien />} />
        <Route path="khuyen-mai" element={<QuanTriKhuyenMai />} />
        <Route path="danh-gia" element={<QuanTriDanhGia />} />
        <Route path="bao-cao" element={<QuanTriBaoCao />} />
        <Route path="vai-tro" element={<QuanTriVaiTro />} />
        <Route path="gio-hoat-dong" element={<QuanTriGioHoatDong />} />
        <Route path="ngay-dac-biet" element={<QuanTriNgayDacBiet />} />
        <Route path="cau-hinh" element={<QuanTriCauHinh />} />
        <Route path="nhat-ky" element={<QuanTriNhatKy />} />
      </Route>
    </Route>
    <Route path="*" element={<KhongTimThay />} />
  </Routes></Suspense>;
}
