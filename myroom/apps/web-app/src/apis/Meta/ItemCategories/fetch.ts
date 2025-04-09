import onRequest, { RequestInstance } from '@/common/utils/fetch';
import { ItemCategoryPrams, ItemCategoriesRes } from './type';

/**
 * @param instance
 * @param params
 * @returns
 */

export async function getItemCategories(
  instance: RequestInstance,
  params: ItemCategoryPrams,
) {
  return await onRequest<ItemCategoriesRes>(
    instance,
    `/v1/meta/item-categories`,
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
