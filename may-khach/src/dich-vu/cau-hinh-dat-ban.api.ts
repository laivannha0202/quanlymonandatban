import { goiApi } from './http';

export interface CauHinhDatBanQuanTri {
  choPhepDatMonTruoc: boolean;
  yeuCauThanhToanMonTruoc: boolean;
  tienCocGiuBan: number;
  thoiGianHuyTruocPhut: number;
  tyLeHoanTienHuyDungHan: number;
}

export const cauHinhDatBanApi = {
  lay: () =>
    goiApi<CauHinhDatBanQuanTri>(
      '/quan-tri/cau-hinh-dat-ban',
      { xacThuc: true },
    ),

  capNhat: (payload: CauHinhDatBanQuanTri) =>
    goiApi<CauHinhDatBanQuanTri>(
      '/quan-tri/cau-hinh-dat-ban',
      {
        method: 'PATCH',
        xacThuc: true,
        body: JSON.stringify(payload),
      },
    ),
};
