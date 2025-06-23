import React from 'react';
import {
  useAtom,
  useAtomValue,
  useSetAtom
} from 'jotai';
import {
  currentCtgrAtom,
  currentCtgrKeyAtom,
  selectedHeaderAtom,
  uiPlaceModeAtom,
  isPlaceModeRefreshedAtom,
  editModeAtom,
  uiAppBarAtom
} from '@/common/stores';
import { logger } from '@/common/utils/logger';
import { itemCategory } from '@/common/utils/json/useCategory';
import { SceneManager } from '@/common/utils/client';
import useItemAPI from '@/apis/Meta/Item';

const usePlaceMode = () => {
  const [placeMode, setPlaceMode] = useAtom(uiPlaceModeAtom);
  const setCurrentCtgr = useSetAtom(currentCtgrAtom); // 현재 적용 카테고리
  const setCurrentCtgrKey = useSetAtom(currentCtgrKeyAtom);
  const setHeaderCategory = useSetAtom(selectedHeaderAtom);
  const setEditMode = useSetAtom(editModeAtom);
  const hideAppBar = useSetAtom(uiAppBarAtom);
  const isPlaceModeRefreshed = useAtomValue(isPlaceModeRefreshedAtom); // 배치모드 내 새로고침 여부

  const currentCtgrKey = useAtomValue(currentCtgrKeyAtom);
  const { fetchMeItems } = useItemAPI(); // 보유 중 아이템
  const { refetch: refetchUserItems } = fetchMeItems({ category: currentCtgrKey, limit: 1000 });

  /** 5. 현재 페이지가 특정 모드일 경우 처리 */
  React.useEffect(() => {
    logger.log('effect PlaceMode isPlaceModeRefreshed2 ', isPlaceModeRefreshed)
    if (!isPlaceModeRefreshed) return;
    setCurrentCtgr(itemCategory);
    setCurrentCtgrKey('13');
    setHeaderCategory('ITEM');
    setEditMode('MARKET');
    setPlaceMode(true);
    hideAppBar(true);
    refetchUserItems();

  }, [isPlaceModeRefreshed])

  React.useEffect(() => {
    logger.log('effect PlaceMode isPlaceModeRefreshed ')
    setCurrentCtgr(itemCategory);
    setCurrentCtgrKey('13');
    setHeaderCategory('ITEM');
    setEditMode('MARKET');
    setPlaceMode(true);
    SceneManager.Room?.startMyRoomPlacementMode();
    return () => { };
  }, []);


  return {
    placeMode
  }
};

export default usePlaceMode;