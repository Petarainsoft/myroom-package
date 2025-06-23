import onRequest, { RequestInstance } from '@/common/utils/fetch';
import {
  IItemMemoGetRequestParams,
  IItemMemoGetResponseData,
  IItemMemoPatchRequestParams,
  IItemMemoRequestData,
  IItemMemoResponse,
} from './type';

/**
 *
 * @param instance
 * @param data
 * @returns
 * PATCH /v1/social/profiles/me/item-memos 아이템 인스턴스에 첨부된 메모를 제거한다.
 */
export async function patchItemMemo(
  instance: RequestInstance,
  params: IItemMemoPatchRequestParams,
) {
  return await onRequest<IItemMemoResponse>(
    instance,
    `/v1/social/profiles/me/item-memos`,
    {
      method: 'PATCH',
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
 * @param data
 * @returns
 * POST /v1/social/item-memos 메모 생성하기
 */
export async function postItemMemo(
  instance: RequestInstance,
  data: IItemMemoRequestData,
) {
  return await onRequest<IItemMemoResponse>(instance, `/v1/social/item-memos`, {
    method: 'POST',
    data,
    headers: {
      accept: ' application/json',
      'Content-Type': 'application/json',
    },
  });
}

/**
 *
 * @param instance
 * @param data
 * @returns
 * GET /v1/social/profiles/{profile_id}/item-memos 메모 생성하기
 */
export async function getItemMemo(
  instance: RequestInstance,
  params: IItemMemoGetRequestParams,
) {
  return await onRequest<IItemMemoGetResponseData>(
    instance,
    `/v1/social/profiles/${params.profile_id}/item-memos`,
    {
      method: 'GET',
      params: {
        myroom_id: params.myroom_id,
        item_instance_id: params.item_instance_id,
      },
      headers: {
        accept: ' application/json',
        'Content-Type': 'application/json',
      },
    },
  );
}
