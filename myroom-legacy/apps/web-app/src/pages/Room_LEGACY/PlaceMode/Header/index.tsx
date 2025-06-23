import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  currentCtgrAtom,
  uiPlaceModeAtom,
  currentCtgrKeyAtom,
  uiAppBarAtom,
  selectedHeaderAtom,
  initialRoomManifestAtom,
  uiSavePurchaseModeAtom,
  selectedItemAtom,
  uiPlaceModeSheetSizeAtom,
  purchaseItemListAtom,
  editModeAtom,
  initialColorIdxAtom,
  myRoomBgColorAtom,
  selectedScreenItemIdAtom,
} from '@/common/stores';
import { detailedDiff } from 'deep-object-diff';
import { SceneManager } from '@/common/utils/client';
import { selectionCallback } from '../../callbackHelper';
import { logger } from '@/common/utils/logger';
import { itemCategory, skinCategory } from '@/common/utils/json/useCategory';
import { t } from 'i18next';
import CircleButton from '@/components/Buttons/CircleButton';
import Icon from '@/components/Icon';
import HeaderCash from '../../components/HeaderCash';
import usePopup from '@/common/hooks/Popup/usePopup';
import style from './style.module.scss';
import { IDataWebColors } from 'client-core/tableData/defines/System_InternalData';

const Header = (): React.ReactElement => {
  const navigate = useNavigate();
  const { showConfirmPopup } = usePopup();
  const [selectedHeader, setHeaderCategory] = useAtom(selectedHeaderAtom);
  const setPlaceModeSheetSize = useSetAtom(uiPlaceModeSheetSizeAtom);
  const setPlaceMode = useSetAtom(uiPlaceModeAtom);
  const hideAppBar = useSetAtom(uiAppBarAtom);
  const setUiSavePurchaseMode = useSetAtom(uiSavePurchaseModeAtom);
  const setSelectedItem = useSetAtom(selectedItemAtom);
  const setSelectedScreenIdItem = useSetAtom(selectedScreenItemIdAtom);
  const setCurrentCtgr = useSetAtom(currentCtgrAtom);
  const setCurrentCtgrKey = useSetAtom(currentCtgrKeyAtom);
  const setEditMode = useSetAtom(editModeAtom);
  const initialRoomManifest = useAtomValue(initialRoomManifestAtom);
  const initialColorIdx = useAtomValue(initialColorIdxAtom);
  const setMyRoomBgColor = useSetAtom(myRoomBgColorAtom);
  const [purchaseItemList, setPurchaseItemList] = useAtom(purchaseItemListAtom);

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
      // logger.log('BUG header IDataWebColors ', IDataWebColors)
      // logger.log('BUG header initialColorIdx ', initialColorIdx)
      // logger.log('BUG header IDataWebColors[initialColorIdx] ', IDataWebColors[initialColorIdx])
      setMyRoomBgColor(IDataWebColors[initialColorIdx].hex);
      SceneManager.Room?.addCallbackRoomPlacementSelectionChanged(
        selectionCallback,
      );
    });
    navigate('/home');
  };

  const handleCategoryMode = (mode: string) => () => {
    logger.log('handleCategoryMode ');

    if (mode === 'SKIN') {
      logger.log('SKIN ', skinCategory);
      setCurrentCtgr(skinCategory);
      setCurrentCtgrKey('12');
      setHeaderCategory('SKIN');
      setEditMode('MARKET');
    } else if (mode === 'ITEM') {
      logger.log('ITEM ', itemCategory);
      setCurrentCtgr(itemCategory);
      setCurrentCtgrKey('13');
      setHeaderCategory('ITEM');
      setEditMode('MARKET');
    } else if (mode === 'FIGURE') {
      logger.log('FIGURE ');
      // 다른 데이터 씀
      setHeaderCategory('FIGURE');
    }
  };

  const HeaderInfo = (): React.ReactElement => {
    return (
      <div className={style.headerInfoWrapper}>
        <CircleButton
          size="m"
          onClick={handleClickClosePlaceMode}
          className={style.closeBtn}
        >
          <Icon name={`Top_Close`} />
        </CircleButton>
        <HeaderCash />
      </div>
    );
  };

  const NavCate = (): React.ReactElement => {
    return (
      <div className={style.navCategory}>
        <CircleButton
          onClick={handleCategoryMode('SKIN')}
          className={`${style.navBtn}`}
          size="m"
        >
          <Icon
            name={`Deco_Myroom`}
            badge={{ isActive: selectedHeader === 'SKIN' }}
          />
        </CircleButton>
        <CircleButton
          onClick={handleCategoryMode('ITEM')}
          className={`${style.navBtn}`}
          size="m"
        >
          <Icon
            name={`Deco_Itembox_M`}
            badge={{ isActive: selectedHeader === 'ITEM' }}
          />
        </CircleButton>
        <CircleButton
          onClick={handleCategoryMode('FIGURE')}
          className={`${style.navBtn}`}
          size="m"
        >
          <Icon
            name={`Deco_Figure_M`}
            badge={{ isActive: selectedHeader === 'FIGURE' }}
          />
        </CircleButton>
      </div>
    );
  };

  return (
    <React.Fragment>
      <div className={style.headerArea}>
        <HeaderInfo />
        <NavCate />
      </div>
    </React.Fragment>
  );
};

export default Header;
