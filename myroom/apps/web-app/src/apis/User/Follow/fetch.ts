import onRequest, { RequestInstance } from '@/common/utils/fetch';
import { FollowListResponse, FollowParams, FollowRes } from './type';

/**
 *
 * @param instance
 * @returns
 */
export async function getMeFollowers(instance: RequestInstance) {
  return await onRequest<any>(instance, `/v1/user/profiles/me/followers`, {
    method: 'GET',
  });
}

/**
 *
 * @param instance
 * @param profileId
 * @returns
 */
export async function delFollower(
  instance: RequestInstance,
  profileId: string,
) {
  return await onRequest<any>(
    instance,
    `/v1/user/profiles/me/followers/${profileId}`,
    { method: 'DELETE' },
  );
}
const fakeFollowListResponse: FollowListResponse = {
  current: {
    limit: 10,
    page: 1,
    total: 45
  },
  list: [
    { _id: "user_001" },
    { _id: "user_002" },
    { _id: "user_003" },
    { _id: "user_004" },
    { _id: "user_005" },
    { _id: "user_006" },
    { _id: "user_007" },
    { _id: "user_008" },
    { _id: "user_009" },
    { _id: "user_010" }
  ],
  scrollid: "scroll_abc123def456",
  t: 1713240000000 // timestamp is fake, could be Date.now()
};

/**
 *
 * @param instance
 * @returns
 */
export async function getMeFollowings(instance: RequestInstance, params: any) {
  return fakeFollowListResponse
  return await onRequest<FollowListResponse>(
    instance,
    `/v1/user/profiles/me/followings`,
    {
      method: 'GET',
      params: params,
    },
  );
}

/**
 *
 * @param instance
 * @param profileId
 * @returns
 */
export async function putFollowings(instance: RequestInstance, profileId: string) {
  return await onRequest<any>(
    instance,
    `/v1/user/profiles/me/followings/${profileId}`,
    { method: 'PUT' },
  );
}

/**
 *
 * @param instance
 * @param profileId
 * @returns
 */
export async function delFollowings(instance: RequestInstance, profileId: string) {
  return await onRequest<any>(
    instance,
    `/v1/user/profiles/me/followings/${profileId}`,
    { method: 'DELETE' },
  );
}

/**
 *
 * @param instance
 * @param profileId
 * @returns
 */
export async function getFollowers(
  instance: RequestInstance,
  params: FollowParams,
) {
  return await onRequest<FollowRes>(
    instance,
    `/v1/user/profiles/${params.profile_id}/followers`,
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
 * @param profileId
 * @returns
 */
export async function getFollowings(
  instance: RequestInstance,
  params: FollowParams,
) {
  return await onRequest<FollowRes>(
    instance,
    `/v1/user/profiles/${params.profile_id}/followings`,
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
