import { useQuery } from '@tanstack/react-query';
import { instance } from '@/common/utils/axios';
import { getApp } from './fetch';

const useAppAPI = () => {
  /**
   * 앱정보 얻기
   * @param id
   * @returns
   */
  const fetchApp = (id: string) => {
    return useQuery([`fetchApp`, id], async () => await getApp(instance, id));
  };

  return { fetchApp };
};

export default useAppAPI;
