import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App as AntdApp, ConfigProvider } from 'antd';
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
      <ConfigProvider locale={viVN} theme={giaoDien}>
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
