import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import { instance } from '@/common/utils/axios';
import { getItem, getItems, getMeItem, getMeItems, postItem } from './fetch';
import { UploadItemData, ItemsParams, ItemUploadParams, MeItemsParams } from './type';
import useAuth from '@/common/hooks/use-auth';

const useItemAPI = () => {
  const { isLogined } = useAuth();
  /**
   * 아이템 생성
   */
  const mutationPostItem = useMutation(
    async (payload: {
      itemId: string;
      params: ItemUploadParams;
      data: UploadItemData;
    }) =>
      await postItem(instance, payload.itemId, payload.params, payload.data),
  );

  /**
   * 아이템 조회
   * @param id
   * @param params
   * @returns
   */
  const fetchItem = (id?: string) => {
    return useQuery([`fetchItem`, id], async () => await getItem(instance, id), {enabled: !!id});
  };

  /**
   * 아이템 리스트 조회
   * @param id
   * @param params
   * @returns
   */
  const fetchItems = (params: ItemsParams) => {
    return useQuery(
      [`fetchItems`, params],
      async () => await getItems(instance, params),
    );
  };


    /**
     * 내 아이템 리스트 조회
     * 
     * @param params 
     * @returns 
     */
    const fetchMeItems = (params: MeItemsParams) => {
      return useInfiniteQuery(
        [`fetchMeItems`, params.category, params.page, params.limit],
        async () => await getMeItems(instance, params),
        {
          enabled: isLogined,
        }
      );
  };
  
  /**
   * 내 아이템 조회
   * @param id
   * @param params
   * @returns
   */
      const fetchMeItem = (id?:string) => {
        return useQuery(
          [`fetchMeItem`, id],
          async () => await getMeItem(instance, id),
          {
            enabled: Boolean(isLogined && id),
          }
        );
      };

  const mutationItem = useMutation(
    async (payload: { itemId: string }) =>
      await getItem(instance, payload.itemId),
  );

  return {
    mutationPostItem,
    fetchItem,
    fetchItems,
    fetchMeItem,
    fetchMeItems,
    mutationItem,
  };
};

export default useItemAPI;
