import {
  Alert,
  App,
  Button,
  Card,
  Checkbox,
  Collapse,
  Empty,
  Space,
  Spin,
  Typography,
} from 'antd';
import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  heThongApi,
  type Quyen,
  type VaiTro,
} from '@/dich-vu/he-thong.api';
import { LoiApi } from '@/dich-vu/http';
import { useXacThuc } from '@/ngu-canh/xac-thuc.context';

export function QuanTriVaiTro() {
  const { message } = App.useApp();
  const { nguoiDung } = useXacThuc();

  const [vaiTro, setVaiTro] = useState<VaiTro[]>([]);
  const [quyen, setQuyen] = useState<Quyen[]>([]);
  const [dangChon, setDangChon] =
    useState<VaiTro | null>(null);
  const [maQuyens, setMaQuyens] =
    useState<string[]>([]);
  const [tai, setTai] = useState(true);
  const [luu, setLuu] = useState(false);
  const [loi, setLoi] = useState('');

  const vaiTroBiBaoVe = (item: VaiTro) =>
    item.maVaiTro === 'QUAN_TRI_VIEN' ||
    item.maVaiTro === 'KHACH_HANG' ||
    item.id === nguoiDung?.vaiTro.id;

  const lyDoBaoVe = (item: VaiTro) => {
    if (item.maVaiTro === 'QUAN_TRI_VIEN') {
      return 'Vai trò QUAN_TRI_VIEN được backend bảo vệ để tránh mất quyền quản trị hệ thống.';
    }

    if (item.maVaiTro === 'KHACH_HANG') {
      return 'Vai trò KHACH_HANG được cố định và không được gán quyền quản trị.';
    }

    if (item.id === nguoiDung?.vaiTro.id) {
      return 'Không thể tự thay đổi quyền của chính vai trò đang sử dụng.';
    }

    return '';
  };

  useEffect(() => {
    Promise.all([
      heThongApi.vaiTro(),
      heThongApi.quyen(),
    ])
      .then(([dsVaiTro, dsQuyen]) => {
        setVaiTro(dsVaiTro);
        setQuyen(dsQuyen);

        const macDinh =
          dsVaiTro.find(
            (item) =>
              item.maVaiTro === 'NHAN_VIEN' &&
              item.id !== nguoiDung?.vaiTro.id,
          ) ??
          dsVaiTro.find(
            (item) =>
              item.maVaiTro !== 'QUAN_TRI_VIEN' &&
              item.maVaiTro !== 'KHACH_HANG' &&
              item.id !== nguoiDung?.vaiTro.id,
          ) ??
          dsVaiTro[0];

        if (macDinh) {
          setDangChon(macDinh);
          setMaQuyens(
            macDinh.quyen.map(
              (item) => item.maQuyen,
            ),
          );
        }
      })
      .catch((error: unknown) =>
        setLoi(
          error instanceof LoiApi
            ? error.message
            : 'Không tải được phân quyền.',
        ),
      )
      .finally(() => setTai(false));
  }, [nguoiDung?.vaiTro.id]);

  const nhom = useMemo(
    () =>
      quyen.reduce<Record<string, Quyen[]>>(
        (acc, item) => {
          const key =
            item.nhomQuyen || 'KHAC';
          (acc[key] ||= []).push(item);
          return acc;
        },
        {},
      ),
    [quyen],
  );

  const chonVaiTro = (item: VaiTro) => {
    setDangChon(item);
    setMaQuyens(
      item.quyen.map(
        (quyenItem) => quyenItem.maQuyen,
      ),
    );
  };

  if (tai) {
    return <Spin />;
  }

  const dangBiBaoVe =
    dangChon != null &&
    vaiTroBiBaoVe(dangChon);

  return (
    <>
      <Typography.Title level={2}>
        Vai trò & phân quyền
      </Typography.Title>

      {loi && (
        <Alert
          type="error"
          showIcon
          message={loi}
          className="mb-16"
        />
      )}

      <Space
        align="start"
        size="large"
        className="rbac-layout"
        wrap
      >
        <Card
          className="admin-section-card rbac-role-list"
          title="Vai trò"
        >
          {vaiTro.length === 0 ? (
            <Empty />
          ) : (
            <Space
              direction="vertical"
              style={{ width: '100%' }}
            >
              {vaiTro.map((item) => (
                <Button
                  key={item.id}
                  type={
                    dangChon?.id === item.id
                      ? 'primary'
                      : 'default'
                  }
                  block
                  onClick={() =>
                    chonVaiTro(item)
                  }
                >
                  {item.tenVaiTro}
                </Button>
              ))}
            </Space>
          )}
        </Card>

        <Card
          title={
            dangChon
              ? `Quyền của ${dangChon.tenVaiTro}`
              : 'Quyền'
          }
          className="rbac-permissions"
        >
          {dangChon && dangBiBaoVe && (
            <Alert
              type="info"
              showIcon
              message={lyDoBaoVe(dangChon)}
              className="mb-16"
            />
          )}

          <Checkbox.Group
            value={maQuyens}
            onChange={(values) =>
              setMaQuyens(
                values.map(String),
              )
            }
            disabled={dangBiBaoVe}
            style={{ width: '100%' }}
          >
            <Collapse
              items={Object.entries(nhom).map(
                ([tenNhom, ds]) => ({
                  key: tenNhom,
                  label: `${tenNhom} (${ds.length})`,
                  children: (
                    <div className="permission-grid">
                      {ds.map((item) => (
                        <Checkbox
                          key={item.id}
                          value={item.maQuyen}
                        >
                          <span>
                            <strong>
                              {item.maQuyen}
                            </strong>
                            {item.tenQuyen ? (
                              <small>
                                {item.tenQuyen}
                              </small>
                            ) : null}
                          </span>
                        </Checkbox>
                      ))}
                    </div>
                  ),
                }),
              )}
            />
          </Checkbox.Group>

          <div className="mt-16">
            <Button
              type="primary"
              loading={luu}
              disabled={
                !dangChon ||
                dangBiBaoVe
              }
              onClick={async () => {
                if (!dangChon) return;

                setLuu(true);

                try {
                  const moi =
                    await heThongApi.capNhatQuyenVaiTro(
                      dangChon.id,
                      maQuyens,
                    );

                  message.success(
                    'Đã cập nhật quyền',
                  );

                  setVaiTro((cu) =>
                    cu.map((item) =>
                      item.id === moi.id
                        ? moi
                        : item,
                    ),
                  );

                  setDangChon(moi);
                } catch (error) {
                  message.error(
                    error instanceof LoiApi
                      ? error.message
                      : 'Không cập nhật được quyền.',
                  );
                } finally {
                  setLuu(false);
                }
              }}
            >
              Lưu phân quyền
            </Button>
          </div>
        </Card>
      </Space>
    </>
  );
}
