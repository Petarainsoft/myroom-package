import onRequest, { RequestInstance } from '@/common/utils/fetch';
import { FeedsGetParam, FeedsGetResponse } from './type';

/**
 * 피드 삭제
 */
export async function deleteFeeds(instance: RequestInstance, feedId: string) {
  return await onRequest<any>(instance, `/v1/social/feeds/${feedId}`, {
    method: 'DELETE',
    headers: {
      accept: ' application/json',
      'Content-Type': 'application/json',
    },
  });
}
/**
 * 피드 리스트 조회.
 * @param instance
 * @param params
 * @returns
 */
export async function getFeeds(
  instance: RequestInstance,
  profile_id: string,
  params: FeedsGetParam,
) {
  return await onRequest<FeedsGetResponse>(
    instance,
    `/v1/social/profiles/${profile_id}/feeds`,
    {
      method: 'GET',
      params,
      headers: {
        accept: ' application/json',
        'Content-Type': 'application/json',
      },
      mock: false,
    },
  );
}
