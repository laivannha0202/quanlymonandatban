export const hinhAnhMau = {
  hero: '/hinh-anh/hero-nha-hang.jpg',
  khongGian: [
    '/hinh-anh/khong-gian-1.jpg',
    '/hinh-anh/khong-gian-2.jpg',
    '/hinh-anh/khong-gian-3.jpg',
  ],
  monAn: [
    '/hinh-anh/mon-an-1.jpg',
    '/hinh-anh/mon-an-2.jpg',
    '/hinh-anh/mon-an-3.jpg',
    '/hinh-anh/mon-an-4.jpg',
    '/hinh-anh/mon-an-5.jpg',
    '/hinh-anh/mon-an-6.jpg',
  ],
} as const;

export function layAnhMonMacDinh(viTri = 0): string {
  return hinhAnhMau.monAn[Math.abs(viTri) % hinhAnhMau.monAn.length];
}
