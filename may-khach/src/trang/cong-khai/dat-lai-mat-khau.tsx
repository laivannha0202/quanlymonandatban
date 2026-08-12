import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { Alert, Button, Form, Input, Result, Space } from 'antd';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { LoiApi } from '@/dich-vu/http';
import { xacThucApi } from '@/dich-vu/xac-thuc.api';
import { KhungXacThuc } from '@/thanh-phan/khung-xac-thuc';

export function DatLaiMatKhau() {
  const [params] = useSearchParams();
  const [thanhCong, setThanhCong] = useState(false);
  const [loi, setLoi] = useState('');
  const [tai, setTai] = useState(false);
  const tokenMacDinh = params.get('token') || '';

  return (
    <KhungXacThuc
      eyebrow="BẢO MẬT TÀI KHOẢN"
      tieuDe="Đặt lại mật khẩu"
      moTa="Chọn mật khẩu mới cho tài khoản của bạn."
    >
      {loi && <Alert type="error" showIcon message={loi} className="mb-16" />}

      {thanhCong ? (
        <Result
          status="success"
          icon={<CheckCircleOutlined />}
          title="Mật khẩu đã được thay đổi"
          subTitle="Bạn có thể đăng nhập lại bằng mật khẩu mới."
          extra={<Link to="/dang-nhap"><Button type="primary">Đăng nhập</Button></Link>}
        />
      ) : (
        <Form
          layout="vertical"
          size="large"
          initialValues={{ token: tokenMacDinh }}
          requiredMark={false}
          onFinish={async (v: { token: string; matKhauMoi: string; xacNhan: string }) => {
            setLoi('');
            if (v.matKhauMoi !== v.xacNhan) {
              setLoi('Mật khẩu xác nhận không khớp.');
              return;
            }

            setTai(true);
            try {
              await xacThucApi.datLaiMatKhau(v.token.trim(), v.matKhauMoi);
              setThanhCong(true);
            } catch (e) {
              setLoi(e instanceof LoiApi ? e.message : 'Không đặt lại được mật khẩu.');
            } finally {
              setTai(false);
            }
          }}
        >
          {!tokenMacDinh ? (
            <Alert
              type="warning"
              showIcon
              message="Liên kết đặt lại mật khẩu không hợp lệ hoặc đã thiếu mã xác thực."
              description="Hãy quay lại trang Quên mật khẩu và tạo một yêu cầu mới."
              className="mb-16"
            />
          ) : null}
          <Form.Item name="token" hidden rules={[{ required: true, min: 32 }]}>
            <Input />
          </Form.Item>
          <Form.Item name="matKhauMoi" label="Mật khẩu mới" rules={[{ required: true }, { min: 8 }]}>
            <Input.Password prefix={<LockOutlined />} autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            name="xacNhan"
            label="Nhập lại mật khẩu"
            dependencies={['matKhauMoi']}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('matKhauMoi') === value) return Promise.resolve();
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp.'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} autoComplete="new-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={tai} disabled={!tokenMacDinh}>Đặt lại mật khẩu</Button>
        </Form>
      )}

      {!thanhCong ? (
        <Space className="auth-back-link"><ArrowLeftOutlined /><Link to="/dang-nhap">Quay lại đăng nhập</Link></Space>
      ) : null}
    </KhungXacThuc>
  );
}
