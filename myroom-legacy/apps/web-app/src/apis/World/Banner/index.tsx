import { useQuery } from '@tanstack/react-query';
import { instance } from '@/common/utils/axios';
import { getBanner } from './fetch';
import { BannerParams } from './type';

const useBannerAPI = () => {
  /**
   * 배너 리스트
   * @param params
   * @returns
   */
  const fetchBanner = (params: BannerParams) => {
    return useQuery(
      [`fetchBanner`, params.w, params.code],
      async () => await getBanner(instance, params),
    );
  };

  return { fetchBanner };
};

export default useBannerAPI;
