import { useQuery } from '@tanstack/react-query';
import { instance } from '@/common/utils/axios';
import { getFaq, getFaqs } from './fetch';
import { FaqParams, FaqsParams } from './type';

const useFaqAPI = () => {
  /**
   * FAQ 리스트 얻기
   * @param params
   * @returns
   */
  const fetchFaqs = (params: FaqsParams) => {
    return useQuery(
      [`fetchFaqs`, params],
      async () => await getFaqs(instance, params),
    );
  };

  /**
   * FAQ 얻기
   * @param params
   * @returns
   */
  const fetchFaq = (id: string, params: FaqParams) => {
    return useQuery(
      [`fetchFaq`, id, params],
      async () => await getFaq(instance, id, params),
    );
  };

  return { fetchFaqs, fetchFaq };
};

export default useFaqAPI;
