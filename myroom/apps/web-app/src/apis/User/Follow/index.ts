import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { instance } from '@/common/utils/axios';
import {
  getFollowers,
  delFollower,
  getMeFollowings,
  putFollowings,
  delFollowings,
  getMeFollowers,
  getFollowings,
} from './fetch';
import useAuth from '@/common/hooks/use-auth';
import { FollowParams } from './type';

const useFollowAPI = () => {
  const queryClient = useQueryClient();
  const { isLogined } = useAuth();

  /**
   * 나의 팔로워 리스트
   * @returns
   */
  const fetchMeFollowers = () => {
    return useQuery(
      [`fetchMeFollowers`],
      async () => await getMeFollowers(instance),
      { enabled: isLogined },
    );
  };

  /** 팔로워 삭제 */
  const mutationDelFollower = useMutation(
    async (payload: { profileId: string }) =>
      await delFollower(instance, payload.profileId),
  );

  /**
   * 나의 팔로잉 리스트
   * @returns
   */
  const fetchMeFollowings = (params?: any) => {
    return useQuery(
      [`fetchMeFollowings`],
      async () => await getMeFollowings(instance, params),
      {
        enabled: isLogined,
        // staleTime: 1000 * 60 * 5,
        // cacheTime: 1000 * 60 * 5,
        // refetchOnWindowFocus: false,
      },
    );
  };

  /** 팔로워 리스트
   * GET /v1/user/profiles/{profile_id}/followers
   * @returns
   */
  const fetchFollowers = (params: FollowParams) => {
    // return useQuery(
    //   [`fetchFollowers`, params.profile_id],
    //   async () => await getFollowers(instance, params),
    //   { enabled: isLogined },
    // );
    return useInfiniteQuery({
      queryKey: [`fetchFollowers`, params.profile_id, params.page, params?.key],
      queryFn: ({ pageParam = 1 }) =>
        getFollowers(instance, { ...params, page: pageParam }),
      getNextPageParam: (lastPage) => {
        const length = lastPage?.list?.length ? lastPage?.list?.length : 0;
        const limit = lastPage?.current?.limit ? lastPage?.current?.limit : 0;
        if (length < limit) return undefined;
        return lastPage?.current?.page
          ? lastPage?.current?.page + 1
          : undefined;
      },
      enabled: isLogined,
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    });
  };

  /** 팔로잉 리스트
   * GET /v1/user/profiles/{profile_id}/follows
   * @returns
   */
  const fetchFollowings = (params: FollowParams) => {
    return useInfiniteQuery({
      queryKey: [
        `fetchFollowings`,
        params.profile_id,
        params.page,
        params?.key,
      ],
      queryFn: ({ pageParam = 1 }) =>
        getFollowings(instance, { ...params, page: pageParam }),
      getNextPageParam: (lastPage) => {
        const length = lastPage?.list?.length ? lastPage?.list?.length : 0;
        const limit = lastPage?.current?.limit ? lastPage?.current?.limit : 0;
        if (length < limit) return undefined;
        return lastPage?.current?.page
          ? lastPage?.current?.page + 1
          : undefined;
      },
      enabled: isLogined,
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    });
  };

  /** 팔로잉 요청 */
  const mutationPutFollowings = useMutation(
    async (payload: {
      profileId: string;
      meProfileId?: string | null;
      isInvalidate?: boolean;
    }) => await putFollowings(instance, payload.profileId),
    {
      onSuccess: async (_, variables) => {
        const { profileId, meProfileId, isInvalidate } = variables;

        await queryClient.invalidateQueries(['fetchMeFollowings']);
        await queryClient.invalidateQueries(['fetchProfilesMeCount']);

        // todo : 팔로윙 숫자 및 리스트 즉시 반영 (기획 상 즉시 반영 X 라고 해서 대기)
        // await queryClient.invalidateQueries(['fetchFollowings', profileId]);
        // await queryClient.invalidateQueries(['fetchProfileCount', profileId]);
        // if(meProfileId && isInvalidate) {
        // 사용자 추천탭 / 팔로윙,팔로워 탭 기능분화 위에 설정, 필요없을 시 삭제
        //   await queryClient.invalidateQueries(['fetchProfileCount', meProfileId]);
        //   await queryClient.invalidateQueries(['fetchFollowings', meProfileId]);
        // }
      },
    },
  );

  /** 팔로잉 삭제 */
  const mutationDelFollowings = useMutation(
    async (payload: {
      profileId: string;
      meProfileId?: string | null;
      isInvalidate?: boolean;
    }) => await delFollowings(instance, payload.profileId),
    {
      onSuccess: async (_, variables) => {
        const { profileId, meProfileId, isInvalidate } = variables;

        await queryClient.invalidateQueries(['fetchMeFollowings']);
        await queryClient.invalidateQueries(['fetchProfilesMeCount']);

        // todo : 팔로윙 숫자 및 리스트 즉시 반영 (기획 상 즉시 반영 X 라고 해서 대기)
        // await queryClient.invalidateQueries(['fetchFollowings', profileId]);
        // await queryClient.invalidateQueries(['fetchProfileCount', profileId]);
        // if(meProfileId && isInvalidate) {
        // 사용자 추천탭 / 팔로윙,팔로워 탭 기능분화 위에 설정, 필요없을 시 삭제
        //   await queryClient.invalidateQueries(['fetchProfileCount', meProfileId]);
        //   await queryClient.invalidateQueries(['fetchFollowings', meProfileId]);
        // }
      },
    },
  );

  return {
    fetchMeFollowers,
    mutationDelFollower,
    fetchMeFollowings,
    fetchFollowings,
    fetchFollowers,
    mutationPutFollowings,
    mutationDelFollowings,
  };
};

export default useFollowAPI;
