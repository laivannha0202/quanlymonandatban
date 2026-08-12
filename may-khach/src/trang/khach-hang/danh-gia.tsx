import {
  CommentOutlined,
  DeleteOutlined,
  EditOutlined,
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
  Popconfirm,
  Rate,
  Space,
  Tag,
  Typography,
} from 'antd';
import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import { datBanApi } from '@/dich-vu/dat-ban.api';
import {
  heThongApi,
  type DanhGia,
} from '@/dich-vu/he-thong.api';
import { LoiApi } from '@/dich-vu/http';
import type { DatBan } from '@/kieu/nghiep-vu';
import { dinhDangNgay } from '@/cau-hinh/ngay-gio';
import { KhungTaiKhoan } from '@/thanh-phan/khung-tai-khoan';

type ReviewForm = {
  soSao: number;
  noiDung?: string;
};

export function DanhGiaCuaToi() {
  const { message } = App.useApp();
  const [ds, setDs] = useState<DatBan[]>([]);
  const [danhGias, setDanhGias] =
    useState<DanhGia[]>([]);
  const [tai, setTai] = useState(true);
  const [loi, setLoi] = useState('');
  const [dangDanhGia, setDangDanhGia] =
    useState<DatBan | null>(null);
  const [reviewDangSua, setReviewDangSua] =
    useState<DanhGia | null>(null);
  const [dangGui, setDangGui] = useState(false);
  const [form] = Form.useForm<ReviewForm>();

  const taiDuLieu = async () => {
    setTai(true);
    setLoi('');

    try {
      const [datBan, review] = await Promise.all([
        datBanApi.cuaToi(1, 100),
        heThongApi.danhGiaCuaToi(1, 100),
      ]);

      setDs(datBan.danhSach);
      setDanhGias(review.danhSach);
    } catch (e: unknown) {
      setLoi(
        e instanceof LoiApi
          ? e.message
          : 'Không tải được dữ liệu đánh giá.',
      );
    } finally {
      setTai(false);
    }
  };

  useEffect(() => {
    void taiDuLieu();
  }, []);

  const hoanThanh = useMemo(
    () =>
      ds.filter(
        (x) =>
          x.trangThai === 'DA_HOAN_THANH',
      ),
    [ds],
  );

  const reviewTheoDatBan = useMemo(
    () =>
      new Map(
        danhGias
          .filter((item) => item.datBanId)
          .map((item) => [
            item.datBanId,
            item,
          ]),
      ),
    [danhGias],
  );

  const moTaoMoi = (datBan: DatBan) => {
    form.resetFields();
    form.setFieldsValue({
      soSao: 5,
      noiDung: undefined,
    });
    setReviewDangSua(null);
    setDangDanhGia(datBan);
  };

  const moChinhSua = (
    datBan: DatBan,
    review: DanhGia,
  ) => {
    form.resetFields();
    form.setFieldsValue({
      soSao: review.soSao,
      noiDung: review.noiDung ?? undefined,
    });
    setReviewDangSua(review);
    setDangDanhGia(datBan);
  };

  const dongModal = () => {
    if (dangGui) return;
    setDangDanhGia(null);
    setReviewDangSua(null);
    form.resetFields();
  };

  return (
    <KhungTaiKhoan
      tieuDe="Đánh giá trải nghiệm"
      moTa="Chia sẻ, chỉnh sửa hoặc xóa đánh giá sau những lượt đặt bàn đã hoàn thành."
    >
      {loi && (
        <Alert
          type="error"
          showIcon
          message={loi}
          className="mb-16"
        />
      )}

      <Card
        loading={tai}
        className="account-data-card"
      >
        {!tai && hoanThanh.length === 0 ? (
          <Empty description="Chưa có lượt đặt bàn đã hoàn thành" />
        ) : (
          <List
            dataSource={hoanThanh}
            renderItem={(r) => {
              const review =
                reviewTheoDatBan.get(r.id);

              return (
                <List.Item
                  className="review-booking-item"
                  actions={
                    review
                      ? [
                          <Button
                            key="edit"
                            icon={<EditOutlined />}
                            onClick={() =>
                              moChinhSua(r, review)
                            }
                          >
                            Sửa đánh giá
                          </Button>,
                          <Popconfirm
                            key="delete"
                            title="Xóa đánh giá?"
                            description="Bạn có thể đánh giá lại lượt đặt bàn này sau khi xóa."
                            okText="Xóa"
                            cancelText="Không"
                            okButtonProps={{
                              danger: true,
                            }}
                            onConfirm={async () => {
                              try {
                                await heThongApi.xoaDanhGia(
                                  review.id,
                                );
                                message.success(
                                  'Đã xóa đánh giá',
                                );
                                await taiDuLieu();
                              } catch (e) {
                                message.error(
                                  e instanceof LoiApi
                                    ? e.message
                                    : 'Không xóa được đánh giá.',
                                );
                              }
                            }}
                          >
                            <Button
                              danger
                              icon={<DeleteOutlined />}
                            >
                              Xóa
                            </Button>
                          </Popconfirm>,
                        ]
                      : [
                          <Button
                            key="review"
                            type="primary"
                            icon={<StarFilled />}
                            onClick={() =>
                              moTaoMoi(r)
                            }
                          >
                            Đánh giá
                          </Button>,
                        ]
                  }
                >
                  <List.Item.Meta
                    avatar={
                      <span className="review-item-icon">
                        <CommentOutlined />
                      </span>
                    }
                    title={
                      <Space wrap>
                        <strong>{r.maDatBan}</strong>
                        <Tag color="green">
                          Đã hoàn thành
                        </Tag>
                        {review ? (
                          <Tag color="blue">
                            Đã đánh giá
                          </Tag>
                        ) : null}
                      </Space>
                    }
                    description={
                      <Space
                        direction="vertical"
                        size={4}
                      >
                        <span>
                          {dinhDangNgay(r.ngayDat)} ·{' '}
                          {r.soNguoi} khách
                        </span>

                        {review ? (
                          <>
                            <Rate
                              disabled
                              value={review.soSao}
                            />
                            {review.noiDung ? (
                              <Typography.Text>
                                {review.noiDung}
                              </Typography.Text>
                            ) : null}
                            {review.phanHoi ? (
                              <Alert
                                type="info"
                                showIcon
                                message="Phản hồi từ nhà hàng"
                                description={
                                  review.phanHoi
                                }
                              />
                            ) : null}
                          </>
                        ) : null}
                      </Space>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}
      </Card>

      <Modal
        open={Boolean(dangDanhGia)}
        title={
          reviewDangSua
            ? `Sửa đánh giá ${dangDanhGia?.maDatBan || ''}`
            : `Đánh giá ${dangDanhGia?.maDatBan || ''}`
        }
        okText={
          reviewDangSua
            ? 'Lưu thay đổi'
            : 'Gửi đánh giá'
        }
        cancelText="Đóng"
        confirmLoading={dangGui}
        onCancel={dongModal}
        onOk={() => form.submit()}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={async (v) => {
            if (!dangDanhGia) return;

            setDangGui(true);

            try {
              if (reviewDangSua) {
                await heThongApi.capNhatDanhGia(
                  reviewDangSua.id,
                  {
                    soSao: v.soSao,
                    noiDung:
                      v.noiDung?.trim() ||
                      undefined,
                  },
                );

                message.success(
                  'Đã cập nhật đánh giá',
                );
              } else {
                await heThongApi.taoDanhGia({
                  datBanId: dangDanhGia.id,
                  soSao: v.soSao,
                  noiDung:
                    v.noiDung?.trim() ||
                    undefined,
                });

                message.success(
                  'Cảm ơn bạn đã đánh giá',
                );
              }

              setDangDanhGia(null);
              setReviewDangSua(null);
              form.resetFields();
              await taiDuLieu();
            } catch (e) {
              message.error(
                e instanceof LoiApi
                  ? e.message
                  : reviewDangSua
                    ? 'Không cập nhật được đánh giá.'
                    : 'Không gửi được đánh giá.',
              );
            } finally {
              setDangGui(false);
            }
          }}
        >
          <Form.Item
            name="soSao"
            label="Mức độ hài lòng"
            rules={[
              {
                required: true,
                message: 'Vui lòng chọn số sao.',
              },
            ]}
          >
            <Rate className="review-rate" />
          </Form.Item>

          <Form.Item
            name="noiDung"
            label="Chia sẻ thêm"
          >
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
