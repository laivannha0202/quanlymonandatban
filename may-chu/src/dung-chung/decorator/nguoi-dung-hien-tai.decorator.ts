import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { RequestCoNguoiDung } from '../types/request-co-nguoi-dung.type';

export const NguoiDungHienTai = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<RequestCoNguoiDung>();
    return request.nguoiDung;
  },
);
