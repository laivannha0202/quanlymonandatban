import { SetMetadata } from '@nestjs/common';

export const KHOA_CHO_PHEP_KHI_BAT_BUOC_DOI_MAT_KHAU =
  'cho_phep_khi_bat_buoc_doi_mat_khau';

export const ChoPhepKhiBatBuocDoiMatKhau = () =>
  SetMetadata(KHOA_CHO_PHEP_KHI_BAT_BUOC_DOI_MAT_KHAU, true);
