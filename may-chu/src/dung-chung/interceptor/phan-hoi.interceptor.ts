import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { chuanHoaPhanHoi } from '../tien-ich/chuan-hoa-phan-hoi';

@Injectable()
export class PhanHoiInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((duLieu) => {
        const daChuanHoa = chuanHoaPhanHoi(duLieu);

        if (
          daChuanHoa &&
          typeof daChuanHoa === 'object' &&
          'thanhCong' in (daChuanHoa as Record<string, unknown>)
        ) {
          return daChuanHoa;
        }

        return {
          thanhCong: true,
          duLieu: daChuanHoa ?? null,
        };
      }),
    );
  }
}
