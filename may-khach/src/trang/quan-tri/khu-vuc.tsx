import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, UploadOutlined } from '@ant-design/icons';
import { App, Button, Card, Form, Image, Input, InputNumber, Modal, Select, Space, Table, Typography, Upload } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { quanTriApi, type KhuVucPayload, type KhuVucQuanTri } from '@/dich-vu/quan-tri.api';
import { LoiApi } from '@/dich-vu/http';
import { useXacThuc } from '@/ngu-canh/xac-thuc.context';
import { CanhBaoLoi } from '@/thanh-phan/canh-bao-loi';
import { TieuDeTrang } from '@/thanh-phan/tieu-de-trang';
import { TrangThai } from '@/thanh-phan/trang-thai';

type FormData = KhuVucPayload;

function taoMaKhuVucTuTen(tenKhuVuc: string): string {
  const hauTo = tenKhuVuc
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24)
    .replace(/_+$/g, '');

  return hauTo ? `HV_KV_${hauTo}` : '';
}


export function QuanTriKhuVuc() {
  const { message, modal } = App.useApp();
  const { coQuyen } = useXacThuc();
  const coQuanLy = coQuyen('KHU_VUC_QUAN_LY');
  const queryClient = useQueryClient();
  const [form] = Form.useForm<FormData>();
  const [dangSua, setDangSua] = useState<KhuVucQuanTri | null>(null);
  const [moForm, setMoForm] = useState(false);
  const [tuKhoa, setTuKhoa] = useState('');
  const [trangThai, setTrangThai] = useState<string>('HOAT_DONG');
  const hinhAnhDangNhap = Form.useWatch('hinhAnh', form);

  const query = useQuery({
    queryKey: ['quan-tri', 'khu-vuc', tuKhoa, trangThai],
    queryFn: () => quanTriApi.khuVuc({ tuKhoa, trangThai }),
  });

  const taiAnhMutation = useMutation({
    mutationFn: quanTriApi.taiAnhKhuVuc,
    onError: (e) =>
      message.error(
        e instanceof LoiApi
          ? e.message
          : 'Không tải được hình ảnh.',
      ),
  });

  const luuMutation = useMutation({
    mutationFn: ({ id, duLieu }: { id?: string; duLieu: FormData }) => id ? quanTriApi.capNhatKhuVuc(id, duLieu) : quanTriApi.taoKhuVuc(duLieu),
    onSuccess: async (_data, bien) => {
      message.success(bien.id ? 'Đã cập nhật khu vực' : 'Đã tạo khu vực');
      setMoForm(false);
      await queryClient.invalidateQueries({ queryKey: ['quan-tri', 'khu-vuc'] });
    },
    onError: (e) => message.error(e instanceof LoiApi ? e.message : 'Không lưu được khu vực.'),
  });

  const xoaMutation = useMutation({
    mutationFn: quanTriApi.xoaKhuVuc,
    onSuccess: async () => {
      message.success('Đã xóa khu vực');
      await queryClient.invalidateQueries({ queryKey: ['quan-tri', 'khu-vuc'] });
    },
    onError: (e) => message.error(e instanceof LoiApi ? e.message : 'Không xóa được khu vực.'),
  });

  const moTao = () => {
    setDangSua(null);
    form.resetFields();
    form.setFieldsValue({ maKhuVuc: '', thuTu: 0, trangThai: 'HOAT_DONG' });
    setMoForm(true);
  };

  const moSua = (r: KhuVucQuanTri) => {
    setDangSua(r);
    form.setFieldsValue({
      maKhuVuc: r.maKhuVuc,
      tenKhuVuc: r.tenKhuVuc,
      moTa: r.moTa ?? undefined,
      hinhAnh: r.hinhAnh ?? undefined,
      thuTu: r.thuTu,
      trangThai: r.trangThai,
    });
    setMoForm(true);
  };

  return <>
    <TieuDeTrang
      tieuDe="Khu vực"
      moTa="Quản lý các khu vực phục vụ trước khi sắp bàn vào từng khu."
      hanhDong={coQuanLy
        ? <Button type="primary" icon={<PlusOutlined />} onClick={moTao}>Thêm khu vực</Button>
        : undefined}
    />
    <Card className="filter-card admin-filter-card mb-16">
      <Space wrap>
        <Input.Search allowClear placeholder="Mã / tên khu vực" onSearch={setTuKhoa} style={{ width: 260 }} />
        <Select
          allowClear
          placeholder="Tất cả trạng thái"
          value={trangThai}
          onChange={setTrangThai}
          style={{ width: 190 }}
          options={[
            { value: 'HOAT_DONG', label: 'Đang hoạt động' },
            { value: 'NGUNG_HOAT_DONG', label: 'Ngừng hoạt động' },
          ]}
        />
        <Button icon={<ReloadOutlined />} onClick={() => query.refetch()}>Làm mới</Button>
      </Space>
    </Card>
    <CanhBaoLoi loi={query.error} macDinh="Không tải được khu vực." />
    <Card className="admin-table-card"><Table
        rowKey="id"
        loading={query.isPending || query.isFetching}
        dataSource={query.data ?? []}
        pagination={false}
        scroll={{ x: 900 }}
        columns={[
          { title: 'Mã', dataIndex: 'maKhuVuc' },
          { title: 'Tên khu vực', dataIndex: 'tenKhuVuc' },
          { title: 'Mô tả', dataIndex: 'moTa', ellipsis: true },
          { title: 'Thứ tự', dataIndex: 'thuTu', width: 90 },
          { title: 'Trạng thái', dataIndex: 'trangThai', render: (v: string) => <TrangThai value={v} /> },
          { title: 'Thao tác', fixed: 'right', width: 150, render: (_: unknown, r: KhuVucQuanTri) => coQuanLy ? <Space>
            <Button aria-label="Sửa khu vực" size="small" icon={<EditOutlined />} onClick={() => moSua(r)} />
            <Button aria-label="Xóa khu vực" size="small" danger icon={<DeleteOutlined />} onClick={() => modal.confirm({
              title: 'Xóa khu vực khỏi danh sách?',
              content: `Chỉ thực hiện được khi khu vực “${r.tenKhuVuc}” không còn bàn đang thuộc khu vực. Dữ liệu được đánh dấu đã xóa thay vì xóa cứng khỏi cơ sở dữ liệu.`,
              okText: 'Xóa khu vực', cancelText: 'Giữ lại', okButtonProps: { danger: true },
              onOk: () => xoaMutation.mutateAsync(r.id),
            })} />
          </Space> : '—' },
        ]}
      />
    </Card>

    <Modal className="admin-form-modal"
      open={moForm}
      title={dangSua ? 'Sửa khu vực' : 'Thêm khu vực'}
      okText="Lưu"
      cancelText="Đóng"
      confirmLoading={luuMutation.isPending}
      onCancel={() => setMoForm(false)}
      onOk={() => form.submit()}
      destroyOnHidden
    >
      <Form
        size="middle"
        form={form}
        layout="vertical"
        onValuesChange={(thayDoi) => {
          if (
            !dangSua &&
            Object.prototype.hasOwnProperty.call(thayDoi, 'tenKhuVuc')
          ) {
            form.setFieldValue(
              'maKhuVuc',
              taoMaKhuVucTuTen(String(thayDoi.tenKhuVuc ?? '')),
            );
          }
        }}
        onFinish={(v) =>
          luuMutation.mutate({ id: dangSua?.id, duLieu: v })
        }
      >
                <Form.Item
          name="tenKhuVuc"
          label="Tên khu vực"
          rules={[{ required: true, message: 'Nhập tên khu vực' }]}
        >
          <Input
            maxLength={150}
            placeholder="VD: Sân vườn"
            autoFocus={!dangSua}
          />
        </Form.Item>

        <Form.Item
          name="maKhuVuc"
          label="Mã khu vực"
          extra={
            dangSua
              ? 'Mã khu vực được giữ cố định sau khi tạo để tránh thay đổi định danh vận hành.'
              : 'Mã được tạo tự động từ tên khu vực và không cần nhập thủ công.'
          }
          rules={[{ required: true, message: 'Nhập tên khu vực để hệ thống tạo mã' }]}
        >
          <Input
            maxLength={30}
            readOnly
            placeholder="Tự động tạo từ tên khu vực"
          />
        </Form.Item>
        <Form.Item name="moTa" label="Mô tả"><Input.TextArea rows={3} /></Form.Item>
        <Form.Item name="hinhAnh" hidden>
          <Input />
        </Form.Item>

        <div className="admin-area-upload-box">
          <div className="admin-area-upload-head">
            <div>
              <Typography.Text strong>Hình ảnh khu vực</Typography.Text>
              <Typography.Paragraph type="secondary">
                Chọn ảnh JPG, PNG hoặc WEBP từ máy. Tối đa 5 MB; hệ thống tự tối ưu thành WEBP.
              </Typography.Paragraph>
            </div>

            <Upload
              accept="image/jpeg,image/png,image/webp"
              maxCount={1}
              showUploadList={false}
              customRequest={async ({ file, onSuccess, onError }) => {
                const tep = file as File;

                if (!['image/jpeg', 'image/png', 'image/webp'].includes(tep.type)) {
                  const loi = new Error('Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP.');
                  message.error(loi.message);
                  onError?.(loi);
                  return;
                }

                if (tep.size > 5 * 1024 * 1024) {
                  const loi = new Error('Ảnh không được vượt quá 5 MB.');
                  message.error(loi.message);
                  onError?.(loi);
                  return;
                }

                try {
                  const kq = await taiAnhMutation.mutateAsync(tep);
                  form.setFieldValue('hinhAnh', kq.urlCongKhai);
                  message.success('Đã tải ảnh lên');
                  onSuccess?.(kq);
                } catch (e) {
                  onError?.(
                    e instanceof Error
                      ? e
                      : new Error('Không tải được ảnh.'),
                  );
                }
              }}
            >
              <Button
                icon={<UploadOutlined />}
                loading={taiAnhMutation.isPending}
              >
                {hinhAnhDangNhap ? 'Thay ảnh' : 'Chọn ảnh từ máy'}
              </Button>
            </Upload>
          </div>

          {hinhAnhDangNhap ? (
            <div className="admin-area-image-preview">
              <Image
                src={hinhAnhDangNhap}
                alt="Xem trước khu vực"
                preview
                width="100%"
                height={180}
                style={{ objectFit: 'cover', borderRadius: 12 }}
              />
              <Space>
                <Typography.Text type="secondary">
                  Ảnh sẽ được lưu cùng khu vực khi bấm “Lưu”.
                </Typography.Text>
                <Button
                  type="link"
                  danger
                  size="small"
                  onClick={() => form.setFieldValue('hinhAnh', undefined)}
                >
                  Bỏ ảnh
                </Button>
              </Space>
            </div>
          ) : (
            <div className="admin-area-upload-empty">
              <UploadOutlined />
              <span>Chưa chọn hình ảnh</span>
            </div>
          )}
        </div>

        <Space className="form-row" align="start" wrap>
          <Form.Item name="thuTu" label="Thứ tự"><InputNumber min={0} /></Form.Item>
          <Form.Item name="trangThai" label="Trạng thái"><Select style={{ width: 190 }} options={[
            { value: 'HOAT_DONG', label: 'Hoạt động' },
            { value: 'NGUNG_HOAT_DONG', label: 'Ngừng hoạt động' },
          ]} /></Form.Item>
        </Space>
      </Form>
    </Modal>
  </>;
}
