import { useEffect, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import {
  EditedStatusImageAtom,
  EditedStatusMessageInputAtom,
} from '@/common/stores';
import StatusImage from './Status/StatusImage';
import StatusMessage from './Status/StatusMessage';
import StatusNone from './Status/StatusNone';
import style from './style.module.scss';
import { SceneManager } from '@/common/utils/client';

enum EReceivedStateSlide {
  MESSAGE, // 상메 메시지 값 있을 때
  IMAGE, // 상메 이미지 값 있을 때
  NONE, // 상메 값 없을 때
}

const StatusComponent = {
  [EReceivedStateSlide.MESSAGE]: <StatusMessage />,
  [EReceivedStateSlide.IMAGE]: <StatusImage />,
  [EReceivedStateSlide.NONE]: <StatusNone />,
};

type MessageProps = {
  avatarId: string;
}
const Message = ({avatarId}:MessageProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const editedStatusImage = useAtomValue(EditedStatusImageAtom);
  const editedStatusMessageInput = useAtomValue(EditedStatusMessageInputAtom);
  const [receivedStateSlide, setReceivedStateSlide] =
    useState<EReceivedStateSlide>(EReceivedStateSlide.NONE);

  useEffect(() => {
    if (!editedStatusImage && !editedStatusMessageInput) {
      setReceivedStateSlide(EReceivedStateSlide.NONE);
      return;
    }
    if (Boolean(editedStatusImage)) {
      setReceivedStateSlide(EReceivedStateSlide.IMAGE);
      return;
    }
    if (editedStatusMessageInput) {
      setReceivedStateSlide(EReceivedStateSlide.MESSAGE);
      return;
    }
  }, [editedStatusImage, editedStatusMessageInput]);

  useEffect(() => { 
    SceneManager.Avatar?.addCallbackCanvasPositionEventHandler_Figure_Top(avatarId, (pos) => { 
      if (ref && ref.current) {
        const translateYValue = Math.round(
          pos._y - ref.current.getBoundingClientRect().height,
        );
        const translateXValue = Math.round(
          pos._x - ref.current.getBoundingClientRect().width / 2,
        );

        const transformValue = `translate(${translateXValue}px, ${translateYValue}px)`;

        if (
          ref?.current?.style.getPropertyValue('transform') !== transformValue
        ) {
          ref?.current?.style.setProperty('transform', transformValue);
        }
      }
    });
    
    return () => { 
      SceneManager.Avatar?.clearCallbackCanvasPostionEventHander_Figure_Top(avatarId);
    }
  }, [avatarId]);

  return (
    <>
      <div
        className={`${receivedStateSlide !== EReceivedStateSlide.NONE
          ? style.statusReceivedWrapper
          : 'statusSwiperWrapper'
          }`}
        ref={ref}
      >
        {StatusComponent[receivedStateSlide]}
      </div>
    </>
  );
};

export default Message;
