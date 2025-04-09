import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { instance } from '@/common/utils/axios';
import {
  getReaction,
  getMyReactions,
  postReaction,
  getMyReactionByType,
  getMyReaction,
} from './fetch';
import {
  MeReactionsParams,
  ReactionParams,
} from './type';
import useAuth from '@/common/hooks/use-auth';

// import { produce } from 'immer';

const useReactionAPI = () => {
  const { isLogined } = useAuth();

  const queryClient = useQueryClient();


  /**
   * 유저 리액션 리스트
   * @param params
   * @returns
   */
  const fetchMyReactionsByType = (type: string) => {
    return useQuery(
      [`fetchMyReactionsByType`, type],
      async () => await getMyReactionByType(instance, type),
      { enabled: isLogined }
    );
  };

  
  /**
   * 유저 리액션 리스트
   * @param params
   * @returns
   */
  const fetchMeReactions = (params: MeReactionsParams) => {
    return useInfiniteQuery(
      [`fetchMeReactions`, params.target_type, params.filter_reaction, params.page, params.limit, params.orderby, params.order],
      async ({ pageParam }) => await getMyReactions(instance, {page:pageParam, ...params}),
      {
        getNextPageParam: (lastPage, pages) => {
          if (!lastPage) {
            return false;
          }

          if (lastPage?.current?.limit > lastPage?.list?.length) {
            return false;
          }
          else {
            return lastPage?.current?.page + 1;
          }
        },
        enabled: isLogined,
      }
    );
  };

  /**
   * 유저 리액션 리스트
   * @param params
   * @returns
   */
  const fetchMyReaction = (id?: string) => {
    return useQuery(
      [`fetchMyReaction`, id],
      async () => await getMyReaction(instance, id),
      { enabled: Boolean(isLogined && id) }
    );
  };

  /**
   * 리액션 정보
   * @param id
   * @returns
   */
  const fetchReaction = (id: string) => {
    return useQuery(
      [`fetchReaction`, id],
      async () => await getReaction(instance, id), { enabled: !!id }
    );
  };

  /**
   * 리액션 토글
   * @param id
   * @returns
   */
  const mutationPostReaction = useMutation(
    async (payload: { id: string; params: ReactionParams }) =>
      await postReaction(instance, payload.id, payload.params),
    {
      onSuccess: (data, variables) => {
        console.log(data)
        const { id } = variables;

        queryClient.invalidateQueries(['fetchMyReaction', id]);
        queryClient.invalidateQueries(['fetchMyReactionsByType', 'item']);
        queryClient.invalidateQueries(['fetchReaction', id]);
      },
    }

  );

  // /**
  //  * 리액션 유저프로필 리스트
  //  * @param id
  //  * @param params
  //  * @returns
  //  */
  // const fetchReactionProfile = (id: string, params: ReactionProfileParams) => {
  //   return useQuery(
  //     [`fetchReactionProfile`, id, params],
  //     async () => await getReactionProfile(instance, id, params),
  //   );
  // };

  return {
    fetchMeReactions,
    fetchReaction,
    fetchMyReaction,
    fetchMyReactionsByType,
    mutationPostReaction,
    // fetchReactionProfile,
  };
};

export default useReactionAPI;
