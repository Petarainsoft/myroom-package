import React, { useRef } from 'react';
import { SceneManager } from '@/common/utils/client';
import useAvatarNickname from './hooks';
import useRoomInfo from '@/pages/Room_LEGACY/useRoomInfo';
import styles from './styles.module.scss';
interface IAvatarStatusMessage {
  id: string;
  profileId: string;
  isShow: boolean;
}
const AvatarNickname = ({ isShow, id, profileId }: IAvatarStatusMessage) => {
  const { nickname } = useAvatarNickname(profileId);
  const ref = useRef<HTMLDivElement>(null);
  const [isPosReady, setPosReady] = React.useState(false);
  const { roomOwnerProfileId } = useRoomInfo();

  React.useEffect(() => {
    SceneManager.Room?.addCallbackCanvasPositionEventHandler_Figure_Bottom(
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
      SceneManager.Room?.clearCallbackCanvasPostionEventHander_Figure_Bottom(
        id,
      );
      setPosReady(false);
    };
  }, [ref, id]);

  return (
    <div className={styles['positionWrapper']}>
      <div className={styles['wrap']} ref={ref}>
        {isPosReady && isShow && (
          <>
            {roomOwnerProfileId === profileId && (
              <div className={styles['roomOwner']}>
                <p>👑</p>
              </div>
            )}
            <div className={styles['nickname']}>{nickname}</div>
          </>
        )}
      </div>
    </div>
  );
};

export default AvatarNickname;
