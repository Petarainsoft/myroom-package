import { useEffect, useRef, useState } from 'react';
import style from './style.module.scss';
import StatusMessageText from './StatusMessageText';
import StatusMessageImage from './StatusMessageImage';
import useStatusMessageInClickMode from './useStatusMessage';
import { SceneManager } from '@/common/utils/client';

enum EStatusMessageType {
  MESSAGE,
  IMAGE,
  NONE,
}

interface IStatusMessage {
  profileId: string;
  avatarId: string;
}

const StatusMessage = ({ profileId, avatarId }: IStatusMessage) => {
  const ref = useRef<HTMLDivElement>(null);
  const [statusMessageType, setStatusMessageType] = useState(
    EStatusMessageType.NONE,
  );
  const { text, imageId } = useStatusMessageInClickMode(profileId);
  const StatusMessageComponent = {
    [EStatusMessageType.MESSAGE]: (
      <div className={style.statusWrapper}>
        <StatusMessageText text={text} />
      </div>
    ),
    [EStatusMessageType.IMAGE]: (
      <div className={style.statusWrapper}>
        <StatusMessageImage id={imageId} />
      </div>
    ),
    [EStatusMessageType.NONE]: <></>,
  };
  useEffect(() => {
    if (!imageId && !text) {
      setStatusMessageType(EStatusMessageType.NONE);
      return;
    }
    if (imageId) {
      setStatusMessageType(EStatusMessageType.IMAGE);
      return;
    }
    if (text) {
      setStatusMessageType(EStatusMessageType.MESSAGE);
      return;
    }    
  }, [text, imageId]);

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
    <div className={style.statusContainer} ref={ref}>
      {StatusMessageComponent[statusMessageType]}
    </div>
  );
};

export default StatusMessage;
