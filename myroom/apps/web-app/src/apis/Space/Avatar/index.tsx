import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { instance } from '@/common/utils/axios';
import {
  getAvatar,
  getAvatarManifest,
  getAvatarsMe,
  patchAvatar,
  postAvatars,
} from './fetch';
import { AvatarReqData } from './type';

const useAvatarAPI = () => {
  const queryClient = useQueryClient();
  
  /**
   * 아바타 추가
   */
  const mutationPostAvatars = useMutation(
    async (payload: { data: AvatarReqData }) =>
      await postAvatars(instance, payload.data),
  );

  /**
   * 아바타 수정
   */
  const mutationPatchAvatar = useMutation(
    async (payload: { id: string; data: AvatarReqData }) =>
      await patchAvatar(instance, payload.id, payload.data),
    {
      onSuccess: async (data, variables) => {
        const { id } = variables;
        await queryClient.invalidateQueries(['fetchAvatar', id]);
      }
    }
  );

  /**
   * 아바타 조회
   * @param id
   * @returns
   */
  const fetchAvatar = (id?: string) => {
    return useQuery(
      [`fetchAvatar`, id],
      async () => await getAvatar(instance, id),
    );
  };

  /**
 * 아바타 조회 (다수)
 * @param id
 * @returns
 */
  const fetchAvatars = (ids: string[]) => {
    return useQueries({
      queries: ids.map(id => ({
        queryKey: [`fetchAvatar`, id],
        queryFn: async () => await getAvatar(instance, id),
      }))
    });
  };



  /**
   * 내 아바타 리스트
   * @returns
   */
  const fetchAvatarsMe = () => {
    return useQuery(
      [`fetchAvatarsMe`],
      async () => await getAvatarsMe(instance),
      { enabled: false },
    );
  };

  /**
   *
   * @param id
   * @param version
   * @returns
   */
  const fetchAvatarManifest = (id?: string, version?: number) => {
    return useQuery(
      [`fetchAvatarManifest`, id, version],
      async () => await getAvatarManifest(instance, id, version), { enabled:  Boolean(id && version) }
    );
  };
  // const fetchAvatarManifest = (id: string, version: number) => {
  //   return useQuery(
  //     [`fetchAvatarManifest`, id, version],
  //     async () => await getAvatarManifest(instance, id, version),
  //   );
  // };

  return {
    mutationPostAvatars,
    mutationPatchAvatar,
    fetchAvatar,
    fetchAvatars,
    fetchAvatarsMe,
    fetchAvatarManifest,
  };
};

export default useAvatarAPI;
