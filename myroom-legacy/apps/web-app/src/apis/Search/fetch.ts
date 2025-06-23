import onRequest, { RequestInstance } from '@/common/utils/fetch';
import {
  ItemsSearchParams,
  MyroomSearchParams,
  SearchItemsResponse,
  SearchMyroomResponse,
} from './type';




/**
 *
 * @param instance
 * @param params
 * @returns
 */
export async function getSearchItems(
  instance: RequestInstance,
  params: ItemsSearchParams,
) {
  return await onRequest<SearchItemsResponse>(
    instance,
    `/v1/search/market/items`,
    {
      method: 'GET',
      params,
      headers: {
        accept: ' application/json',
        'Content-Type': 'application/json',
      },
      // mock: true,
    },
  );
}

/**
 *
 * @param instance
 * @param params
 * @returns
 */
export async function getSearchRooms(
  instance: RequestInstance,
  params: MyroomSearchParams,
) {
  return await onRequest<SearchMyroomResponse>(
    instance,
    `/v1/search/myrooms`,
    {
      method: 'GET',
      params,
      headers: {
        accept: ' application/json',
        'Content-Type': 'application/json',
      },
      // mock: true,
    },
  );
}

/**
 *
 * @param instance
 * @param params
 * @returns
 */
export async function getSearchItemsMatch(
  instance: RequestInstance,
  params: MyroomSearchParams,
) {
  return await onRequest<SearchMyroomResponse>(
    instance,
    `/v1/search/market/items/match`,
    {
      method: 'GET',
      params,
      headers: {
        accept: ' application/json',
        'Content-Type': 'application/json',
      },
    },
  );
}

