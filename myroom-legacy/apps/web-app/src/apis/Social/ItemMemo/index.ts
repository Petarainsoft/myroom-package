import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { instance } from '@/common/utils/axios';
import { getItemMemo, patchItemMemo, postItemMemo } from './fetch';
import {
  IItemMemoGetRequestParams,
  IItemMemoPatchRequestParams,
  IItemMemoRequestData,
} from './type';

const useItemMemoAPI = () => {
  const queryClient = useQueryClient();

  /**
   *메모 삭제하기
   */
  const mutationPatchItemMemo = useMutation(
    async (payload: { params: IItemMemoPatchRequestParams }) =>
      await patchItemMemo(instance, payload.params),
    {
      onSuccess: async (_, variables) => {
        await queryClient.invalidateQueries(['fetchItemMemos', 'home']);
        await queryClient.invalidateQueries([
          'fetchItemMemos',
          'item',
          variables.params.item_instance_id ?? 'home',
        ]);
      },
    },
  );
  /**
   *메모 생성하기
   */
  const mutationPostItemMemo = useMutation(
    async (payload: { data: IItemMemoRequestData }) =>
      await postItemMemo(instance, payload.data),
    {
      onSuccess: async (_, variables) => {
        await queryClient.invalidateQueries([
          'fetchItemMemos',
          'item',
          variables.data.item_instance_id ?? 'home',
          variables.data.myroom_id,
        ]);
        await queryClient.invalidateQueries(['fetchItemMemos', 'home']);
      },
    },
  );

  /**
   * 메모 리스트
   * @param params
   * @returns
   */
  const fetchItemMemos = (params: IItemMemoGetRequestParams) => {
    return useQuery(
      [
        `fetchItemMemos`,
        params.isHome ? 'home' : 'item',
        params.item_instance_id ?? 'home',
        params.myroom_id,
      ],
      async () => await getItemMemo(instance, params),
      {
        enabled: !!params.profile_id && !!params.myroom_id,
        staleTime: 1000 * 60 * 5,
        cacheTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
      },
    );
  };

  return { mutationPostItemMemo, fetchItemMemos, mutationPatchItemMemo };
};

export default useItemMemoAPI;
