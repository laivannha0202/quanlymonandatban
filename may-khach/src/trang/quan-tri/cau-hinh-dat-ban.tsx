import {
  ReloadOutlined,
  SaveOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Form,
  InputNumber,
  Row,
  Space,
  Switch,
  Typography,
} from 'antd';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useEffect } from 'react';
import {
  cauHinhDatBanApi,
  type CauHinhDatBanQuanTri,
} from '@/dich-vu/cau-hinh-dat-ban.api';
import { LoiApi } from '@/dich-vu/http';
import { CanhBaoLoi } from '@/thanh-phan/canh-bao-loi';
import { TieuDeTrang } from '@/thanh-phan/tieu-de-trang';

export function QuanTriCauHinhDatBan() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<CauHinhDatBanQuanTri>();

  const query = useQuery({
    queryKey: ['quan-tri', 'cau-hinh-dat-ban'],
    queryFn: cauHinhDatBanApi.lay,
  });

  useEffect(() => {
    if (query.data) {
      form.setFieldsValue(query.data);
    }
  }, [form, query.data]);

  const mutation = useMutation({
    mutationFn: cauHinhDatBanApi.capNhat,
    onSuccess: async (data) => {
      message.success('Đã lưu cấu hình đặt bàn.');
      form.setFieldsValue(data);
      await queryClient.invalidateQueries({
        queryKey: ['quan-tri', 'cau-hinh-dat-ban'],
      });
    },
    onError: (error) =>
      message.error(
        error instanceof LoiApi
          ? error.message
          : 'Không lưu được cấu hình.',
      ),
  });

  return (
    <>
      <TieuDeTrang
        tieuDe="Cấu hình đặt bàn"
        moTa="Thiết lập chính sách đặt món trước, tiền cọc, thời hạn hủy và tỷ lệ hoàn tiền."
        hanhDong={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => query.refetch()}
            >
              Làm mới
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={mutation.isPending}
              onClick={() => form.submit()}
            >
              Lưu cấu hình
            </Button>
          </Space>
        }
      />

      <CanhBaoLoi
        loi={query.error}
        macDinh="Không tải được cấu hình đặt bàn."
      />

      <Alert
        type="info"
        showIcon
        icon={<SettingOutlined />}
        message="Các phép tính tiền vẫn được backend quyết định."
        description="Frontend chỉ chỉnh chính sách được phép. Số tiền của booking luôn được tính lại ở máy chủ."
        className="mb-16"
      />

      <Form
        form={form}
        layout="vertical"
        disabled={query.isPending || mutation.isPending}
        onFinish={(values) => mutation.mutate(values)}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card
              title="Đặt món trước"
              className="admin-config-card"
            >
              <Form.Item
                name="choPhepDatMonTruoc"
                label="Cho phép khách đặt món trước"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                noStyle
                shouldUpdate={(prev, next) =>
                  prev.choPhepDatMonTruoc !==
                  next.choPhepDatMonTruoc
                }
              >
                {({ getFieldValue }) => (
                  <Form.Item
                    name="yeuCauThanhToanMonTruoc"
                    label="Yêu cầu thanh toán món trước"
                    valuePropName="checked"
                    extra={
                      getFieldValue('choPhepDatMonTruoc')
                        ? 'Khi bật, tiền món sau giảm được cộng vào số phải thanh toán trước.'
                        : 'Không có hiệu lực khi chức năng đặt món trước đang tắt.'
                    }
                  >
                    <Switch
                      disabled={
                        !getFieldValue(
                          'choPhepDatMonTruoc',
                        )
                      }
                    />
                  </Form.Item>
                )}
              </Form.Item>

              <Form.Item
                name="tienCocGiuBan"
                label="Tiền cọc giữ bàn"
                rules={[
                  { required: true },
                  {
                    type: 'number',
                    min: 0,
                    max: 100000000,
                  },
                ]}
              >
                <InputNumber
                  min={0}
                  max={100000000}
                  step={10000}
                  addonAfter="₫"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              title="Hủy & hoàn tiền"
              className="admin-config-card"
            >
              <Form.Item
                name="thoiGianHuyTruocPhut"
                label="Khách phải hủy trước tối thiểu"
                rules={[
                  { required: true },
                  {
                    type: 'number',
                    min: 0,
                    max: 10080,
                  },
                ]}
                extra="Quá thời hạn này, khách không thể tự hủy booking."
              >
                <InputNumber
                  min={0}
                  max={10080}
                  addonAfter="phút"
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item
                name="tyLeHoanTienHuyDungHan"
                label="Tỷ lệ hoàn khi hủy đúng hạn"
                rules={[
                  { required: true },
                  {
                    type: 'number',
                    min: 0,
                    max: 100,
                  },
                ]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  addonAfter="%"
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Typography.Paragraph type="secondary">
                Admin hủy booking đã thanh toán vẫn áp dụng
                chính sách hoàn 100% và yêu cầu quyền
                HOAN_TIEN_THUC_HIEN.
              </Typography.Paragraph>
            </Card>
          </Col>
        </Row>
      </Form>
    </>
  );
}
