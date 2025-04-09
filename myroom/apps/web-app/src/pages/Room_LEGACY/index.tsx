import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  initialColorIdxAtom,
  initialRoomManifestAtom,
  isAvatarModalOpenAtom,
  isItemModalOpenAtom,
  myRoomBgColorAtom,
  purchaseItemListAtom,
  selectedItemAtom,
  selectedScreenItemIdAtom,
  uiAppBarAtom,
  uiHomeZoomInAtom,
  uiPlaceModeAtom,
  uiPlaceModeSheetSizeAtom,
  uiSavePurchaseModeAtom,
  uiProfileAtom, 
} from '@/common/stores';
import RoomScene from './RoomScene';
import { SceneManager } from '@/common/utils/client';
import useRoom from './useRoom';
import useSelectionEvent from './useSelectionEvent';
import View from '../_shared/layouts/View';
import { logger } from '@/common/utils/logger';
import { IDataWebColors } from 'client-core/tableData/defines/System_InternalData';
import { selectionCallback } from './callbackHelper';
import { detailedDiff } from 'deep-object-diff';
import usePopup from '@/common/hooks/Popup/usePopup';
import { t } from 'i18next';
import RoomProfile from '../_shared/ui/Profiles/RoomProfile';
import useModal from '@/common/hooks/Modal/useModal';
import Icon from '@/components/Icon';
import { useOffCanvasOpenAndClose } from '@/common/utils/common.hooks';
import CustomButton from '@/components/Buttons/CustomButton';
import useRoomInfo from './useRoomInfo';
import useNewRoom from '@/common/hooks/use-room';

const Room = () => {
  const setIsZoomIn = useSetAtom(uiHomeZoomInAtom);
  const { roomOwnerNickName, roomOwnerThumnail } = useRoomInfo();
  const { currentRoomInfo } = useNewRoom();
  //---
  const navigate = useNavigate();
  const { showConfirmPopup } = usePopup();
  const setPlaceModeSheetSize = useSetAtom(uiPlaceModeSheetSizeAtom);
  const [placeMode, setPlaceMode] = useAtom(uiPlaceModeAtom);
  const hideAppBar = useSetAtom(uiAppBarAtom);
  const setUiSavePurchaseMode = useSetAtom(uiSavePurchaseModeAtom);
  const setSelectedItem = useSetAtom(selectedItemAtom);
  const setSelectedScreenIdItem = useSetAtom(selectedScreenItemIdAtom);
  const initialColorIdx = useAtomValue(initialColorIdxAtom);
  const setMyRoomBgColor = useSetAtom(myRoomBgColorAtom);
  const initialRoomManifest = useAtomValue(initialRoomManifestAtom);
  const [purchaseItemList, setPurchaseItemList] = useAtom(purchaseItemListAtom);
  const isAvatarModal = useAtomValue(isAvatarModalOpenAtom);
  const isItemModal = useAtomValue(isItemModalOpenAtom);

  useRoom();
  useSelectionEvent();

  const setUiProfile = useSetAtom(uiProfileAtom);
  const { handleOffCanvasOpen } = useOffCanvasOpenAndClose(setUiProfile);
  const isOwnRoom = currentRoomInfo?.mine;

  const handleProfile = () => {
    logger.log('handleProfile ');
    handleOffCanvasOpen();
  };


  const handleClickClosePlaceMode = () => {
    SceneManager.Room?.makeMyRoomManifest((updatedManifest) => {
      if (!updatedManifest) return;

      // 변경된 사항 있는지 확인.
      const diff = detailedDiff(initialRoomManifest, updatedManifest);
      if (
        Object.keys(diff.added).length > 0 ||
        Object.keys(diff.deleted).length > 0 ||
        Object.keys(diff.updated).length > 0
      ) {
        showConfirmPopup({
          titleText: t('GCM.000016'),
          contentText: t('GCM.000017'),
          cancelText: t('GCM.000019'),
          confirmText: t('GCM.000018'),
          onConfirm: closePlaceMode,
        });
      } else {
        closePlaceMode();
      }
    });
  };

  /** 배치모드 종료 시 초기화  */
  const closePlaceMode = () => {
    logger.log('closePlaceMode1');
    SceneManager.Room?.endMyRoomPlacementMode();
    setPlaceMode(false);
    hideAppBar(false);
    setUiSavePurchaseMode('S');
    setSelectedItem('');
    setSelectedScreenIdItem('');
    setPlaceModeSheetSize(false);

    const purchaseListIsNotEmpty = purchaseItemList.length > 0;
    if (purchaseListIsNotEmpty) {
      setPurchaseItemList([]);
    }

    SceneManager.Room?.clearMyRoom();
    SceneManager.Room?.initializeMyRoom(initialRoomManifest, false, () => {
      setMyRoomBgColor(IDataWebColors[initialColorIdx].hex);
      SceneManager.Room?.addCallbackRoomPlacementSelectionChanged(
        selectionCallback,
      );
    });
    navigate('/home');
  };

  React.useEffect(() => {
    if (SceneManager.isInit('ROOM')) {
      SceneManager.Room?.addCameraDistanceChangeEventHandler((dist) => {
        if (dist < 0.98) setIsZoomIn(true);
        else setIsZoomIn(false);
      });
    }

    return () => {
      if (SceneManager.isInit('ROOM')) {
        SceneManager.Room?.clearDistanceChangeEventHandler();
      }
    };
  }, []);

  const InfoArea = (): React.ReactNode => {
    if (placeMode) return <></>;
    else
      return <RoomProfile />;
  };

  return (
    <View
      disableHeader={isAvatarModal || isItemModal}
      disableNavigation={placeMode}
      headerOptions={{
        closeOptions: {
          icon: 'x',
          onClick: handleClickClosePlaceMode,
          disabled: !placeMode,
        },
        startArea: <InfoArea />,
        float: true,
        endArea: !placeMode && <CustomButton onClick={handleProfile}><Icon name={isOwnRoom ? `Top_Menu_M` : 'Top_Menu_User_M'} /></CustomButton>
      }}
    >
      <RoomScene />
      <Outlet />
    </View>
  );
};

export default Room;
