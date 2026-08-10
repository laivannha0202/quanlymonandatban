import { HttpException, HttpStatus } from '@nestjs/common';

export class LoiNghiepVuException extends HttpException {
  constructor(
    public readonly maLoi: string,
    thongBao: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly chiTiet: unknown = null,
  ) {
    super({ maLoi, thongBao, chiTiet }, status);
  }
}
