import { useInfiniteQuery, useMutation, useQueries, useQuery } from '@tanstack/react-query';
import { instance } from '@/common/utils/axios';
import { getMarketProducts, getProduct, postPurchase } from './fetch';
import { MarketPurchaseData, MarketSearchParams } from './type';

const useMarketAPI = () => {
  /**
   * 마켓 리스트 구매
   */
  const mutationPostPurchase = useMutation(
    async (payload: { data: MarketPurchaseData }) =>
      await postPurchase(instance, payload.data),
  );

  /**
   * 마켓 아이템 단건조회
   * @param id
   * @returns
   */
  const fetchProduct = (id?: string) => {
    return useQuery(
      [`fetchProduct`, id],
      async () => await getProduct(instance, id),
      { enabled: !!id }
    );
  };

  /**
  * 마켓 아이템 단건조회 (Search Item ID 리스트와 연동)
  * @param idList
  * @returns
  */
  const fetchProductsList = (idList: { id: string }[]) => {
    return useQueries({
      queries: idList.map((data) => ({
        queryKey: [`fetchProduct_${data.id}`, data.id],
        queryFn: () => getProduct(instance, data.id),
        // queryFn: async () => await getProduct(instance, data.id),
      }))
    });
  }

  /**
   * 마켓 리스트
   * @param params
   * @returns
   */
  const fetchMarketProducts = (params: MarketSearchParams) => {
    return useQuery(
      [`fetchMarketSearch`, params.category, params.selling, params.page, params.limit],
      async () => await getMarketProducts(instance, params),
    );
  };

  
  /**
   * 마켓 리스트
   * @param params
   * @returns
   */
  const fetchMarketProductsInfi = (params: Omit<MarketSearchParams, 'page'>) => {
    return useInfiniteQuery([`fetchMarketProductsInfi`, params.category, params.limit, params.selling],
      async ({ pageParam }) => await getMarketProducts(instance, {page: pageParam, ...params}),
      {
        getNextPageParam: (lastPage) => {
          if (!lastPage) {
            return false;
          }

          if (lastPage?.count?.limit > lastPage?.list?.length) {
            return false;
          }
          else {
            return lastPage?.count?.page + 1;
          }
        },
      }
    );
  };

  return {
    mutationPostPurchase,
    fetchProduct,
    fetchProductsList,
    fetchMarketProducts,
    fetchMarketProductsInfi,
  };
};

export default useMarketAPI;
