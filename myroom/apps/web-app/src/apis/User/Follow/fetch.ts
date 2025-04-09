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

/**
 *
 * @param instance
 * @returns
 */
export async function getMeFollowings(instance: RequestInstance, params: any) {
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
