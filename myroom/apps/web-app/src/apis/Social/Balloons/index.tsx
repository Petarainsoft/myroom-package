import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  BalloonPatchParam,
  BalloonPostParam,
  BalloonsGetParam,
  GetBalloonDataResponse,
} from './type';
import {
  getBalloonDataId,
  getBalloons,
  getMeFreeBalloon,
  patchBalloon,
  postBalloons,
} from './fetch';
import { instance } from '@/common/utils/axios';

const useBalloonsAPI = () => {
  const queryClient = useQueryClient();
  const fetchBalloonsQueryKey = (
    profile_id: string,
    myroom_id: string,
    listType: string,
  ) => {
    return ['fetchBalloons', profile_id, myroom_id, listType];
  };
  const clearFetchBalloonsKey = (
    profile_id: string,
    myroom_id: string,
    listType: string,
  ) => {
    queryClient.removeQueries(
      fetchBalloonsQueryKey(profile_id, myroom_id, listType),
    );
  };
  /**
   * 풍선 메시지 목록 조회.
   */
  const useFetchBalloons = (profile_id: string, params: BalloonsGetParam) => {
    return useInfiniteQuery({
      queryKey: fetchBalloonsQueryKey(
        profile_id,
        params.myroom_id,
        params.type,
      ),
      queryFn: ({ pageParam }) =>
        getBalloons(instance, profile_id, {
          ...params,
          start: pageParam?.start,
          end: pageParam?.end,
        }),
      enabled: profile_id !== '' && params.myroom_id != '',
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
  /**
   * 풍선 상세정보 조회.
   */
  const useFetchBalloonDataById = (balloon_id: string) => {
    return useQuery({
      queryKey: ['fetchBalloonDataId', balloon_id],
      queryFn: () => getBalloonDataId(instance, balloon_id),
      enabled: balloon_id !== '',
    });
  };

  /**
   * 풍선 메시지 생성.
   */
  const mutationPostBalloons = useMutation(
    async (payload: { data: BalloonPostParam }) =>
      await postBalloons(instance, payload.data),
  );
  /**
   * 풍선 메시지 상태 변경.
   */
  const mutationPatchBalloons = useMutation(
    async (payload: { data: BalloonPatchParam }) => {
      const res = await patchBalloon(instance, payload.data);
      if (
        payload.data.operation === 'inactivate' ||
        payload.data.operation === 'activate'
      ) {
        res?.list.map((balloonData) => {
          const queryKey = ['fetchBalloonDataId', balloonData._id];
          const data = queryClient.getQueryData(
            queryKey,
          ) as GetBalloonDataResponse;
          if (data) {
            data.data.option.endts = balloonData.option.endts;
          }
          queryClient.setQueryData(queryKey, data);
        });
      } else if (payload.data.operation === 'read') {
        res?.list.map((balloonData) => {
          const queryKey = ['fetchBalloonDataId', balloonData._id];
          const data = queryClient.getQueryData(
            queryKey,
          ) as GetBalloonDataResponse;
          if (data) {
            data.data.stat.owner_view = true;
          }
          queryClient.setQueryData(queryKey, data);
        });
      }
      return res;
    },
  );
  /**
   * 당일 무료 풍선 사용 횟수 조회.
   */
  const useFetchMeFreeBalloon = () => {
    return useQuery({
      queryKey: ['fetchMeFreeBalloon'],
      queryFn: () => getMeFreeBalloon(instance),
    });
  };
  return {
    mutationPostBalloons,
    fetchBalloons: useFetchBalloons,
    fetchBalloonDataById: useFetchBalloonDataById,
    mutationPatchBalloons,
    fetchMeFreeBalloon: useFetchMeFreeBalloon,
    clearFetchBalloonsKey,
  };
};

export default useBalloonsAPI;
