import React, { useEffect, useRef, useState } from 'react';
import style from '../style.module.scss';
import { SceneManager } from '@/common/utils/client';
import { useAtom } from 'jotai';
import { uiStatusMsgShowAtom } from '@/common/stores';
import Icon from '@/components/Icon';
import ItemMemo from '../ItemMemo';
import ItemUrl from '../ItemUrl';

interface IItemInfo {
  id: string;
  text?: string;
}

const ItemInfo = ({ id, text }: IItemInfo) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isPosReady, setPosReady] = useState(false);
  const [isExistItemInfo, setIsExistItemInfo] = useState(false);
  const [statusMsgShow] = useAtom(uiStatusMsgShowAtom);

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
        {statusMsgShow && isExistItemInfo ? (
          <>
            <Icon name="Link_Memo_Balloon_M" />
          </>
        ) : null}
        {/** 메모 내용 상세 / 메모 exist 아이콘 / null */}
        {/* {statusMsgShow ? (
          <>
            {text && <ItemMemo text={text} />}
            <ItemUrl setIsExistItemInfo={setIsExistItemInfo} instanceId={id} />
          </>
        ) : isExistItemInfo ? (
          <>
            <Icon name="Link_Memo_Balloon_M" />
          </>
        ) : null} */}
      </div>
    </div>
  );
};

export default ItemInfo;
