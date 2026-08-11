import { ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import { App, Button, Card, Col, Form, Input, InputNumber, Row, Space, Switch, Typography } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { quanTriApi, type CauHinhQuanTri } from '@/dich-vu/quan-tri.api';
import { LoiApi } from '@/dich-vu/http';
import { CanhBaoLoi } from '@/thanh-phan/canh-bao-loi';
import { TieuDeTrang } from '@/thanh-phan/tieu-de-trang';

type GiaTriForm = Record<string, boolean | number | string>;

function giaTriChoForm(item: CauHinhQuanTri): boolean | number | string {
  if (item.kieuDuLieu === 'BOOLEAN') return item.giaTri.trim().toLowerCase() === 'true';
  if (item.kieuDuLieu === 'SO') return Number(item.giaTri);
  return item.giaTri;
}

function giaTriThanhChuoi(item: CauHinhQuanTri, value: boolean | number | string | undefined): string {
  if (item.kieuDuLieu === 'BOOLEAN') return value ? 'true' : 'false';
  return String(value ?? '');
}

function tenNhom(nhom: string): string {
  const map: Record<string, string> = {
    THONG_TIN_NHA_HANG: 'Thông tin nhà hàng',
    DAT_BAN: 'Quy tắc đặt bàn',
    HE_THONG: 'Hệ thống',
  };
  return map[nhom] ?? nhom.replaceAll('_', ' ');
}

export function QuanTriCauHinh() {
  const { message } = App.useApp();
  const [form] = Form.useForm<GiaTriForm>();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['quan-tri', 'cau-hinh'],
    queryFn: () => quanTriApi.cauHinh(),
  });

  useEffect(() => {
    if (!query.data) return;
    form.setFieldsValue(
      Object.fromEntries(query.data.map((item) => [item.khoa, giaTriChoForm(item)])),
    );
  }, [form, query.data]);

  const cacNhom = useMemo(() => {
    const map = new Map<string, CauHinhQuanTri[]>();
    for (const item of query.data ?? []) {
      const danhSach = map.get(item.nhom) ?? [];
      danhSach.push(item);
      map.set(item.nhom, danhSach);
    }
    return [...map.entries()];
  }, [query.data]);

  const mutation = useMutation({
    mutationFn: (values: GiaTriForm) => {
      const danhSach = (query.data ?? [])
        .filter((item) => item.choPhepSua)
        .map((item) => ({
          khoa: item.khoa,
          giaTri: giaTriThanhChuoi(item, values[item.khoa]),
        }));
      return quanTriApi.capNhatCauHinh(danhSach);
    },
    onSuccess: (duLieu) => {
      queryClient.setQueryData(['quan-tri', 'cau-hinh'], duLieu);
      message.success('Đã lưu cấu hình');
    },
    onError: (e) => {
      message.error(e instanceof LoiApi ? e.message : 'Không lưu được cấu hình.');
    },
  });

  function truongNhap(item: CauHinhQuanTri) {
    const disabled = !item.choPhepSua;
    if (item.kieuDuLieu === 'BOOLEAN') return <Switch disabled={disabled} />;
    if (item.kieuDuLieu === 'SO') return <InputNumber disabled={disabled} style={{ width: '100%' }} />;
    if (item.kieuDuLieu === 'JSON') return <Input.TextArea disabled={disabled} rows={4} />;
    return <Input disabled={disabled} />;
  }

  return <>
    <TieuDeTrang
      tieuDe="Cấu hình hệ thống"
      moTa="Thông tin nhà hàng và các quy tắc nghiệp vụ đặt bàn được kiểm tra lại ở Backend trước khi lưu."
      hanhDong={<Space>
        <Button icon={<ReloadOutlined />} onClick={() => query.refetch()}>Làm mới</Button>
        <Button
          aria-label="Lưu cấu hình"
          type="primary"
          icon={<SaveOutlined />}
          loading={mutation.isPending}
          onClick={() => form.submit()}
        >
          Lưu cấu hình
        </Button>
      </Space>}
    />
    <CanhBaoLoi loi={query.error} macDinh="Không tải được cấu hình hệ thống." />
    <Card loading={query.isPending}>
      <Form size="middle" form={form} layout="vertical" onFinish={(values) => mutation.mutate(values)}>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          {cacNhom.map(([nhom, danhSach]) => <Card
            key={nhom}
            size="small"
            title={<Typography.Text strong>{tenNhom(nhom)}</Typography.Text>}
          >
            <Row gutter={[18, 4]}>
              {danhSach.map((item) => <Col xs={24} lg={12} key={item.khoa}>
                <Form.Item
                  name={item.khoa}
                  label={item.moTa || item.khoa}
                  valuePropName={item.kieuDuLieu === 'BOOLEAN' ? 'checked' : 'value'}
                  extra={<Typography.Text type="secondary"><code>{item.khoa}</code>{item.choPhepSua ? '' : ' · chỉ đọc'}</Typography.Text>}
                >
                  {truongNhap(item)}
                </Form.Item>
              </Col>)}
            </Row>
          </Card>)}
        </Space>
      </Form>
    </Card>
  </>;
}
