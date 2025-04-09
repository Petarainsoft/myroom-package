import onRequest, { RequestInstance } from '@/common/utils/fetch';
import {
  FollowSearchParams,
  ItemsSearchParams,
  MarketSearchParams,
  MyroomSearchParams,
  ProfileSearchParams,
  SearchItemsResponse,
  SearchMyroomResponse,
  SearchProductsResponse,
  SearchProfileResponse,
  SearchTagResponse,
  TagSearchParams,
} from './type';

/**
 *
 * @param instance
 * @param params
 * @returns
 */
export async function getSearchProducts(
  instance: RequestInstance,
  params: MarketSearchParams,
) {
  return await onRequest<SearchProductsResponse>(
    instance,
    `/v1/search/market/products`,
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

/**
 *
 * @param instance
 * @param params
 * @returns
 */
export async function getSearchProfiles(
  instance: RequestInstance,
  params: ProfileSearchParams,
) {
  return await onRequest<SearchProfileResponse>(
    instance,
    `/v1/search/profiles`,
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

/**
 * GET /v1/search/profiles/{profile_id}/follower/nicknames
 * @param instance
 * @param params
 * @returns
 */
export async function getSearchFollower(
  instance: RequestInstance,
  params: FollowSearchParams,
) {
  return await onRequest<SearchProfileResponse>(
    instance,
    `/v1/search/profiles/${params.profile_id}/follower/nicknames`,
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

/**
 *GET /v1/search/profiles/{profile_id}/following/nicknames
 * @param instance
 * @param params
 * @returns
 */
export async function getSearchFollowing(
  instance: RequestInstance,
  params: FollowSearchParams,
) {
  return await onRequest<SearchProfileResponse>(
    instance,
    `/v1/search/profiles/${params.profile_id}/following/nicknames`,
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

/**
 *
 * @param instance
 * @param params
 * @returns
 */
export async function getSearchTags(
  instance: RequestInstance,
  params: TagSearchParams,
) {
  return await onRequest<SearchTagResponse>(
    instance,
    `/v1/search/hashtags`,
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

