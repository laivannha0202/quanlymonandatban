import {
  CommentOutlined,
  StarFilled,
} from '@ant-design/icons';
import {
  Alert,
  App,
  Button,
  Card,
  Empty,
  Form,
  Input,
  List,
  Modal,
  Rate,
  Space,
  Tag,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { datBanApi } from '@/dich-vu/dat-ban.api';
import { heThongApi } from '@/dich-vu/he-thong.api';
import { LoiApi } from '@/dich-vu/http';
import type { DatBan } from '@/kieu/nghiep-vu';
import { dinhDangNgay } from '@/cau-hinh/ngay-gio';
import { KhungTaiKhoan } from '@/thanh-phan/khung-tai-khoan';

export function DanhGiaCuaToi() {
  const { message } = App.useApp();
  const [ds, setDs] = useState<DatBan[]>([]);
  const [tai, setTai] = useState(true);
  const [loi, setLoi] = useState('');
  const [dangDanhGia, setDangDanhGia] = useState<DatBan | null>(null);
  const [dangGui, setDangGui] = useState(false);
  const [form] = Form.useForm<{ soSao: number; noiDung?: string }>();

  useEffect(() => {
    datBanApi
      .cuaToi()
      .then((x) => setDs(x.danhSach))
      .catch((e: unknown) => setLoi(e instanceof LoiApi ? e.message : 'Không tải được lịch đặt.'))
      .finally(() => setTai(false));
  }, []);

  const hoanThanh = useMemo(() => ds.filter((x) => x.trangThai === 'DA_HOAN_THANH'), [ds]);

  return (
    <KhungTaiKhoan
      tieuDe="Đánh giá trải nghiệm"
      moTa="Chia sẻ cảm nhận sau những lượt đặt bàn đã hoàn thành."
    >
      {loi && <Alert type="error" showIcon message={loi} className="mb-16" />}
      <Card loading={tai} className="account-data-card">
        {!tai && hoanThanh.length === 0 ? (
          <Empty description="Chưa có lượt đặt bàn đã hoàn thành" />
        ) : (
          <List
            dataSource={hoanThanh}
            renderItem={(r) => (
              <List.Item
                className="review-booking-item"
                actions={[
                  <Button
                    key="review"
                    type="primary"
                    icon={<StarFilled />}
                    onClick={() => {
                      form.resetFields();
                      form.setFieldValue('soSao', 5);
                      setDangDanhGia(r);
                    }}
                  >
                    Đánh giá
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={<span className="review-item-icon"><CommentOutlined /></span>}
                  title={<Space wrap><strong>{r.maDatBan}</strong><Tag color="green">Đã hoàn thành</Tag></Space>}
                  description={`${dinhDangNgay(r.ngayDat)} · ${r.soNguoi} khách`}
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      <Modal
        open={Boolean(dangDanhGia)}
        title={`Đánh giá ${dangDanhGia?.maDatBan || ''}`}
        okText="Gửi đánh giá"
        cancelText="Đóng"
        confirmLoading={dangGui}
        onCancel={() => setDangDanhGia(null)}
        onOk={() => form.submit()}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={async (v) => {
            if (!dangDanhGia) return;
            setDangGui(true);
            try {
              await heThongApi.taoDanhGia({
                datBanId: dangDanhGia.id,
                soSao: v.soSao,
                noiDung: v.noiDung,
              });
              message.success('Cảm ơn bạn đã đánh giá');
              setDangDanhGia(null);
            } catch (e) {
              message.error(e instanceof LoiApi ? e.message : 'Không gửi được đánh giá.');
            } finally {
              setDangGui(false);
            }
          }}
        >
          <Form.Item name="soSao" label="Mức độ hài lòng" rules={[{ required: true }]}>
            <Rate className="review-rate" />
          </Form.Item>
          <Form.Item name="noiDung" label="Chia sẻ thêm">
            <Input.TextArea
              rows={5}
              maxLength={5000}
              showCount
              placeholder="Món ăn, không gian, trải nghiệm phục vụ..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </KhungTaiKhoan>
  );
}
