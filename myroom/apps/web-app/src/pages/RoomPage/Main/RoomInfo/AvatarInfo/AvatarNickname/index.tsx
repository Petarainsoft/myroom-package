import React, { useRef } from 'react';
import { SceneManager } from '@/common/utils/client';
import useAvatarNickname from './hooks';
import styles from './styles.module.scss';
import useRoom from '@/common/hooks/use-room';
import useItemPosition from '@/common/hooks/use-item-position';
interface IAvatarStatusMessage {
  id: string;
  profileId: string;
}
const AvatarNickname = ({ id, profileId }: IAvatarStatusMessage) => {
  const { nickname } = useAvatarNickname(profileId);
  const { currentRoomInfo, showAlwaysRoomInfo, roomSelectedItem } = useRoom();

  const {ref, callbackCanvasPositionEvent} = useItemPosition();
  
  React.useEffect(() => {
    SceneManager.Room?.addCallbackCanvasPositionEventHandler_Figure_Bottom(id, callbackCanvasPositionEvent);

    return () => {
      SceneManager.Room?.clearCallbackCanvasPostionEventHander_Figure_Bottom(id);
    };
  }, [ref, id]);

  return (
    <div className={styles['positionWrapper']}>
      <div className={styles['wrap']} ref={ref}>
        {(showAlwaysRoomInfo || roomSelectedItem?.id === id ) && (
          <>
            {currentRoomInfo?.ownerId === profileId && (
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
