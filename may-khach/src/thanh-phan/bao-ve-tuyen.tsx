import { Button, Flex, Result, Spin } from 'antd';
import { Link, Navigate, Outlet, useLocation } from 'react-router';
import { useXacThuc } from '@/ngu-canh/xac-thuc.context';

export function BaoVeTuyen({ quanTri = false }: { quanTri?: boolean }) {
  const { nguoiDung, dangKhoiTao, laKhuVucQuanTri } = useXacThuc();
  const viTri = useLocation();

  if (dangKhoiTao) {
    return <Flex align="center" justify="center" style={{ minHeight: '60vh' }}><Spin size="large" /></Flex>;
  }
  if (!nguoiDung) return <Navigate to="/dang-nhap" state={{ tu: viTri.pathname }} replace />;
  if (quanTri && !laKhuVucQuanTri) {
    return <Result status="403" title="Không có quyền truy cập" subTitle="Tài khoản hiện tại không thuộc khu vực quản trị." extra={<Link to="/"><Button type="primary">Về trang chủ</Button></Link>} />;
  }
  return <Outlet />;
}
