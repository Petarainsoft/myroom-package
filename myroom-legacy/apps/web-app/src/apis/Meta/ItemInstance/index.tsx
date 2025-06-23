import { useMutation, useQuery } from '@tanstack/react-query';
import { instance } from '@/common/utils/axios';
import { ItemInstanceData, ItemInstancesData } from './type';
import { getItemInstance, patchItemInstance, postItemInstances } from './fetch';

const useItemInstanceAPI = () => {
  /**
   * 아이템 인스턴스 생성
   */
  const mutationPostItemInstances = useMutation(
    async (payload: { data: ItemInstancesData }) =>
      await postItemInstances(instance, payload.data),
  );

  /**
   * 아이템 인스턴스 수정
   */
  const mutationPatchItemInstance = useMutation(
    async (payload: { id: string; data: ItemInstanceData }) =>
      await patchItemInstance(instance, payload.id, payload.data),
  );

  /**
   * 아이템 인스턴스 조회
   * @param id
   * @returns
   */
  const fetchItemInstance = (id: string) => {
    return useQuery(
      [`fetchItemInstance`, id],
      async () => await getItemInstance(instance, id),
    );
  };

  return {
    mutationPostItemInstances,
    mutationPatchItemInstance,
    fetchItemInstance,
  };
};

export default useItemInstanceAPI;
