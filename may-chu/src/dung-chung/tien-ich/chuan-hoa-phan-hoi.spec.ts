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

  it('không biến số điện thoại hoặc ID chuỗi thành number', () => {
    expect(chuanHoaPhanHoi({ tai_khoan_id: 99n, so_dien_thoai: '0900123456' })).toEqual({
      taiKhoanId: '99',
      soDienThoai: '0900123456',
    });
  });
});
