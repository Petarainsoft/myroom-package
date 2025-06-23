import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { instance } from '@/common/utils/axios';
import { delCoordi, getCoordi, getCoordisMe, postCoordis } from './fetch';
import { CoordiData, CoordisParams } from './type';

const useCoordiAPI = () => {
  const queryClient = useQueryClient();

  /**
   * 코디 추가
   */
  const mutationPostCoordis = useMutation(
    async (payload: { data: CoordiData }) =>
      await postCoordis(instance, payload.data),
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries([`fetchCoordisMe`]);
      },
    },
  );

  /**
   * 코디 삭제
   */
  const mutationDelCoordi = useMutation(
    async (payload: { id: string }) => await delCoordi(instance, payload.id),
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries([`fetchCoordisMe`]);
      },
    },
  );

  /**
   * 코디 조회
   * @param id
   * @returns
   */
  const fetchCoordi = (id: string) => {
    return useQuery(
      [`fetchCoordi`, id],
      async () => await getCoordi(instance, id),
    );
  };

  /**
   * 내 코디 리스트
   * @param params
   * @returns
   */
  const fetchCoordisMe = (params: CoordisParams) => {
    return useQuery(
      [`fetchCoordisMe`],
      async () => await getCoordisMe(instance, params),
    );
  };

  return {
    mutationPostCoordis,
    mutationDelCoordi,
    fetchCoordi,
    fetchCoordisMe,
  };
};

export default useCoordiAPI;
