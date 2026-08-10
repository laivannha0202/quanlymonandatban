import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import type { RequestCoNguoiDung } from '../types/request-co-nguoi-dung.type';

type LoiPrismaGiong = { code?: unknown; meta?: unknown; message?: unknown };

@Catch()
export class BoLocLoiToanCuc implements ExceptionFilter {
  private readonly logger = new Logger(BoLocLoiToanCuc.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<RequestCoNguoiDung>();
    const response = http.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let maLoi = 'HE_THONG_500';
    let thongBao = 'Đã xảy ra lỗi hệ thống.';
    let chiTiet: unknown = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const noiDung = exception.getResponse();

      if (typeof noiDung === 'string') {
        thongBao = noiDung;
      } else if (noiDung && typeof noiDung === 'object') {
        const duLieu = noiDung as Record<string, unknown>;
        maLoi = String(duLieu.maLoi ?? `HTTP_${status}`);
        thongBao = Array.isArray(duLieu.message)
          ? duLieu.message.join(', ')
          : String(duLieu.thongBao ?? duLieu.message ?? thongBao);
        chiTiet = duLieu.chiTiet ?? null;
      }
    } else {
      const prisma = exception as LoiPrismaGiong;
      const code = typeof prisma?.code === 'string' ? prisma.code : null;

      if (code === 'P2002') {
        status = HttpStatus.CONFLICT;
        maLoi = 'DU_LIEU_001';
        thongBao = 'Dữ liệu bị trùng với bản ghi đã tồn tại.';
      } else if (code === 'P2003') {
        status = HttpStatus.CONFLICT;
        maLoi = 'DU_LIEU_002';
        thongBao = 'Không thể thực hiện vì dữ liệu đang được tham chiếu.';
      } else if (code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        maLoi = 'DU_LIEU_003';
        thongBao = 'Bản ghi không tồn tại hoặc đã bị thay đổi.';
      } else if (code === 'P2034') {
        status = HttpStatus.CONFLICT;
        maLoi = 'GIAO_DICH_001';
        thongBao = 'Giao dịch xung đột với thao tác đồng thời. Vui lòng thử lại.';
      }

      const noiDungLoi = exception instanceof Error
        ? exception.stack ?? exception.message
        : String(exception);
      this.logger.error(
        `[${request.method}] ${request.originalUrl} | ${request.maYeuCau ?? 'khong-co-request-id'}\n${noiDungLoi}`,
      );
    }

    response.status(status).json({
      thanhCong: false,
      maLoi,
      thongBao,
      chiTiet,
      maYeuCau: request.maYeuCau ?? null,
    });
  }
}
