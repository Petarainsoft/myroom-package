import React from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { 
  purchaseItemListAtom, 
  roomObjectAtom, 
  selectedScreenItemAtom, 
  selectedScreenItemIdAtom, 
  uiSavePurchaseModeAtom 
} from '@/common/stores';
import useModal from '@/common/hooks/Modal/useModal';
import { logger } from '@/common/utils/logger';
import { SceneManager } from '@/common/utils/client';
import CircleButton from '@/components/Buttons/CircleButton';
import Icon from '@/components/Icon';
import style from './style.module.scss';

interface ChildProps {
  removeId: string;
  setRemoveId: React.Dispatch<React.SetStateAction<string>>;
  removeClicked: boolean;
  setRemoveClicked: React.Dispatch<React.SetStateAction<boolean>>;
}

const ItemActionOpt: React.FC<ChildProps> = ({
  removeId,
  setRemoveId,
  removeClicked,
  setRemoveClicked,
}): React.ReactElement => {
  const ItemFullScreenModal = useModal('ItemFullScreenModal');
  const [purchaseItemList, setPurchaseItemList] = useAtom(purchaseItemListAtom);
  const [uiSavePurchaseMode, setUISavePurchaseMode] = useAtom(
    uiSavePurchaseModeAtom,
  );
  const selectedScreenItem = useAtomValue(selectedScreenItemAtom);
  const selectedScreenItemId = useAtomValue(selectedScreenItemIdAtom);
  const [roomObjects,setRoomObjects] = useAtom(roomObjectAtom);
  const handleAction = (actionType: string) => () => {
    logger.log('handleAction ', actionType);
    if (actionType === 'SETTING') {
      // figure 일 시 아이템씬 열지 않음,  todo : 설정버튼 아예 안나오도록 차후변경
      if ('FIGURE' !== selectedScreenItem[0]) {
        SceneManager.Room?.findItemController(
          selectedScreenItem[1],
          (controller) => {
            ItemFullScreenModal.createModal({
              itemId: controller?.getItemId(),
              itemInstanceId: controller?.getItemInstanceId(),
              mode: 'SETTING',
            });
          },
        );
      }
    } else if (actionType === 'ROTATE') {
      SceneManager.Room?.rotateSelectedItemOrFigure();
    } else if (actionType === 'REMOVE') {
      logger.log('removed ', selectedScreenItem);

      if ('FIGURE' === selectedScreenItem[0])
      SceneManager.Room?.removeFigure(selectedScreenItem[1]);
      else SceneManager.Room?.removeItem(selectedScreenItem[1]);
      setRemoveId(selectedScreenItem[1]);
      setRemoveClicked(!removeClicked);
      SceneManager.Room?.getAllItemIds((ids) => setRoomObjects(ids));
    }
  };

    /** 아이템 제거 시 구매리스트 변경 */
    React.useEffect(() => {
      logger.log('handleRemove removeid ', removeId);
      logger.log('handleRemove selectedScreenItemId ', selectedScreenItemId);
      
      if (roomObjects.length === 0) {
        setUISavePurchaseMode('S');
        setPurchaseItemList([]);
      } else {
        const itemList = purchaseItemList.filter((purchaseItemList) => purchaseItemList._id !== selectedScreenItemId)
        setPurchaseItemList(itemList);
        
        // const isRemaingItemInPurchaseList: MarketProductData[] = [];
        // /** 룸 아이템 중, 구매리스트 있는 것 필터링 */
        // roomObjects.map((placedItemId) => {
        //   const roomItemInPurchaseList = purchaseItemList.filter(
        //     (purchaseItem) => purchaseItem._id === placedItemId,
        //     );
        //     isRemaingItemInPurchaseList.push(...roomItemInPurchaseList);
        //   });
        // logger.log('handleRemove isRemaingItemInPurchaseList ', isRemaingItemInPurchaseList);
        // if (isRemaingItemInPurchaseList.length > 0) {
        //   /** 위 값을 고유값당 1개로 변환 */
        //   const deDuplicatedPurchaseList = isRemaingItemInPurchaseList.filter(
        //     (item, idx, self) => self.indexOf(item) === idx,
        //   );
        //   setPurchaseItemList(deDuplicatedPurchaseList);
        //   setUISavePurchaseMode('P');
        // } else {
        //   setUISavePurchaseMode('S');
        // }
      }
    }, [removeClicked]);

  return (
    <div className={style.actionContainer}>
      {'FIGURE' !== selectedScreenItem[0] 
        ? <CircleButton
            onClick={handleAction('SETTING')}
            className={` ${style.actionOption}`}
            size="xl"
            shape="circle"
          >
            <Icon name={`Setting_M`} />
          </CircleButton>
        : <></>
      }
      <CircleButton
        onClick={handleAction('ROTATE')}
        className={`${style.actionBtn} ${style.actionOption}`}
        size="xl"
        shape="circle"
      >
        <Icon name={`rotation`} />
      </CircleButton>
      {'FIGURE' !== selectedScreenItem[0] 
        ? <CircleButton
            onClick={handleAction('REMOVE')}
            className={` ${style.actionOption}`}
            size="xl"
            shape="circle"
          >
            <Icon name={`Erase_M`} />
          </CircleButton>
        : <></>
      }
    </div>
  );
};

export default ItemActionOpt;
