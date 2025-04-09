import React from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  uiPlaceModeAtom,
  avatarInfoMapAtom,
  uiAvatarModalAtom,
  selectedClientItemAtom,
  reqAvatarIdAtom,
  reqAvatarVersionAtom,
  selectedScreenItemAtom,
  purchaseItemListAtom,
  currentMyRoomIdAtom,
} from '@/common/stores';
import { useAtomCallback } from 'jotai/utils';
import { messageClient } from '@/common/utils/client';
import { SceneManager } from '@/common/utils/client';
import { logger } from '@/common/utils/logger';
import useModal from '@/common/hooks/Modal/useModal';
import useMe from '@/common/hooks/use-me';
import { ItemController } from 'client-core';
import useMyRoomAPI from '@/apis/Space/MyRoom';

/** 3D 영역에서 일어나는 PointerEvent 콜백 부분. -배치/홈 포함 */
const useSelectionEvent = (itemModalFunction?: (controller?: ItemController) => void) => {

  const ItemFullScreenModal = useModal('ItemFullScreenModal');
  const { meProfileId } = useMe();
  const AvatarInfoFullScreenModal = useModal('AvatarInfoFullScreenModal');

  const { fetchMyroom } = useMyRoomAPI();

  const currentRoomId = useAtomValue(currentMyRoomIdAtom); // 현재 로딩된 마이룸 아이디
  const setUIAvatarModal = useSetAtom(uiAvatarModalAtom);
  const setReqAvatarId = useSetAtom(reqAvatarIdAtom);
  const setReqAvatarVersion = useSetAtom(reqAvatarVersionAtom);
  const setSelectedClientItem = useSetAtom(selectedClientItemAtom);
  const setSelectedScreenItem = useSetAtom(selectedScreenItemAtom);
  const [purchaseItemList, setPurchaseItemList] = useAtom(purchaseItemListAtom);


  const { data: myRoomData } = fetchMyroom(currentRoomId);

  const setCurrentSelectInfoCallback = useAtomCallback(
    (get, set, payload: any) => {
      logger.log(set); // set 지우면 인자위치 바뀌어서 버그남, 추후 정리
      const placeMode = get(uiPlaceModeAtom);
      const avatarMap = get(avatarInfoMapAtom);
      logger.log('SelectionChanged payload cb ', payload);
      logger.log('SelectionChanged placeMode ', placeMode);

      /** 배치모드/홈 구분 */
      if (placeMode) {
        /** 배치모드 인 경우, 아이템 조작을 위한 아이디 설정 (itemId X, 클라 내부에서 쓰는 아이디) */

        setSelectedClientItem(payload._id);
        if (payload._isFigure) {
          setSelectedScreenItem(['FIGURE', payload._id]);
        } else {
          setSelectedScreenItem(['ITEM', payload._id]);
        }

        // 230920 TODO : 드래그해서 아이템 제거 시, 구매리스트 연동 필요
        // 선택된 아이디 있을 시, 리스트 목록에 없으면 구매리스트에서 제거
        SceneManager.Room?.getAllItemIds((ids) => {
          logger.log('SelectionChanged placedList ', ids);
          logger.log('SelectionChanged purchaseItemList ', purchaseItemList);
        })

      } else {
        if (!payload._id && !payload._itemId) return;
        if (!payload._isFigure && payload._itemId) {
          setSelectedClientItem(payload._id);

          SceneManager.Room?.findItemController(payload._id, (controller) => {
            if (itemModalFunction) itemModalFunction(controller);
            else {
              ItemFullScreenModal.createModal({
                itemId: controller?.getItemId(),
                itemInstanceId: controller?.getItemInstanceId(),
                mode: 'VIEW',
              });
            }
          });
        }
        if (payload._isFigure && avatarMap.hasOwnProperty(payload._id)) {
          /** 배치모드 아닌 경우, 아바타,피규어 클릭 시 아바타 모달 생성 */
          logger.log('SelectionChanged avatarMap ', avatarMap);
          setReqAvatarId(payload._id);
          setReqAvatarVersion(avatarMap[payload._id].version);

          AvatarInfoFullScreenModal.createModal({
            profileId:
              avatarMap[payload._id].profileId === meProfileId
                ? 'me'
                : avatarMap[payload._id].profileId,
            isOwner: avatarMap[payload._id].profileId === myRoomData?.data?.profile_id,
            avatarId: payload._id,
          });
          setUIAvatarModal(true);
          //hideAppBar(true);
        }
      }
    },
  );

  React.useEffect(() => {
    const listener = async (payload: any) => {
      setCurrentSelectInfoCallback(payload);
    };
    messageClient.addListener('C2W-SelectionChanged', listener);
    return () => {
      messageClient.removeListener('C2W-SelectionChanged', listener);
    };
  }, [meProfileId, myRoomData, setCurrentSelectInfoCallback]);

}

export default useSelectionEvent;

