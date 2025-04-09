import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { FeedsGetParam } from './type';
import { deleteFeeds, getFeeds } from './fetch';
import { instance } from '@/common/utils/axios';
const useFeedsAPI = () => {
  const queryClient = useQueryClient();
  const fetchFeedsQueryKey = (profile_id: string) => {
    return ['fetchFeeds', profile_id];
  };

  /**
   * 피드 삭제하기
   */
  const mutationDeleteFeeds = useMutation(
    async (payload: { feedId: string; profile_id: string }) =>
      await deleteFeeds(instance, payload.feedId),
    {
      onSuccess: async (_, variables) => {
        await queryClient.invalidateQueries(
          fetchFeedsQueryKey(variables.profile_id),
        );
      },
    },
  );

  /**
   * 피드 리스트 조회.
   */
  const useFetchFeeds = (profile_id: string, params: FeedsGetParam) => {
    return useInfiniteQuery({
      queryKey: fetchFeedsQueryKey(profile_id),
      queryFn: ({ pageParam }) =>
        getFeeds(instance, profile_id, {
          ...params,
          start: pageParam?.start,
          end: pageParam?.end,
        }),
      enabled: profile_id !== '',
      getNextPageParam: (lastPage) => {
        if (lastPage && lastPage.count && lastPage.count.current > 0) {
          return {
            end: lastPage?.count?.start - 1,
          };
        } else {
          return undefined;
        }
      },
      getPreviousPageParam: (firstPage) => {
        if (firstPage && firstPage.count && firstPage.count.current === 0) {
          return {
            start: firstPage?.count?.start + 1,
          };
        } else {
          return undefined;
        }
      },
    });
  };

  return { useFetchFeeds, mutationDeleteFeeds };
};
export default useFeedsAPI;
