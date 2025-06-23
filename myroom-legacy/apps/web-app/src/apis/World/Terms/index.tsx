import { useQuery } from '@tanstack/react-query';
import { instance } from '@/common/utils/axios';
import { getTerms } from './fetch';

const useTermsAPI = () => {
  /**
   * 앱정보 얻기
   * @param id
   * @returns
   */
  const fetchTerms = (id: string) => {
    return useQuery([`fetchTerms`, id], async () => await getTerms(instance, id), {enabled:id!=""});
  };

  return { fetchTerms };
};

export default useTermsAPI;
