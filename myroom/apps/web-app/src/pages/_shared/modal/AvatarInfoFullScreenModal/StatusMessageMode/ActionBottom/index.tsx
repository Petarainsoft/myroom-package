import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAtom } from 'jotai';
import { ActionCategoryListAtom } from '@/common/stores';
import { EItemCategory1 } from 'client-core';
import { SceneManager } from '@/common/utils/client';
import useItemCategoriesAPI from '@/apis/Meta/ItemCategories';
import useMarketAPI from '@/apis/Meta/Market';
import GalleryOffCanvas, {
  Category,
} from '@/pages/_shared/offcanvas/GalleryOffCanvas';
import { ItemRectCard } from '@/pages/_shared/ui/Cards/ItemRectCard';
import ActionToggleButton from './ActionToggleButton';

let originActionId = '';
const ActionBottom = () => {
  const { fetchItemCategories } = useItemCategoriesAPI();
  const { fetchMarketProductsInfi } = useMarketAPI();
  const [actionStep, setActionStep] = useState<boolean>(true);
  // const [, setEditedStatusActionId] = useAtom(editedStatusActionIdAtom);

  const [currentCategory, setCurrentCategory] = useState<number>(171111);

  const [currentActionId, setCurrentActionId] = useState<string>('');

  const [, setActionCategoryList] = useAtom(ActionCategoryListAtom);

  const {
    data: actionCategoryData,
    isSuccess: isActionCategorySuccess,
    isLoading: isCategoryDataLoading,
  } = fetchItemCategories({
    depth: 3,
    parent_id: EItemCategory1.STATUSANIMATION,
  });

  const { data: itemsData, isSuccess: isItemsSuccess } =
    fetchMarketProductsInfi({
      category: currentCategory.toString(),
      limit: 20,
    });

  React.useEffect(() => {
    SceneManager.Avatar?.makeAvatarManifest((manifest) => {
      if (manifest && manifest.main.animation) {
        originActionId = manifest.main.animation;
        setCurrentActionId(manifest.main.animation);
      }
    });

    return () => {
      SceneManager.Avatar?.playAnimation(originActionId);
    };
  }, []);

  //카테고리 연결
  useEffect(() => {
    if (isCategoryDataLoading || !actionCategoryData) return;
    //상태메시지에 등록된 액션이 있을 때 카테고리 이동 & 해당 액션 선택 표시
    setActionCategoryList(actionCategoryData?.list);
  }, [actionCategoryData, isCategoryDataLoading, setActionCategoryList]);

  const list = useMemo(() => {
    if (isItemsSuccess) {
      return itemsData?.pages.reduce<any>(
        (acc, cur) => acc.concat(cur?.list),
        [],
      );
    }

    return [];
  }, [itemsData, isItemsSuccess]);

  const category = useMemo((): Category[] => {
    if (isActionCategorySuccess && actionCategoryData) {
      return actionCategoryData.list.map<Category>((item) => ({
        id: item._id.toString(),
        textId: item.txt.title.ko,
        selected: item._id === currentCategory,
      }));
    }

    return [];
  }, [actionCategoryData, currentCategory, isActionCategorySuccess]);

  const Item = useCallback(
    (props: any) => {
      if (props.id) {
        return (
          <ItemRectCard
            {...props}
            onClick={() => {
              setCurrentActionId(props.id);
              SceneManager.Avatar?.playAnimation(
                props.id,
                actionStep ? '_02' : '_01',
              );
            }}
          />
        );
      }
    else {
        return null;    
     }
    },
    [actionStep],
  );

  const handleToggle = useCallback(() => {
    const _actionStep = !actionStep;
    setActionStep(_actionStep);
    SceneManager.Avatar?.playAnimation(
      currentActionId,
      _actionStep ? '_02' : '_01',
    );
  }, [actionStep, currentActionId]);

  return (
    <GalleryOffCanvas
      category={category}
      disabledToggle
      disabledMinimize
      actionArea={{
        end: <ActionToggleButton actionStep={actionStep ? '_02' : '_01'} onClick={handleToggle} />,
      }}
      contents={{
        shape: 'rect',
        itemCount: list.length,
        element: (index) => (
          <Item
            id={list[index]?._id}
            thumbnail={list[index]?.resource?.thumbnail}
            selected={currentActionId === list[index]?._id}
            textId={list[index]?.txt?.title?.ko}
          />
        ),
        elementId: (index) => list[index]?._id,
        isItemLoaded: () => {
          return true;
        },
        loadMoreItems: async () => {},
      }}
    />
  );
};

export default ActionBottom;
