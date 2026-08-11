import { Alert, App, Button, Card, Form, Input, Typography } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { xacThucApi } from '@/dich-vu/xac-thuc.api';
import { LoiApi } from '@/dich-vu/http';
import { useXacThuc } from '@/ngu-canh/xac-thuc.context';

type FormDoiMatKhau = {
  matKhauHienTai: string;
  matKhauMoi: string;
  xacNhan: string;
};

export function DoiMatKhau() {
  const { message } = App.useApp();
  const { nguoiDung, dangXuat } = useXacThuc();
  const navigate = useNavigate();
  const [form] = Form.useForm<FormDoiMatKhau>();
  const [loi, setLoi] = useState('');
  const [dangLuu, setDangLuu] = useState(false);

  return (
    <div className="page-container section narrow">
      <Typography.Title level={2}>
        Đổi mật khẩu
      </Typography.Title>

      {nguoiDung?.batBuocDoiMatKhau ? (
        <Alert
          type="warning"
          showIcon
          message="Bạn phải đổi mật khẩu trước khi tiếp tục sử dụng hệ thống."
          className="mb-16"
        />
      ) : null}

      {loi ? (
        <Alert
          type="error"
          showIcon
          message={loi}
          className="mb-16"
        />
      ) : null}

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            setLoi('');

            if (values.matKhauMoi !== values.xacNhan) {
              setLoi(
                'Mật khẩu mới và xác nhận không khớp.',
              );
              return;
            }

            setDangLuu(true);

            try {
              await xacThucApi.doiMatKhau(
                values.matKhauHienTai,
                values.matKhauMoi,
              );

              message.success(
                'Đã đổi mật khẩu. Vui lòng đăng nhập lại.',
              );

              await dangXuat();

              navigate('/dang-nhap', {
                replace: true,
              });
            } catch (e) {
              setLoi(
                e instanceof LoiApi
                  ? e.message
                  : 'Đổi mật khẩu thất bại.',
              );
            } finally {
              setDangLuu(false);
            }
          }}
        >
          <Form.Item
            name="matKhauHienTai"
            label="Mật khẩu hiện tại"
            rules={[
              { required: true },
              { min: 8 },
            ]}
          >
            <Input.Password
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item
            name="matKhauMoi"
            label="Mật khẩu mới"
            rules={[
              { required: true },
              { min: 8 },
            ]}
          >
            <Input.Password
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item
            name="xacNhan"
            label="Nhập lại mật khẩu mới"
            dependencies={['matKhauMoi']}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (
                    !value ||
                    getFieldValue('matKhauMoi') === value
                  ) {
                    return Promise.resolve();
                  }

                  return Promise.reject(
                    new Error(
                      'Mật khẩu xác nhận không khớp.',
                    ),
                  );
                },
              }),
            ]}
          >
            <Input.Password
              autoComplete="new-password"
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={dangLuu}
          >
            Lưu mật khẩu mới
          </Button>
        </Form>
      </Card>
    </div>
  );
}
