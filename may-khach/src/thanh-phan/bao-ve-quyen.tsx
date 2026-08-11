import type { ReactNode } from 'react';
import { Button, Result } from 'antd';
import { Link } from 'react-router';
import { useXacThuc } from '@/ngu-canh/xac-thuc.context';

export function BaoVeQuyen({
  quyen,
  children,
}: {
  quyen: string | string[];
  children: ReactNode;
}) {
  const { coTatCaQuyen } = useXacThuc();
  const danhSach = Array.isArray(quyen)
    ? quyen
    : [quyen];

  if (!coTatCaQuyen(danhSach)) {
    return (
      <Result
        status="403"
        title="Không có quyền truy cập"
        subTitle="Không có quyền truy cập chức năng này."
        extra={
          <Link to="/quan-tri">
            <Button type="primary">
              Về khu quản trị
            </Button>
          </Link>
        }
      />
    );
  }

  return <>{children}</>;
}
