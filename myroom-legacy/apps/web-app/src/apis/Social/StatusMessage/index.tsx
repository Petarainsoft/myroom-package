import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { instance } from '@/common/utils/axios';
import {
  delStatusMessage,
  getStatusMessage,
  getStatusMessages,
  postStatusMessages,
} from './fetch';
import { StatusMessageData, StatusMessagesParams } from './type';

import { getProfileResource } from '@/apis/User/Profile/fetch';

const useStatusMessageAPI = () => {
  const queryClient = useQueryClient();
  /**
   * 프로필 리소스 가져오기 status-message
   * @param profileId
   * @returns
   * GET v1/user/profiles/{profile_id}/{resource}
   */
  const fetchProfileResourceStatusMessage = ({
    profileId,
  }: {
    profileId: string;
  }) => {
    return useQuery(
      ['fetchProfileResourceStatusMessage', profileId],
      () => getProfileResource(instance, profileId, 'status-message'),
      { enabled: Boolean(profileId) },
    );
  };

  /**
   * 상태메시지 정보
   * @param id
   * @returns
   */
  const fetchStatusMessage = ({
    id,
    option,
  }: {
    id: string;
    option?: Object;
  }) => {
    return useQuery(
      [`fetchStatusMessage`, id],
      async () => await getStatusMessage(instance, id),
      option,
    );
  };

  /**
   * 상태메시지 작성
   */
  const mutationPostStatusMessage = useMutation(
    async (payload: { data: StatusMessageData }) =>
      await postStatusMessages(instance, payload.data),
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: ['fetchProfileResourceStatusMessage', `me`],
          exact: true,
        });
      },
    },
  );

  /**
   * 상태메시지 리스트 현재는 사용안함
   * @param params
   * @param options
   * @returns
   */
  const fetchStatusMessages = (params: StatusMessagesParams) => {
    return useQuery(
      [`fetchStatusMessages`, params],
      async () => await getStatusMessages(instance, params),
      // { ...options, enabled: authStatus },
    );
  };
  /**상태 메시지 삭제하기 현재는 사용안함*/
  const mutationDeleteStatusMessage = useMutation(
    async (id: string) => await delStatusMessage(instance, id),
  );

  return {
    fetchStatusMessage,
    fetchProfileResourceStatusMessage,
    mutationPostStatusMessage,
    fetchStatusMessages,
    mutationDeleteStatusMessage,
  };
};

export default useStatusMessageAPI;
