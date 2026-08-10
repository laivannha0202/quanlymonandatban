export function kiemTraBienMoiTruong(config: Record<string, unknown>): Record<string, unknown> {
  const batBuoc = [
    'DATABASE_URL',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'FRONTEND_URL',
  ];

  const thieu = batBuoc.filter((khoa) => !String(config[khoa] ?? '').trim());
  if (thieu.length) {
    throw new Error(`Thiếu biến môi trường bắt buộc: ${thieu.join(', ')}`);
  }

  const port = Number(config.PORT ?? 8080);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT phải là số nguyên từ 1 đến 65535.');
  }

  const access = Number(config.JWT_ACCESS_EXPIRES_SECONDS ?? 900);
  const refresh = Number(config.JWT_REFRESH_EXPIRES_SECONDS ?? 2_592_000);
  if (!Number.isFinite(access) || access < 60) {
    throw new Error('JWT_ACCESS_EXPIRES_SECONDS phải >= 60 giây.');
  }
  if (!Number.isFinite(refresh) || refresh <= access) {
    throw new Error('JWT_REFRESH_EXPIRES_SECONDS phải lớn hơn thời hạn access token.');
  }

  const nodeEnv = String(config.NODE_ENV ?? 'development');
  if (nodeEnv === 'production') {
    const cam = ['changeme', 'secret', 'admin@nhahang.local', 'Admin@123456'];
    const giaTriCanKiemTra = [
      String(config.JWT_ACCESS_SECRET ?? ''),
      String(config.JWT_REFRESH_SECRET ?? ''),
      String(config.SEED_ADMIN_PASSWORD ?? ''),
    ];
    if (giaTriCanKiemTra.some((giaTri) => cam.includes(giaTri))) {
      throw new Error('Production đang dùng secret/password mặc định không an toàn.');
    }
  }

  return config;
}
