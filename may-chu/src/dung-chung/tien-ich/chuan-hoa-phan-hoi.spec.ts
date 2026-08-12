import { chuanHoaPhanHoi } from './chuan-hoa-phan-hoi';

describe('chuanHoaPhanHoi', () => {
  it('đổi snake_case sang camelCase nhưng giữ ID bigint thành string', () => {
    expect(chuanHoaPhanHoi({ id: 123n, ma_dat_ban: 'DB001' })).toEqual({ id: '123', maDatBan: 'DB001' });
  });

  it('đổi các trường số nghiệp vụ về number', () => {
    expect(chuanHoaPhanHoi({ so_nguoi: 4n, suc_chua: '2', suc_chua_toi_da: 6n })).toEqual({
      soNguoi: 4,
      sucChua: 2,
      sucChuaToiDa: 6,
    });
  });

  it('đổi các cờ 0/1 về boolean', () => {
    expect(chuanHoaPhanHoi({ la_mon_noi_bat: 1, con_mon: 0n, hien_thi: '1' })).toEqual({
      laMonNoiBat: true,
      conMon: false,
      hienThi: true,
    });
  });

  it('chuẩn hóa sâu phương án bàn thành contract camelCase cho frontend', () => {
    expect(
      chuanHoaPhanHoi({
        phuong_an: [
          {
            kieu: 'BAN_DON',
            ban_ans: [
              {
                id: 5n,
                ma_ban: 'B05',
                ten_ban: 'Bàn 05',
                khu_vuc_id: 2n,
                ten_khu_vuc: 'Trong nhà',
                suc_chua: 2,
                suc_chua_toi_da: 4,
                trang_thai: 'TRONG',
              },
            ],
            tong_suc_chua: 2,
            tong_suc_chua_toi_da: 4,
          },
        ],
      }),
    ).toEqual({
      phuongAn: [
        {
          kieu: 'BAN_DON',
          banAns: [
            {
              id: '5',
              maBan: 'B05',
              tenBan: 'Bàn 05',
              khuVucId: '2',
              tenKhuVuc: 'Trong nhà',
              sucChua: 2,
              sucChuaToiDa: 4,
              trangThai: 'TRONG',
            },
          ],
          tongSucChua: 2,
          tongSucChuaToiDa: 4,
        },
      ],
    });
  });

  it('không biến số điện thoại hoặc ID chuỗi thành number', () => {
    expect(chuanHoaPhanHoi({ tai_khoan_id: 99n, so_dien_thoai: '0900123456' })).toEqual({
      taiKhoanId: '99',
      soDienThoai: '0900123456',
    });
  });
});
