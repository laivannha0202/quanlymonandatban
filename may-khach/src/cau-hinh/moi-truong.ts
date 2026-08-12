const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1').replace(/\/$/, '');

export const moiTruong = {
  apiBaseUrl,
  tenNhaHang: import.meta.env.VITE_TEN_NHA_HANG || 'Nhà hàng Hương Việt',
};
