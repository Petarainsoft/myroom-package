import React, { useCallback, useRef } from 'react';
import { SceneManager } from '@/common/utils/client';
import useRoomAvatarStatusMessage from './useRoomAvatarStatusMessage';
import useMe from '@/common/hooks/use-me';
import Icon from '@/components/Icon';
import useRoomInfo from '@/pages/Room_LEGACY/useRoomInfo';
import StatusMessageImage from '@/pages/_shared/modal/AvatarInfoFullScreenModal/MainMode/StatusMessage/StatusMessageImage';
import StatusMessageText from '@/pages/_shared/modal/AvatarInfoFullScreenModal/MainMode/StatusMessage/StatusMessageText';
import style from '../style.module.scss';

interface IAvatarStatusMessage {
  id: string;
  profileId: string;
}
const AvatarStatusMessage = ({ id, profileId }: IAvatarStatusMessage) => {
  const { text, imageId } = useRoomAvatarStatusMessage(profileId);
  const { meProfileId } = useMe();
  const { roomOwnerProfileId } = useRoomInfo();
  const ref = useRef<HTMLDivElement>(null);
  const [isPosReady, setPosReady] = React.useState(false);

  React.useEffect(() => {
    SceneManager.Room?.addCallbackCanvasPositionEventHandler_Figure_Top(
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
      SceneManager.Room?.clearCallbackCanvasPostionEventHander_Figure_Top(id);
      setPosReady(false);
    };
  }, [ref, id]);

  React.useEffect(() => {
    /** StatusMessage 요소 준비되면 Callback 연결 */
  }, []);

  const Status = useCallback(() => {
    // isPosReady, 위치값 확인 이전까지 표시불가하도록 처리
    if ((!text && !imageId) || !isPosReady) {
      return <></>;
    }

    /**암시 주석 */

    // if (
    //   (roomOwnerProfileId == meProfileId &&
    //     (profileId == meProfileId || profileId == 'me')) ||
    //   profileId == roomOwnerProfileId
    // ) {
    //   if (text) {
    //     return (
    //       <div className={style.roomStatusMessage}>
    //         <StatusMessageText text={text} />
    //       </div>
    //     );
    //   }
    //   if (imageId) {
    //     return (
    //       <div className={style.roomStatusMessage}>
    //         <StatusMessageImage id={imageId} />
    //       </div>
    //     );
    //   }
    // } else {
    return (
      <div className={style.messageIconWrapper}>
        <Icon name="Action_Message_Balloon_M" />
      </div>
    );
    // }

    return <></>;
  }, [text, imageId, profileId, meProfileId, isPosReady, roomOwnerProfileId]);

  return (
    <div className={style.positionWrapper}>
      <div className={style.absoluteDiv} ref={ref}>
        <Status />
      </div>
    </div>
  );
};

export default AvatarStatusMessage;
