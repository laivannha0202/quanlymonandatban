import { ReloadOutlined } from '@ant-design/icons';
import { App, Button, Card, Input, Select, Space, Table } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { quanTriApi } from '@/dich-vu/quan-tri.api';
import { LoiApi } from '@/dich-vu/http';
import type { DatBan } from '@/kieu/nghiep-vu';
import { useXacThuc } from '@/ngu-canh/xac-thuc.context';
import { dinhDangNgay, dinhDangNgayGio } from '@/cau-hinh/ngay-gio';
import { CanhBaoLoi } from '@/thanh-phan/canh-bao-loi';
import { TieuDeTrang } from '@/thanh-phan/tieu-de-trang';
import { TrangThai } from '@/thanh-phan/trang-thai';

type HanhDong = 'xac-nhan' | 'check-in' | 'hoan-thanh' | 'khong-den' | 'huy';

export function QuanTriDatBan() {
  const { message, modal } = App.useApp();
  const { coQuyen } = useXacThuc();
  const qc = useQueryClient();
  const [trangThai, setTrangThai] = useState<string>();
  const [tuKhoa, setTuKhoa] = useState('');

  const query = useQuery({
    queryKey: ['quan-tri', 'dat-ban', trangThai, tuKhoa],
    queryFn: () => quanTriApi.datBan({ trangThai, tuKhoa }),
  });
  const mutation = useMutation({
    mutationFn: ({ id, hanhDong }: { id: string; hanhDong: HanhDong }) => quanTriApi.chuyenTrangThaiDatBan(id, hanhDong),
    onSuccess: async () => {
      message.success('Đã cập nhật đặt bàn');
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['quan-tri', 'dat-ban'] }),
        qc.invalidateQueries({ queryKey: ['quan-tri', 'dashboard'] }),
        qc.invalidateQueries({ queryKey: ['quan-tri', 'ban-an'] }),
      ]);
    },
    onError: (e) => message.error(e instanceof LoiApi ? e.message : 'Cập nhật đặt bàn thất bại.'),
  });

  const hanhDong = (r: DatBan, hd: HanhDong) => {
    const lam = () => mutation.mutateAsync({ id: r.id, hanhDong: hd });
    if (hd === 'huy' || hd === 'khong-den') {
      modal.confirm({
        title: hd === 'huy' ? 'Hủy đặt bàn?' : 'Đánh dấu khách không đến?',
        content: `${r.maDatBan} · ${r.hoTen}`,
        okText: hd === 'huy' ? 'Hủy đặt bàn' : 'Xác nhận',
        cancelText: 'Đóng',
        okButtonProps: hd === 'huy' ? { danger: true } : undefined,
        onOk: lam,
      });
      return;
    }
    void lam();
  };

  return <>
    <TieuDeTrang tieuDe="Quản lý đặt bàn" moTa="Xác nhận, check-in, hoàn thành và xử lý ngoại lệ theo đúng state machine Backend." />
    <Card className="filter-card mb-16"><Space wrap>
      <Input.Search allowClear placeholder="Mã / tên / số điện thoại" onSearch={setTuKhoa} style={{ width: 290 }} />
      <Select allowClear placeholder="Trạng thái" style={{ width: 190 }} value={trangThai} onChange={setTrangThai} options={[
        { value: 'CHO_XAC_NHAN', label: 'Chờ xác nhận' }, { value: 'DA_XAC_NHAN', label: 'Đã xác nhận' }, { value: 'DA_CHECK_IN', label: 'Đã check-in' },
        { value: 'DA_HOAN_THANH', label: 'Hoàn thành' }, { value: 'DA_HUY', label: 'Đã hủy' }, { value: 'KHONG_DEN', label: 'Không đến' },
      ]} />
      <Button icon={<ReloadOutlined />} onClick={() => query.refetch()}>Làm mới</Button>
    </Space></Card>
    <CanhBaoLoi loi={query.error} macDinh="Không tải được đặt bàn." />
    <Card><Table
      rowKey="id"
      loading={query.isPending || query.isFetching}
      dataSource={query.data?.danhSach ?? []}
      scroll={{ x: 1150 }}
      pagination={{ pageSize: 20, showSizeChanger: false }}
      columns={[
        { title: 'Mã', dataIndex: 'maDatBan', fixed: 'left', width: 160 },
        { title: 'Khách', dataIndex: 'hoTen', width: 160 },
        { title: 'SĐT', dataIndex: 'soDienThoai', width: 130 },
        { title: 'Ngày', dataIndex: 'ngayDat', width: 120, render: (v: string) => dinhDangNgay(v) },
        { title: 'Giờ', dataIndex: 'gioBatDau', width: 155, render: (v: string) => dinhDangNgayGio(v) },
        { title: 'Người', dataIndex: 'soNguoi', width: 80 },
        { title: 'Trạng thái', dataIndex: 'trangThai', width: 135, render: (v: string) => <TrangThai value={v} /> },
        { title: 'Thao tác', fixed: 'right', width: 280, render: (_: unknown, r: DatBan) => <Space wrap>
          {r.trangThai === 'CHO_XAC_NHAN' && coQuyen('DAT_BAN_XAC_NHAN') && <Button size="small" type="primary" onClick={() => hanhDong(r, 'xac-nhan')}>Xác nhận</Button>}
          {r.trangThai === 'DA_XAC_NHAN' && coQuyen('DAT_BAN_CHECK_IN') && <Button size="small" onClick={() => hanhDong(r, 'check-in')}>Check-in</Button>}
          {r.trangThai === 'DA_CHECK_IN' && coQuyen('DAT_BAN_HOAN_THANH') && <Button size="small" type="primary" onClick={() => hanhDong(r, 'hoan-thanh')}>Hoàn thành</Button>}
          {r.trangThai === 'DA_XAC_NHAN' && coQuyen('DAT_BAN_KHONG_DEN') && <Button size="small" onClick={() => hanhDong(r, 'khong-den')}>Không đến</Button>}
          {['CHO_XAC_NHAN', 'DA_XAC_NHAN'].includes(r.trangThai) && coQuyen('DAT_BAN_HUY') && <Button size="small" danger onClick={() => hanhDong(r, 'huy')}>Hủy</Button>}
        </Space> },
      ]}
    /></Card>
  </>;
}
