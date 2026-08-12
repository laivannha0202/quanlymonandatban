import { DeleteOutlined, EditOutlined, LinkOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { App, Button, Card, Collapse, Form, Input, InputNumber, Modal, Select, Space, Switch, Table, Tabs, Tag } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  quanTriApi,
  type BanAnPayload,
  type BanAnQuanTri,
  type LienKetBanQuanTri,
} from '@/dich-vu/quan-tri.api';
import { LoiApi } from '@/dich-vu/http';
import { useXacThuc } from '@/ngu-canh/xac-thuc.context';
import { CanhBaoLoi } from '@/thanh-phan/canh-bao-loi';
import { TieuDeTrang } from '@/thanh-phan/tieu-de-trang';
import { TrangThai } from '@/thanh-phan/trang-thai';

type FormBan = BanAnPayload;
type FormLienKet = { ban1Id: string; ban2Id: string; coTheGhep: boolean; ghiChu?: string };

function chuanHoaMa(value: string): string {
  return value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function vietTatKhuVuc(tenKhuVuc: string): string {
  const normalized = chuanHoaMa(tenKhuVuc);
  const known: Record<string, string> = {
    SAN_VUON: 'SV',
    PHONG_DIEU_HOA: 'DH',
    PHONG_LANH: 'DH',
    PHONG_RIENG: 'PR',
    PHONG_VIP: 'VIP',
    VIP: 'VIP',
  };

  if (known[normalized]) return known[normalized];

  const words = normalized.split('_').filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 6);

  return words.map((word) => word[0]).join('').slice(0, 6);
}

function taoMaBanTuThongTin(tenBan: string, tenKhuVuc: string): string {
  if (!tenBan.trim() || !tenKhuVuc.trim()) return '';

  const khuVuc = vietTatKhuVuc(tenKhuVuc);
  const normalizedName = chuanHoaMa(tenBan).replace(/^BAN_?/, '');
  const numberMatch = normalizedName.match(/(\d+)(?!.*\d)/);

  let suffix = normalizedName;
  if (numberMatch) {
    suffix = numberMatch[1].padStart(2, '0');
  } else {
    suffix = normalizedName
      .split('_')
      .filter((part) => part && !['BAN', 'PHONG', 'KHU'].includes(part))
      .join('_')
      .slice(0, 14);
  }

  return `HV_BAN_${khuVuc}_${suffix}`
    .replace(/_+/g, '_')
    .slice(0, 30)
    .replace(/_+$/g, '');
}

function laBanDangVanHanh(trangThai: string): boolean {
  return trangThai !== 'NGUNG_SU_DUNG';
}


export function QuanTriBanAn() {
  const { message, modal } = App.useApp();
  const { coQuyen } = useXacThuc();
  const coQuanLy = coQuyen('BAN_AN_QUAN_LY');
  const qc = useQueryClient();
  const [formBan] = Form.useForm<FormBan>();
  const [formLienKet] = Form.useForm<FormLienKet>();
  const [dangSua, setDangSua] = useState<BanAnQuanTri | null>(null);
  const [moFormBan, setMoFormBan] = useState(false);
  const [moFormLienKet, setMoFormLienKet] = useState(false);
  const [tuKhoa, setTuKhoa] = useState('');
  const [khuVucId, setKhuVucId] = useState<string>();
  const [trangThai, setTrangThai] = useState<string>('DANG_VAN_HANH');

  const khuVucQuery = useQuery({ queryKey: ['quan-tri', 'khu-vuc', 'cho-ban'], queryFn: () => quanTriApi.khuVuc() });
  const banQuery = useQuery({
    queryKey: ['quan-tri', 'ban-an', tuKhoa, khuVucId, trangThai],
    queryFn: () => quanTriApi.banAn({ tuKhoa, khuVucId, trangThai: trangThai === 'DANG_VAN_HANH' ? undefined : trangThai, kichThuoc: 100 }),
  });
  const lienKetQuery = useQuery({ queryKey: ['quan-tri', 'ban-an', 'lien-ket'], queryFn: quanTriApi.lienKetBan });

  const tenKhuVuc = useMemo(() => new Map((khuVucQuery.data ?? []).map((x) => [x.id, x.tenKhuVuc])), [khuVucQuery.data]);
  const tatCaBan = banQuery.data?.danhSach ?? [];
  const danhSachBanHienThi = useMemo(
    () => trangThai === 'DANG_VAN_HANH' ? tatCaBan.filter((x) => laBanDangVanHanh(x.trangThai)) : tatCaBan,
    [tatCaBan, trangThai],
  );
  const banDangVanHanh = useMemo(
    () => tatCaBan.filter((x) => laBanDangVanHanh(x.trangThai)),
    [tatCaBan],
  );
  const tenBan = useMemo(
    () => new Map(tatCaBan.map((x) => [x.id, `${x.maBan} · ${x.tenBan}`])),
    [tatCaBan],
  );
  const ban1IdDangChon = Form.useWatch('ban1Id', formLienKet);
  const ban1DangChon = useMemo(
    () => banDangVanHanh.find((x) => x.id === ban1IdDangChon),
    [banDangVanHanh, ban1IdDangChon],
  );
  const lienKetDangVanHanh = useMemo(() => {
    const activeIds = new Set(banDangVanHanh.map((x) => x.id));
    return (lienKetQuery.data ?? []).filter(
      (x) => activeIds.has(x.ban1Id) && activeIds.has(x.ban2Id),
    );
  }, [banDangVanHanh, lienKetQuery.data]);

  const lamMoi = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['quan-tri', 'ban-an'] }),
      qc.invalidateQueries({ queryKey: ['quan-tri', 'khu-vuc'] }),
    ]);
  };

  const luuBan = useMutation({
    mutationFn: ({ id, duLieu }: { id?: string; duLieu: FormBan }) => id ? quanTriApi.capNhatBanAn(id, duLieu) : quanTriApi.taoBanAn(duLieu),
    onSuccess: async (_r, bien) => { message.success(bien.id ? 'Đã cập nhật bàn' : 'Đã tạo bàn'); setMoFormBan(false); await lamMoi(); },
    onError: (e) => message.error(e instanceof LoiApi ? e.message : 'Không lưu được bàn.'),
  });
  const xoaBan = useMutation({
    mutationFn: quanTriApi.xoaBanAn,
    onSuccess: async () => { message.success('Đã xóa bàn'); await lamMoi(); },
    onError: (e) => message.error(e instanceof LoiApi ? e.message : 'Không xóa được bàn.'),
  });
  const taoLienKet = useMutation({
    mutationFn: quanTriApi.taoLienKetBan,
    onSuccess: async () => { message.success('Đã tạo liên kết bàn'); setMoFormLienKet(false); await qc.invalidateQueries({ queryKey: ['quan-tri', 'ban-an', 'lien-ket'] }); },
    onError: (e) => message.error(e instanceof LoiApi ? e.message : 'Không tạo được liên kết.'),
  });
  const capNhatLienKet = useMutation({
    mutationFn: ({ id, coTheGhep }: { id: string; coTheGhep: boolean }) => quanTriApi.capNhatLienKetBan(id, { coTheGhep }),
    onSuccess: async () => { message.success('Đã cập nhật liên kết'); await qc.invalidateQueries({ queryKey: ['quan-tri', 'ban-an', 'lien-ket'] }); },
    onError: (e) => message.error(e instanceof LoiApi ? e.message : 'Không cập nhật được liên kết.'),
  });
  const xoaLienKet = useMutation({
    mutationFn: quanTriApi.xoaLienKetBan,
    onSuccess: async () => { message.success('Đã xóa liên kết'); await qc.invalidateQueries({ queryKey: ['quan-tri', 'ban-an', 'lien-ket'] }); },
    onError: (e) => message.error(e instanceof LoiApi ? e.message : 'Không xóa được liên kết.'),
  });

  const moTaoBan = () => {
    setDangSua(null);
    formBan.resetFields();
    formBan.setFieldsValue({ maBan: '', sucChua: 2, sucChuaToiDa: 2, trangThai: 'TRONG' } as Partial<FormBan>);
    setMoFormBan(true);
  };
  const moSuaBan = (r: BanAnQuanTri) => {
    setDangSua(r);
    formBan.setFieldsValue({
      maBan: r.maBan,
      tenBan: r.tenBan,
      khuVucId: r.khuVucId,
      sucChua: r.sucChua,
      sucChuaToiDa: r.sucChuaToiDa,
      viTriX: r.viTriX ?? undefined,
      viTriY: r.viTriY ?? undefined,
      trangThai: r.trangThai,
      ghiChu: r.ghiChu ?? undefined,
    });
    setMoFormBan(true);
  };

  const tabBan = <>
    <Card className="filter-card admin-filter-card mb-16">
      <Space wrap>
        <Input.Search allowClear placeholder="Mã / tên bàn" onSearch={setTuKhoa} style={{ width: 230 }} />
        <Select allowClear placeholder="Khu vực" value={khuVucId} onChange={setKhuVucId} style={{ width: 200 }} options={(khuVucQuery.data ?? []).map((x) => ({ value: x.id, label: x.tenKhuVuc }))} />
        <Select placeholder="Trạng thái" value={trangThai} onChange={setTrangThai} style={{ width: 190 }} options={[
          { value: 'DANG_VAN_HANH', label: 'Đang vận hành' },
          { value: 'TRONG', label: 'Trống' },
          { value: 'DANG_SU_DUNG', label: 'Đang sử dụng' },
          { value: 'BAO_TRI', label: 'Bảo trì' },
          { value: 'NGUNG_SU_DUNG', label: 'Ngừng sử dụng' },
        ]} />
        <Button icon={<ReloadOutlined />} onClick={() => banQuery.refetch()}>Làm mới</Button>
      </Space>
    </Card>
    <CanhBaoLoi loi={banQuery.error ?? khuVucQuery.error} macDinh="Không tải được bàn ăn." />
    <Card className="admin-table-card"><Table
      rowKey="id"
      loading={banQuery.isPending || banQuery.isFetching}
      dataSource={danhSachBanHienThi}
      scroll={{ x: 1050 }}
      pagination={{ pageSize: 20, showSizeChanger: false }}
      columns={[
        { title: 'Mã bàn', dataIndex: 'maBan', fixed: 'left' },
        { title: 'Tên bàn', dataIndex: 'tenBan' },
        { title: 'Khu vực', dataIndex: 'khuVucId', render: (id: string) => tenKhuVuc.get(id) || id },
        { title: 'Sức chứa chuẩn', dataIndex: 'sucChua', width: 130 },
        { title: 'Sức chứa tối đa', dataIndex: 'sucChuaToiDa', width: 130 },
        { title: 'Trạng thái', dataIndex: 'trangThai', render: (v: string) => <TrangThai value={v} /> },
        { title: 'Ghi chú', dataIndex: 'ghiChu', ellipsis: true },
        { title: 'Thao tác', fixed: 'right', width: 150, render: (_: unknown, r: BanAnQuanTri) => coQuanLy ? <Space>
          <Button size="small" aria-label="Sửa bàn" icon={<EditOutlined />} onClick={() => moSuaBan(r)} />
          <Button size="small" aria-label="Xóa bàn" danger icon={<DeleteOutlined />} onClick={() => modal.confirm({
            title: 'Xóa bàn?', content: `${r.maBan} · ${r.tenBan}`, okText: 'Xóa', cancelText: 'Đóng', okButtonProps: { danger: true }, onOk: () => xoaBan.mutateAsync(r.id),
          })} />
        </Space> : '—' },
      ]}
    /></Card>
  </>;

  const tabLienKet = <>
    <CanhBaoLoi loi={lienKetQuery.error} macDinh="Không tải được liên kết bàn." />
    <Card className="admin-table-card"><Table
      rowKey="id"
      loading={lienKetQuery.isPending || lienKetQuery.isFetching}
      dataSource={lienKetDangVanHanh}
      pagination={false}
      scroll={{ x: 760 }}
      columns={[
        { title: 'Bàn 1', dataIndex: 'ban1Id', render: (id: string) => tenBan.get(id) || id },
        { title: 'Bàn 2', dataIndex: 'ban2Id', render: (id: string) => tenBan.get(id) || id },
        { title: 'Có thể ghép', dataIndex: 'coTheGhep', render: (v: boolean, r: LienKetBanQuanTri) => <Switch disabled={!coQuanLy} checked={Boolean(v)} onChange={(checked) => capNhatLienKet.mutate({ id: r.id, coTheGhep: checked })} /> },
        { title: 'Ghi chú', dataIndex: 'ghiChu', ellipsis: true },
        { title: '', width: 80, render: (_: unknown, r: LienKetBanQuanTri) => coQuanLy ? <Button danger size="small" icon={<DeleteOutlined />} onClick={() => modal.confirm({ title: 'Xóa liên kết bàn?', okText: 'Xóa', cancelText: 'Đóng', okButtonProps: { danger: true }, onOk: () => xoaLienKet.mutateAsync(r.id) })} /> : null },
      ]}
    /></Card>
  </>;

  return <>
    <TieuDeTrang
      tieuDe="Bàn ăn"
      moTa="Quản lý bàn, sức chứa và các cặp bàn được phép ghép khi tìm bàn trống."
      hanhDong={coQuanLy ? <Space wrap><Button icon={<LinkOutlined />} onClick={() => { formLienKet.resetFields(); formLienKet.setFieldsValue({ coTheGhep: true } as Partial<FormLienKet>); setMoFormLienKet(true); }}>Liên kết bàn</Button><Button type="primary" icon={<PlusOutlined />} onClick={moTaoBan}>Thêm bàn</Button></Space> : undefined}
    />
    <Tabs items={[
      { key: 'ban', label: <span>Bàn ăn <Tag>{danhSachBanHienThi.length}</Tag></span>, children: tabBan },
      { key: 'lien-ket', label: <span>Liên kết ghép bàn <Tag>{lienKetDangVanHanh.length}</Tag></span>, children: tabLienKet },
    ]} />

    <Modal className="admin-form-modal" open={moFormBan} title={dangSua ? 'Sửa bàn ăn' : 'Thêm bàn ăn'} okText="Lưu" cancelText="Đóng" confirmLoading={luuBan.isPending} onCancel={() => setMoFormBan(false)} onOk={() => formBan.submit()} destroyOnHidden>
      <Form
        size="middle"
        form={formBan}
        layout="vertical"
        onValuesChange={(thayDoi, tatCaGiaTri) => {
          if (
            !dangSua &&
            (
              Object.prototype.hasOwnProperty.call(thayDoi, 'tenBan') ||
              Object.prototype.hasOwnProperty.call(thayDoi, 'khuVucId')
            )
          ) {
            const khuVuc = (khuVucQuery.data ?? []).find((x) => x.id === tatCaGiaTri.khuVucId);
            formBan.setFieldValue(
              'maBan',
              taoMaBanTuThongTin(
                String(tatCaGiaTri.tenBan ?? ''),
                String(khuVuc?.tenKhuVuc ?? ''),
              ),
            );
          }
        }}
        onFinish={(v) => luuBan.mutate({ id: dangSua?.id, duLieu: v })}
      >
        <Form.Item
          name="tenBan"
          label="Tên bàn"
          rules={[{ required: true, message: 'Nhập tên bàn' }]}
        >
          <Input maxLength={100} placeholder="VD: Bàn Điều hòa 05" autoFocus={!dangSua} />
        </Form.Item>

        <Form.Item
          name="khuVucId"
          label="Khu vực"
          rules={[{ required: true, message: 'Chọn khu vực' }]}
        >
          <Select
            placeholder="Chọn khu vực phục vụ"
            options={(khuVucQuery.data ?? [])
              .filter((x) => x.trangThai === 'HOAT_DONG' || x.id === dangSua?.khuVucId)
              .map((x) => ({ value: x.id, label: x.tenKhuVuc }))}
          />
        </Form.Item>

        <Form.Item
          name="maBan"
          label="Mã bàn"
          extra={
            dangSua
              ? 'Mã bàn được giữ cố định sau khi tạo để tránh thay đổi định danh vận hành.'
              : 'Mã được tạo tự động từ tên bàn và khu vực, không cần nhập thủ công.'
          }
          rules={[{ required: true, message: 'Nhập tên bàn và chọn khu vực để hệ thống tạo mã' }]}
        >
          <Input maxLength={30} readOnly placeholder="Tự động tạo sau khi nhập tên và chọn khu vực" />
        </Form.Item>

        <Space className="form-row" align="start" wrap>
          <Form.Item
            name="sucChua"
            label="Sức chứa chuẩn"
            extra="Số khách phù hợp nhất với bàn."
            rules={[{ required: true, message: 'Nhập sức chứa chuẩn' }]}
          >
            <InputNumber min={1} max={100} />
          </Form.Item>

          <Form.Item
            name="sucChuaToiDa"
            label="Sức chứa tối đa"
            extra="Giới hạn cao nhất khi có thể kê thêm ghế."
            dependencies={['sucChua']}
            rules={[
              { required: true, message: 'Nhập sức chứa tối đa' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const chuan = Number(getFieldValue('sucChua') ?? 0);
                  if (value === undefined || Number(value) >= chuan) return Promise.resolve();
                  return Promise.reject(new Error('Sức chứa tối đa phải lớn hơn hoặc bằng sức chứa chuẩn'));
                },
              }),
            ]}
          >
            <InputNumber min={1} max={100} />
          </Form.Item>

          <Form.Item
            name="trangThai"
            label="Trạng thái"
            extra="Đang sử dụng được hệ thống cập nhật khi khách check-in."
          >
            <Select
              style={{ width: 190 }}
              options={[
                { value: 'TRONG', label: 'Trống' },
                { value: 'DANG_SU_DUNG', label: 'Đang sử dụng', disabled: dangSua?.trangThai !== 'DANG_SU_DUNG' },
                { value: 'BAO_TRI', label: 'Bảo trì' },
                { value: 'NGUNG_SU_DUNG', label: 'Ngừng sử dụng' },
              ]}
            />
          </Form.Item>
        </Space>

        <Collapse
          ghost
          items={[
            {
              key: 'vi-tri',
              label: 'Vị trí trên sơ đồ (nâng cao)',
              children: (
                <>
                  <div style={{ marginBottom: 12, color: 'rgba(0,0,0,.45)' }}>
                    Chỉ cần nhập khi nhà hàng sử dụng sơ đồ bàn theo tọa độ.
                  </div>
                  <Space className="form-row" align="start" wrap>
                    <Form.Item name="viTriX" label="Tọa độ X"><InputNumber /></Form.Item>
                    <Form.Item name="viTriY" label="Tọa độ Y"><InputNumber /></Form.Item>
                  </Space>
                </>
              ),
            },
          ]}
        />

        <Form.Item name="ghiChu" label="Ghi chú">
          <Input.TextArea rows={3} maxLength={500} placeholder="VD: Gần cửa sổ, phù hợp gia đình..." />
        </Form.Item>
      </Form>
    </Modal>

    <Modal className="admin-form-modal" open={moFormLienKet} title="Liên kết hai bàn" okText="Tạo liên kết" cancelText="Đóng" confirmLoading={taoLienKet.isPending} onCancel={() => setMoFormLienKet(false)} onOk={() => formLienKet.submit()} destroyOnHidden>
      <Form size="middle" form={formLienKet} layout="vertical" onFinish={(v) => taoLienKet.mutate(v)}>
        <Form.Item
          name="ban1Id"
          label="Bàn thứ nhất"
          rules={[{ required: true, message: 'Chọn bàn thứ nhất' }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            placeholder="Chọn bàn đang vận hành"
            onChange={() => formLienKet.setFieldValue('ban2Id', undefined)}
            options={banDangVanHanh.map((x) => ({
              value: x.id,
              label: `${x.maBan} · ${x.tenBan} · ${tenKhuVuc.get(x.khuVucId) || x.khuVucId}`,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="ban2Id"
          label="Bàn thứ hai"
          extra={ban1DangChon ? 'Chỉ hiển thị các bàn cùng khu vực để tránh cấu hình ghép bàn không thực tế.' : 'Chọn bàn thứ nhất trước.'}
          rules={[{ required: true, message: 'Chọn bàn thứ hai' }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            disabled={!ban1DangChon}
            placeholder={ban1DangChon ? 'Chọn bàn cùng khu vực' : 'Chọn bàn thứ nhất trước'}
            options={banDangVanHanh
              .filter((x) => x.id !== ban1DangChon?.id && x.khuVucId === ban1DangChon?.khuVucId)
              .map((x) => ({
                value: x.id,
                label: `${x.maBan} · ${x.tenBan} · ${tenKhuVuc.get(x.khuVucId) || x.khuVucId}`,
              }))}
          />
        </Form.Item>

        <Form.Item name="coTheGhep" label="Cho phép ghép" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item name="ghiChu" label="Ghi chú">
          <Input.TextArea rows={3} maxLength={500} placeholder="VD: Hai bàn liền kề" />
        </Form.Item>
      </Form>
    </Modal>
  </>;
}
