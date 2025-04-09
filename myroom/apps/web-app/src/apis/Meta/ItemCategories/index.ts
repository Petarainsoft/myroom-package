import { useQuery } from '@tanstack/react-query';
import { instance } from '@/common/utils/axios';
import { ItemCategoryPrams } from './type';
import { getItemCategories } from './fetch';

const useItemCategoriesAPI = () => {
  /**
   * /v1/meta/item-categories
   * 아이템 카테고리 조회 (현재 DB의 아이템 내 카테고리와 매칭되지 않음)
   */

  const fetchItemCategories = (params: ItemCategoryPrams) => {
    return useQuery(
      ['fetchItemCategories', params.parent_id],
      async () => await getItemCategories(instance, params),
    );
  };

  return {
    fetchItemCategories,
  };
};

export default useItemCategoriesAPI;
