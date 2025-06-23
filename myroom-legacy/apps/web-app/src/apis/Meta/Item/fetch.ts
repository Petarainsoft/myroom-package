import onRequest, { RequestInstance } from '@/common/utils/fetch';
import {
  UploadItemData,
  ItemUploadParams,
  ItemResponse,
  ItemsParams,
  ItemsResponse,
  MeItemsParams,
  MeItemsResponse,
  MeItemResponse,
} from './type';

/**
 *
 * @param instance
 * @param instanceId
 * @param data
 * @returns
 */
export async function postItem(
  instance: RequestInstance,
  itemId: string,
  params: ItemUploadParams,
  data: UploadItemData,
) {
  return await onRequest<any>(instance, `/v1/meta/items/${itemId}`, {
    method: 'POST',
    params,
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
 * @param itemId
 * @param params
 * @returns
 */
export async function getItem(instance: RequestInstance, itemId?: string) {
  return await onRequest<ItemResponse>(instance, `/v1/meta/items/${itemId}`, {
    method: 'GET',
    params: { item_id: itemId },
    headers: {
      accept: ' application/json',
      'Content-Type': 'application/json',
    },
  });
}

/**
 *
 * @param instance
 * @param params
 * @returns
 */
export async function getItems(instance: RequestInstance, params: ItemsParams) {
  return await onRequest<ItemsResponse>(instance, `/v1/meta/items`, {
    method: 'GET',
    params,
    headers: {
      accept: ' application/json',
      'Content-Type': 'application/json',
    },
  });
}



/**
 *
 * @param instance
 * @param params
 * @returns
 */
export async function getMeItems(instance: RequestInstance, params: MeItemsParams) {
  return await onRequest<MeItemsResponse>(instance, `/v1/meta/profiles/me/items`, {
    method: 'GET',
    params,
    headers: {
      accept: ' application/json',
      'Content-Type': 'application/json',
    },
  });
}

/**
 *
 * @param instance
 * @param id
 * @returns
 */
export async function getMeItem(instance: RequestInstance, id?: string) {
  return await onRequest<MeItemResponse>(instance, `/v1/meta/profiles/me/items/${id}`, {
    method: 'GET',
    headers: {
      accept: ' application/json',
      'Content-Type': 'application/json',
    },
  });
}
