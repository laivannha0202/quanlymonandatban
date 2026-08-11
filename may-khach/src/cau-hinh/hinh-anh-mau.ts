export const hinhAnhMau = {
  hero: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=86',
  khongGian: [
    'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=82',
  ],
  monAn: [
    'https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=1000&q=82',
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1000&q=82',
    'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1000&q=82',
    'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1000&q=82',
    'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=1000&q=82',
    'https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=1000&q=82',
  ],
} as const;

export function layAnhMonMacDinh(viTri = 0): string {
  return hinhAnhMau.monAn[Math.abs(viTri) % hinhAnhMau.monAn.length];
}
