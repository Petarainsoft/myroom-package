import { useQuery } from '@tanstack/react-query';
import { instance } from '@/common/utils/axios';
import { getNotice, getNoties } from './fetch';
import { NoticeParams, NotiesParams } from './type';

const useNoticeAPI = () => {
  /**
   * 공지사항 리스트 얻기
   * @param params
   * @returns
   */
  const fetchNoties = (params: NotiesParams) => {
    return useQuery(
      [`fetchNoties`, params],
      async () => await getNoties(instance, params),
    );
  };

  /**
   * 공지사항 얻기
   * @param params
   * @returns
   */
  const fetchNotice = (id: string, params: NoticeParams) => {
    return useQuery(
      [`fetchNotice`, id, params],
      async () => await getNotice(instance, id, params),
    );
  };

  return { fetchNoties, fetchNotice };
};

export default useNoticeAPI;
