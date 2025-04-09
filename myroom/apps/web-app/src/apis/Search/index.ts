import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import { instance } from '@/common/utils/axios';
import {
  getSearchFollower,
  getSearchFollowing,
  getSearchItems,
  getSearchItemsMatch,
  getSearchProducts,
  getSearchProfiles,
  getSearchRooms,
  getSearchTags,
} from './fetch';
import {
  FollowSearchParams,
  ItemMatchSearchParams,
  ItemsSearchParams,
  MarketSearchParams,
  MyroomSearchParams,
  ProfileSearchParams,
  TagSearchParams,
} from './type';
import useAuth from '@/common/hooks/use-auth';

const useSearchAPI = () => {
  const { isLogined } = useAuth();
  /**
   * 검색 아이템 조회
   * @param id
   * @returns
   */
  const fetchSearchProducts = (
    params: MarketSearchParams,
    enabled: boolean,
  ) => {
    return useQuery(
      [`fetchSearchProducts`, params],
      async () => await getSearchProducts(instance, params),
      {
        enabled: enabled && isLogined,
      },
    );
  };

  /**
   * 유저 검색
   * @param search_string
   * @returns
   */
  const fetchSearchProfiles = useMutation(
    async (params: ProfileSearchParams) =>
      await getSearchProfiles(instance, params),
  );

  /**
   * 검색 아이템 조회
   * @param id
   * @returns
   */
    const fetchSearchProductsInfinity = (params: Omit<MarketSearchParams, 'scroll_id'>) => {
      return useQuery(
        [`fetchSearchProductsInfinity`, params],
        async ({ pageParam }) => await getSearchProducts(instance, {...params, scroll_id: pageParam}),
        {
          enabled: isLogined,
          getNextPageParam: (lastPage) => lastPage?.scroll_id ?? false,
        },
      );
    };
  
  /**
   * 검색 아이템 조회
   * @param id
   * @returns
   */
    const fetchSearchItems = (params: Omit<ItemsSearchParams, 'scroll_id'>) => {
      return useInfiniteQuery(
        [`fetchSearchItems`, params.search_string, params.limit],
        async ({ pageParam }) => await getSearchItems(instance, {...params, scroll_id: pageParam}),
        {
          enabled: isLogined,
          getNextPageParam: (lastPage) => lastPage?.scroll_id ?? false,
        },
      );
    };
  
    /**
   * 검색 마이룸 조회
   * @param id
   * @returns
   */
    const fetchSearchMyrooms = (params: Omit<MyroomSearchParams, 'scroll_id'>) => {
      return useInfiniteQuery(
        [`fetchSearchMyrooms`, params.search_string, params.limit],
        async ({ pageParam }) => await getSearchRooms(instance, {...params, scroll_id: pageParam}),
        {
          enabled: isLogined,
          getNextPageParam: (lastPage) => lastPage?.scroll_id ?? false,
        },
      );
    };
  
  
    /**
  * 검색 아이템 조회
  * @param id
  * @returns
  */
  const fetchSearchProfilesInfinity = (params: Omit<ProfileSearchParams, "scroll_id">) => {
    return useInfiniteQuery(
      [`fetchSearchProfiles`, params.search_string, params.limit],
      async ({ pageParam }) => await getSearchProfiles(instance, {...params, scroll_id: pageParam}),
      {
        getNextPageParam: (lastPage) => lastPage?.scroll_id ?? false,
        enabled: !!params.search_string,
      },
    );
  };

  /**
   * 타인 프로필의 follower 닉네임 검색
   * GET /v1/search/profiles/{profile_id}/follower/nicknames
   * @param params
   * @returns
   */
  const fetchSearchFollower = (params: FollowSearchParams) => {
    return useInfiniteQuery({
      queryKey: ['fetchSearchFollower', params.profile_id, params.nickname],
      queryFn: ({ pageParam }) =>
        getSearchFollower(instance, {
          scroll_id: pageParam?.scroll_id,
          ...params,
        }),
      getNextPageParam: (lastPage) => {
        return {
          scroll_id: lastPage?.scroll_id,
          disableTotalCount: true,
        };
      },
      enabled: Boolean(params.profile_id && params.nickname),
    });
  };

  /**
   * 타인 프로필의 follower 닉네임 검색
   * GET /v1/search/profiles/{profile_id}/following/nicknames
   * @param params
   * @returns
   */
  const fetchSearchFollowing = (params: FollowSearchParams) => {
    return useInfiniteQuery({
      queryKey: ['fetchSearchFollowing', params.profile_id, params.nickname],
      queryFn: ({ pageParam }) =>
        getSearchFollowing(instance, {
          scroll_id: pageParam?.scroll_id,
          ...params,
        }),
      getNextPageParam: (lastPage) => {
        return {
          scroll_id: lastPage?.scroll_id,
          disableTotalCount: true,
        };
      },
      enabled: Boolean(params.profile_id && params.nickname),
    });
  };

    /**
   * 검색 태그 조회
   * @param id
   * @returns
   */
      const fetchSearchTags = (params: Omit<TagSearchParams, "scroll_id">) => {
        return useInfiniteQuery(
          [`fetchSearchTags`, params.search_string, params.limit],
          async ({ pageParam }) => await getSearchTags(instance, {...params, scroll_id: pageParam}),
          {
            getNextPageParam: (lastPage) => lastPage?.scroll_id ?? false,
            enabled: !!params.search_string,
          },
        );
  };
  
      /**
   * 검색 태그 조회
   * @param id
   * @returns
   */
      const fetchSearchItemsMatch = (params: Omit<ItemMatchSearchParams, "scroll_id">) => {
        return useInfiniteQuery(
          [`fetchSearchItemsMatch`, params.ht_code, params.limit],
          async ({ pageParam }) => await getSearchItemsMatch(instance, {...params, scroll_id: pageParam}),
          {
            getNextPageParam: (lastPage) => lastPage?.scroll_id ?? false,
            enabled: !!params.ht_code,
          },
        );
      };
    

  return {
    fetchSearchProducts,
    fetchSearchProductsInfinity,
    fetchSearchItems,
    fetchSearchMyrooms,
    fetchSearchProfiles,
    fetchSearchFollower,
    fetchSearchFollowing,
    fetchSearchTags,
    fetchSearchProfilesInfinity,
    fetchSearchItemsMatch,
  };
};

export default useSearchAPI;
