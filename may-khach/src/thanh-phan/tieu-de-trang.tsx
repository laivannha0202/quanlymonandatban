import type { ReactNode } from 'react';
import { Flex, Space, Typography } from 'antd';

interface TieuDeTrangProps {
  tieuDe: ReactNode;
  moTa?: ReactNode;
  hanhDong?: ReactNode;
}

export function TieuDeTrang({ tieuDe, moTa, hanhDong }: TieuDeTrangProps) {
  return (
    <Flex justify="space-between" align="flex-start" gap={16} wrap className="page-title-row">
      <div>
        <Typography.Title level={2}>{tieuDe}</Typography.Title>
        {moTa ? <Typography.Paragraph type="secondary" className="page-subtitle">{moTa}</Typography.Paragraph> : null}
      </div>
      {hanhDong ? <Space wrap>{hanhDong}</Space> : null}
    </Flex>
  );
}
