import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { instance } from '@/common/utils/axios';
import {
  getItemInstance,
  getItemInstanceById,
  patchItemInstance,
  postItemInstance
} from './fetch';
import { InstanceDataTypeReq } from './type';

const useItemInstanceAPI = () => {
  const queryClient = useQueryClient();

  /**
   * 아이템 인스턴스 id 발급
   * @param id
   * @returns
   */
  const fetchItemInstanceId = (isEnabled = true) => {
    return useQuery(
      [`fetchItemInstanceId`],
      async () => await getItemInstance(instance),
      { enabled: isEnabled }
    );
  };
  /**
   * 아이템 인스턴스 id 발급
   * @param id
   * @returns
   */
  const fetchItemInstanceById = (id: string, isEnabled = true) => {
    return useQuery(
      [`fetchItemInstanceById`, id],
      async () => await getItemInstanceById(instance, id),
      { enabled: isEnabled }
    );
  };

  /**
   * 아이템 인스턴스 생성
   */
  const mutationPostItemInstance = useMutation(
    async (payload: { data: InstanceDataTypeReq }) =>
      await postItemInstance(instance, payload.data),
    {
      onSuccess: async () => {
        // await queryClient.invalidateQueries([`fetchCoordisMe`]);
      },
    },
  );

  /**
   * 아이템 인스턴스 수정
   */
  const mutationPatchItemInstance = useMutation(
    async (id: string) =>
      await patchItemInstance(instance, id),
    {
      onSuccess: async () => {
        // await queryClient.invalidateQueries([`fetchCoordisMe`]);
      },
    },
  );

  return {
    fetchItemInstanceId,
    fetchItemInstanceById,
    mutationPostItemInstance,
    mutationPatchItemInstance
  };
};

export default useItemInstanceAPI;
