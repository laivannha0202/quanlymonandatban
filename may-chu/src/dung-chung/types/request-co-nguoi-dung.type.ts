import type { Request } from 'express';
import type { NguoiDungXacThuc } from './nguoi-dung-xac-thuc.type';

export interface RequestCoNguoiDung extends Request {
  nguoiDung?: NguoiDungXacThuc;
  maYeuCau?: string;
}
