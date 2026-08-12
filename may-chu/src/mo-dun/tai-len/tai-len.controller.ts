import {
  Controller,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { CanQuyen } from '../../dung-chung/decorator/can-quyen.decorator';
import { JwtGuard } from '../../dung-chung/guard/jwt.guard';
import { QuyenGuard } from '../../dung-chung/guard/quyen.guard';
import { TaiLenService } from './tai-len.service';

@ApiTags('Quản trị - Tải lên')
@ApiBearerAuth()
@UseGuards(JwtGuard, QuyenGuard)
@Controller('quan-tri/tai-len')
export class TaiLenController {
  constructor(
    private readonly service: TaiLenService,
    private readonly config: ConfigService,
  ) {}

  @Post('khu-vuc')
  @CanQuyen('KHU_VUC_QUAN_LY')
  @ApiOperation({ summary: 'Tải ảnh khu vực từ máy người dùng' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1,
      },
    }),
  )
  async taiAnhKhuVuc(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() request: Request,
  ) {
    const ketQua = await this.service.luuAnh(file, 'khu-vuc');

    const cauHinhBase = this.config
      .get<string>('PUBLIC_BACKEND_URL')
      ?.trim()
      .replace(/\/+$/, '');

    const baseUrl =
      cauHinhBase ||
      `${request.protocol}://${request.get('host')}`;

    return {
      ...ketQua,
      urlCongKhai: `${baseUrl}${ketQua.duongDan}`,
    };
  }

  @Post('mon-an')
  @CanQuyen('MON_AN_QUAN_LY')
  @ApiOperation({ summary: 'Tải ảnh món ăn từ máy người dùng' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1,
      },
    }),
  )
  async taiAnhMonAn(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() request: Request,
  ) {
    const ketQua = await this.service.luuAnh(file, 'mon-an');

    const cauHinhBase = this.config
      .get<string>('PUBLIC_BACKEND_URL')
      ?.trim()
      .replace(/\/+$/, '');

    const baseUrl =
      cauHinhBase ||
      `${request.protocol}://${request.get('host')}`;

    return {
      ...ketQua,
      urlCongKhai: `${baseUrl}${ketQua.duongDan}`,
    };
  }

}
