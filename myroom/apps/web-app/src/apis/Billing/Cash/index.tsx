import { useQuery } from '@tanstack/react-query';
import { instance } from '@/common/utils/axios';
import { getCash } from './fetch';

const useBillingAPI = () => {
  /**
   * 상태메시지 정보
   * @param id
   * @returns
   */
  const fetchCash = () => {
    return useQuery([`fetchCash`], async () => await getCash(instance));
  };
  return { fetchCash };
};

export default useBillingAPI;
