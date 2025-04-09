import { useQuery } from '@tanstack/react-query';
import { instance } from '@/common/utils/axios';
import { getWorld, getWorldBan, getWorldEnum } from './fetch';

const useWorldAPI = () => {
  /**
   * 월드 정보 얻기
   * @param id
   * @returns
   */
  const fetchWorld = (id: string) => {
    return useQuery(
      [`fetchWorld`, id],
      async () => await getWorld(instance, id),
    );
  };

  /**
   * 월드 ban 정보 얻기
   * @param id
   * @returns
   */
  const fetchWorldBan = (id: string) => {
    return useQuery(
      [`fetchWorldBan`, id],
      async () => await getWorldBan(instance, id),
    );
  };

  /**
   * 월드 enum 정보 얻기
   * @param id
   * @returns
   */
  const fetchWorldEnum = (id: string) => {
    return useQuery(
      [`fetchWorldEnum`, id],
      async () => await getWorldEnum(instance, id),
    );
  };

  return { fetchWorld, fetchWorldBan, fetchWorldEnum };
};

export default useWorldAPI;
