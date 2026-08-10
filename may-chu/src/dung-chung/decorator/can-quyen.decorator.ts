import { SetMetadata } from '@nestjs/common';

export const KHOA_QUYEN = 'quyen_can_co';
export const CanQuyen = (...quyen: string[]) => SetMetadata(KHOA_QUYEN, quyen);
