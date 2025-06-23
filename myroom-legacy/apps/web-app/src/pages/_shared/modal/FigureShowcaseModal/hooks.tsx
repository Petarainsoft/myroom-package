import { useCallback } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import {
  selectedHeaderAtom,
  selectedItemAtom,
  uiAppBarAtom,
  uiAvatarModalAtom,
  uiPlaceModeAtom,
} from '@/common/stores';
import useModal from '@/common/hooks/Modal/useModal';
import { useNavigate } from 'react-router-dom';
import { SceneManager } from '@/common/utils/client';
import { placedFigureProfileIdsAtom } from './store';

const useFigureShowcase = () => {
  const navigate = useNavigate();
  const setPlaceMode = useSetAtom(uiPlaceModeAtom);
  const hideAppBar = useSetAtom(uiAppBarAtom);
  const [, setSelectedItem] = useAtom(selectedItemAtom);
  const [placedFigureProfileIds] = useAtom(placedFigureProfileIdsAtom);
  const setHeaderCategory = useSetAtom(selectedHeaderAtom);
  const AvatarInfoFullScreenModal = useModal('AvatarInfoFullScreenModal');
  const FigureShowcaseModal = useModal('FigureShowcaseModal');
  const setUIAvatarModal = useSetAtom(uiAvatarModalAtom);

  /**현재 배치된 피규어인지 판별 */
  const getIsFigureInRoom = (currentProfileId: string) => {
    if (placedFigureProfileIds == null) return null;
    return placedFigureProfileIds.includes(currentProfileId);
  };

  /** 아바타 상세 모달 띄우는 함수*/
  const handleShowAvatarInfoModal = useCallback(
    (profileId: string, avatarId: string | undefined) => {
      AvatarInfoFullScreenModal.createModal({
        profileId,
        avatarId,
      });
      setUIAvatarModal(true);
    },
    [],
  );

  /** 피규어 배치*/
  const handlePlaceFigureItem = useCallback((item: any) => {
    setPlaceMode(true);
    hideAppBar(true);
    FigureShowcaseModal.deleteModal();
    navigate('/rooms/me/place');
    if (!item) return;
    console.log('handleItem', item);
    const id = item._id;
    if (!id) return;
    console.log('handleItem FIGURE', id);
    const timeoutScene = setTimeout(() => {
      SceneManager.Room?.placeNewFigure(item.avatar_id, false);
      SceneManager.Room?.deselectTarget();
    }, 10);
    const timeoutCategory = setTimeout(() => {
      setHeaderCategory('FIGURE');
    }, 10);
    const timeoutSelectItem = setTimeout(() => {
      setSelectedItem(id);
    }, 10);
    return () => {
      clearTimeout(timeoutScene);
      clearTimeout(timeoutCategory);
      clearTimeout(timeoutSelectItem);
    };
  }, []);

  return {
    getIsFigureInRoom,
    handleShowAvatarInfoModal,
    handlePlaceFigureItem,
  };
};

export default useFigureShowcase;
