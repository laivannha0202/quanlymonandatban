import {
  ArrowLeftOutlined,
  MailOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { Alert, Button, Form, Input, Space } from 'antd';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { xacThucApi } from '@/dich-vu/xac-thuc.api';
import { LoiApi } from '@/dich-vu/http';
import { KhungXacThuc } from '@/thanh-phan/khung-xac-thuc';

export function QuenMatKhau() {
  const navigate = useNavigate();
  const [thongBao, setThongBao] = useState('');
  const [tokenDev, setTokenDev] = useState('');
  const [loi, setLoi] = useState('');
  const [tai, setTai] = useState(false);

  return (
    <KhungXacThuc
      eyebrow="KHÔI PHỤC TÀI KHOẢN"
      tieuDe="Quên mật khẩu"
      moTa="Nhập email đã đăng ký. Hệ thống sẽ tạo yêu cầu đặt lại mật khẩu cho tài khoản."
    >
      {loi && <Alert type="error" showIcon message={loi} className="mb-16" />}
      {thongBao && (
        <Alert
          type="success"
          showIcon
          message={thongBao}
          description="Vì lý do bảo mật, hệ thống không hiển thị mã đặt lại mật khẩu trên màn hình."
          className="mb-16"
          action={
            tokenDev ? (
              <Button
                size="small"
                onClick={() => navigate(`/dat-lai-mat-khau?token=${encodeURIComponent(tokenDev)}`)}
              >
                Tiếp tục đặt lại mật khẩu
              </Button>
            ) : undefined
          }
        />
      )}

      <Form
        layout="vertical"
        size="large"
        requiredMark={false}
        onFinish={async (v: { email: string }) => {
          setLoi('');
          setTai(true);
          try {
            const kq = await xacThucApi.quenMatKhau(v.email);
            setThongBao(kq.thongBao);
            setTokenDev(kq.tokenDatLaiMatKhau || '');
          } catch (e) {
            setLoi(e instanceof LoiApi ? e.message : 'Không gửi được yêu cầu.');
          } finally {
            setTai(false);
          }
        }}
      >
        <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Nhập email' }, { type: 'email', message: 'Email không hợp lệ' }]}>
          <Input prefix={<MailOutlined />} autoComplete="email" placeholder="email@example.com" />
        </Form.Item>
        <Button block type="primary" htmlType="submit" loading={tai} icon={<SendOutlined />}>
          Gửi yêu cầu
        </Button>
      </Form>

      <Space className="auth-back-link">
        <ArrowLeftOutlined />
        <Link to="/dang-nhap">Quay lại đăng nhập</Link>
      </Space>
    </KhungXacThuc>
  );
}
