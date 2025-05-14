import { useInfiniteQuery } from '@tanstack/react-query';
import { instance } from '@/common/utils/axios';
import {
  getSearchItems,
  getSearchItemsMatch,
  getSearchRooms,
} from './fetch';
import {
  ItemMatchSearchParams,
  ItemsSearchParams,
  MyroomSearchParams,
} from './type';
import useAuth from '@/common/hooks/use-auth';

const useSearchAPI = () => {
  const { isLogined } = useAuth();

  
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
    fetchSearchItems,
    fetchSearchMyrooms,
    fetchSearchItemsMatch,
  };
};

export default useSearchAPI;
