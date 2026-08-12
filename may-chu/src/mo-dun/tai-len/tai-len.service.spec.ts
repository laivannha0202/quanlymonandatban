import { ConfigService } from '@nestjs/config';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { TaiLenService } from './tai-len.service';

describe('TaiLenService', () => {
  let thuMucTam: string;
  let service: TaiLenService;

  beforeEach(async () => {
    thuMucTam = await mkdtemp(join(tmpdir(), 'tai-len-test-'));
    const config = {
      get: (key: string, fallback?: string) =>
        key === 'UPLOAD_DIR' ? thuMucTam : fallback,
    } as ConfigService;

    service = new TaiLenService(config);
  });

  afterEach(async () => {
    await rm(thuMucTam, { recursive: true, force: true });
  });

  it('toi uu anh hop le thanh WEBP', async () => {
    const buffer = await sharp({
      create: {
        width: 40,
        height: 30,
        channels: 3,
        background: '#ffffff',
      },
    })
      .png()
      .toBuffer();

    const file = {
      buffer,
      mimetype: 'image/png',
      originalname: 'khu-vuc.png',
      size: buffer.length,
    } as Express.Multer.File;

    const kq = await service.luuAnh(file, 'khu-vuc');

    expect(kq.duongDan).toMatch(
      /^\/uploads\/khu-vuc\/[0-9a-f-]+\.webp$/,
    );
    expect(kq.mimeType).toBe('image/webp');
    expect(kq.kichThuocByte).toBeGreaterThan(0);
  });

  it('tu choi tep khong phai anh', async () => {
    const file = {
      buffer: Buffer.from('khong-phai-anh'),
      mimetype: 'text/plain',
      originalname: 'tep.txt',
      size: 14,
    } as Express.Multer.File;

    await expect(
      service.luuAnh(file, 'khu-vuc'),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        maLoi: 'TAI_LEN_002',
      }),
    });
  });
});
