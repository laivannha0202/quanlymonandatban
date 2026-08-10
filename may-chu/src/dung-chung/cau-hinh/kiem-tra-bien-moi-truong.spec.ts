import { kiemTraBienMoiTruong } from './kiem-tra-bien-moi-truong';

const hopLe = {
  DATABASE_URL: 'mysql://u:p@127.0.0.1:3306/db',
  JWT_ACCESS_SECRET: 'access-random',
  JWT_REFRESH_SECRET: 'refresh-random',
  FRONTEND_URL: 'http://localhost:5173',
  PORT: '8080',
  JWT_ACCESS_EXPIRES_SECONDS: '900',
  JWT_REFRESH_EXPIRES_SECONDS: '2592000',
};

describe('kiemTraBienMoiTruong', () => {
  it('chấp nhận cấu hình hợp lệ', () => {
    expect(kiemTraBienMoiTruong({ ...hopLe })).toEqual(hopLe);
  });

  it('từ chối khi thiếu biến bắt buộc', () => {
    expect(() => kiemTraBienMoiTruong({ ...hopLe, DATABASE_URL: '' })).toThrow('DATABASE_URL');
  });

  it('từ chối port không hợp lệ', () => {
    expect(() => kiemTraBienMoiTruong({ ...hopLe, PORT: '99999' })).toThrow('PORT');
  });
});
