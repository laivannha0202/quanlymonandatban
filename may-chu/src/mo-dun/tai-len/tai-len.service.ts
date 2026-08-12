import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

export interface KetQuaTaiAnh {
  duongDan: string;
  tenTep: string;
  mimeType: 'image/webp';
  kichThuocByte: number;
  chieuRong: number;
  chieuCao: number;
}

@Injectable()
export class TaiLenService {
  private readonly dinhDangChoPhep = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
  ]);

  constructor(private readonly config: ConfigService) {}

  async luuAnh(
    file: Express.Multer.File | undefined,
    thuMucCon: 'khu-vuc' | 'mon-an',
  ): Promise<KetQuaTaiAnh> {
    if (!file) {
      throw new BadRequestException({
        maLoi: 'TAI_LEN_001',
        thongBao: 'Chưa chọn tệp hình ảnh.',
      });
    }

    if (!this.dinhDangChoPhep.has(file.mimetype)) {
      throw new BadRequestException({
        maLoi: 'TAI_LEN_002',
        thongBao: 'Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP.',
      });
    }

    if (!file.buffer?.length) {
      throw new BadRequestException({
        maLoi: 'TAI_LEN_003',
        thongBao: 'Tệp hình ảnh rỗng hoặc không đọc được.',
      });
    }

    const thuMucGoc = resolve(
      this.config.get<string>('UPLOAD_DIR', 'uploads'),
    );
    const thuMucLuu = resolve(thuMucGoc, thuMucCon);
    await mkdir(thuMucLuu, { recursive: true });

    const tenTep = `${randomUUID()}.webp`;
    const duongDanTuyetDoi = resolve(thuMucLuu, tenTep);

    try {
      const anh = sharp(file.buffer, {
        failOn: 'error',
        limitInputPixels: 40_000_000,
      }).rotate();

      const metadata = await anh.metadata();
      if (!metadata.width || !metadata.height) {
        throw new Error('Khong doc duoc kich thuoc anh');
      }

      const thongTin = await anh
        .resize({
          width: 1800,
          height: 1400,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 84, effort: 4 })
        .toFile(duongDanTuyetDoi);

      return {
        duongDan: `/uploads/${thuMucCon}/${tenTep}`,
        tenTep,
        mimeType: 'image/webp',
        kichThuocByte: thongTin.size,
        chieuRong: thongTin.width,
        chieuCao: thongTin.height,
      };
    } catch {
      await unlink(duongDanTuyetDoi).catch(() => undefined);
      throw new BadRequestException({
        maLoi: 'TAI_LEN_004',
        thongBao: 'Tệp không phải hình ảnh hợp lệ hoặc ảnh quá lớn.',
      });
    }
  }
}
