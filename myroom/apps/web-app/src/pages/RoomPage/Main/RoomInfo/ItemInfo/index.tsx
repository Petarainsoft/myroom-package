import React, { useEffect, useMemo, useRef, useState } from 'react';
import style from '../style.module.scss';
import { SceneManager } from '@/common/utils/client';
import { useAtom, useAtomValue } from 'jotai';
import Icon from '@/components/Icon';
import ItemMemo from './ItemMemo';
import ItemUrl from './ItemUrl';
import useRoom from '@/common/hooks/use-room';
import useItemMemoAPI from '@/apis/Social/ItemMemo';
import useMe from '@/common/hooks/use-me';

interface IItemInfo {
  id: string;
}

const ItemInfo = ({ id }: IItemInfo) => {
  const { fetchItemMemos, mutationPatchItemMemo } = useItemMemoAPI();
  
  const ref = useRef<HTMLDivElement>(null);
  const [isPosReady, setPosReady] = useState(false);
  const [isExistItemInfo, setIsExistItemInfo] = useState(false);
  const {showAlwaysRoomInfo, currentRoomInfo, roomSelectedItem} = useRoom();
  const {meRoomId} = useMe();

  const { data: memoData } = fetchItemMemos({
    profile_id: meRoomId === currentRoomInfo?.id ? 'me' : currentRoomInfo?.ownerId!,
    myroom_id: currentRoomInfo?.id,
    item_instance_id: id,
  });

  const text = useMemo(()=>{
    return memoData && memoData.list.length > 0? memoData.list[0].txt.contents : undefined;
  },[memoData]);

  React.useEffect(() => {
    SceneManager.Room?.addCallbackCanvasPositionEventHandler_Item(
      id,
      (data: any) => {
        setPosReady(true);
        if (ref && ref.current) {
          const translateYValue = Math.round(
            data._y - ref.current.getBoundingClientRect().height,
          );
          const translateXValue = Math.round(
            data._x - ref.current.getBoundingClientRect().width / 2,
          );

          const transformValue = `translate(${translateXValue}px, ${translateYValue}px)`;

          if (
            ref?.current?.style.getPropertyValue('transform') !== transformValue
          ) {
            ref?.current?.style.setProperty('transform', transformValue);
          }
        }
      },
    );

    return () => {
      SceneManager.Room?.clearCallbackCanvasPostionEventHander_Item(id);
      setPosReady(false);
    };
  }, [ref, id]);

  useEffect(() => {
    if (!isExistItemInfo && text) {
      setIsExistItemInfo(true);
    }
  }, [text]);

  useEffect(() => {
    SceneManager.Room?.findItemController(id, (roomController) => {
      const data = roomController?.getItemFunctionData();
      if (!data) return;
      setIsExistItemInfo(!!data.linkUrl);
    });
  }, []);

  if (!isPosReady) return null;

  return (
    <div className={style.positionWrapper}>
      <div className={style.absoluteDiv} ref={ref}>
        {showAlwaysRoomInfo && isExistItemInfo ? (
          <>
            <Icon name="Link_Memo_Balloon_M" />
          </>
        ) : null}
        
        {!showAlwaysRoomInfo && isExistItemInfo && roomSelectedItem?.id === id && (
          <>
            {text && <ItemMemo text={text} />}
            <ItemUrl setIsExistItemInfo={setIsExistItemInfo} instanceId={id} />
          </>
        )}
      </div>
    </div>
  );
};

export default ItemInfo;
