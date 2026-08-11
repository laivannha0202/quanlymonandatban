import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App as AntdApp, ConfigProvider, Empty } from 'antd';
import viVN from 'antd/es/locale/vi_VN';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import { UngDung } from './app';
import { XacThucProvider } from '@/ngu-canh/xac-thuc.context';
import { giaoDien } from '@/cau-hinh/giao-dien';
import { queryClient } from '@/cau-hinh/truy-van';
import { RanhGioiLoi } from '@/thanh-phan/ranh-gioi-loi';
import '@/cau-hinh/ngay-gio';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        locale={viVN}
        theme={giaoDien}
        renderEmpty={() => (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Chưa có dữ liệu"
          />
        )}
        form={{
          validateMessages: {
            required: '${label} là bắt buộc',
            types: {
              email: '${label} không đúng định dạng email',
              number: '${label} phải là số',
            },
          },
        }}
      >
        <AntdApp>
          <RanhGioiLoi>
            <BrowserRouter>
              <XacThucProvider><UngDung /></XacThucProvider>
            </BrowserRouter>
          </RanhGioiLoi>
        </AntdApp>
      </ConfigProvider>
    </QueryClientProvider>
  </StrictMode>,
);
