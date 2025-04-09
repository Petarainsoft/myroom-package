import onRequest, { RequestInstance } from '@/common/utils/fetch';
import { CashResponse } from './type';

/**
 * 내 캐시 조회
 * GET/v1/billing/profiles/me/cash
 * @param instance
 * @param id
 * @returns
 */
export async function getCash(instance: RequestInstance) {
  return await onRequest<CashResponse>(
    instance,
    `/v1/billing/profiles/me/cash`,
    {
      method: 'GET',
      headers: {
        accept: ' application/json',
        'Content-Type': 'application/json',
      },
    },
  );
}
