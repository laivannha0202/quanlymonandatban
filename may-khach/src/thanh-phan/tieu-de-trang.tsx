import type { ReactNode } from 'react';
import { Flex, Space, Typography } from 'antd';

interface TieuDeTrangProps {
  tieuDe: ReactNode;
  moTa?: ReactNode;
  hanhDong?: ReactNode;
  nhan?: ReactNode;
}

export function TieuDeTrang({
  tieuDe,
  moTa,
  hanhDong,
  nhan = 'QUẢN TRỊ VẬN HÀNH',
}: TieuDeTrangProps) {
  return (
    <Flex
      justify="space-between"
      align="flex-start"
      gap={16}
      wrap
      className="page-title-row admin-page-title-final"
    >
      <div>
        {nhan ? <Typography.Text className="eyebrow">{nhan}</Typography.Text> : null}
        <Typography.Title level={2}>{tieuDe}</Typography.Title>
        {moTa ? (
          <Typography.Paragraph type="secondary" className="page-subtitle">
            {moTa}
          </Typography.Paragraph>
        ) : null}
      </div>
      {hanhDong ? <Space wrap className="admin-page-actions">{hanhDong}</Space> : null}
    </Flex>
  );
}
