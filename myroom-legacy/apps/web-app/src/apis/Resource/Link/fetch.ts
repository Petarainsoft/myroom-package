import onRequest, { RequestInstance } from '@/common/utils/fetch';
import { linkResponse } from './type';

/**
 *
 * @param instance
 * @param url
 * @returns
 */
export async function getLink(instance: RequestInstance, url: string) {
  return await onRequest<linkResponse>(instance, `/v1/resource/links/${url}`, {
    method: 'GET',
    params: { link_id: url },
    headers: {
      accept: ' application/json',
      'Content-Type': 'application/json',
    },
  });
}
