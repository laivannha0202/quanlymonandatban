import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Response, NextFunction } from 'express';
import type { RequestCoNguoiDung } from '../types/request-co-nguoi-dung.type';

@Injectable()
export class MaYeuCauMiddleware implements NestMiddleware {
  use(request: RequestCoNguoiDung, response: Response, next: NextFunction): void {
    const maYeuCau = request.header('x-request-id') || `req_${randomUUID()}`;
    request.maYeuCau = maYeuCau;
    response.setHeader('x-request-id', maYeuCau);
    next();
  }
}
